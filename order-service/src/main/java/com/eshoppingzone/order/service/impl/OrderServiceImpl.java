package com.eshoppingzone.order.service.impl;

import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.inventory.StockConfirmRequest;
import com.eshoppingzone.common.dto.inventory.StockReleaseRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationResponse;
import com.eshoppingzone.common.dto.order.OrderCancelRequest;
import com.eshoppingzone.common.dto.order.OrderCreateRequest;
import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.order.OrderItemDto;
import com.eshoppingzone.common.dto.payment.PaymentDto;
import com.eshoppingzone.common.dto.payment.PaymentInitiateRequest;
import com.eshoppingzone.common.dto.payment.RefundRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.profile.AddressDto;
import com.eshoppingzone.common.enums.OrderStatus;
import com.eshoppingzone.common.enums.PaymentMethod;
import com.eshoppingzone.common.enums.PaymentStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.event.OrderCancelledEvent;
import com.eshoppingzone.common.event.OrderConfirmedEvent;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.order.client.*;
import com.eshoppingzone.order.entity.Order;
import com.eshoppingzone.order.entity.OrderItem;
import com.eshoppingzone.order.repository.OrderRepository;
import com.eshoppingzone.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final DeliveryClient deliveryClient;
    private final ProfileClient profileClient;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    @Override
    @Transactional
    public OrderDto createOrder(OrderCreateRequest request, Long customerId, String username, String email) {
        log.info("Initiating checkout saga for customer ID: {}", customerId);

        // 1. Fetch address details snapshot
        String addressSnapshot = "Address ID: " + request.getShippingAddressId();
        try {
            AddressDto addressDto = profileClient.getAddressById(request.getShippingAddressId());
            if (addressDto != null) {
                addressSnapshot = String.format("%s, %s, %s, %s - %s",
                        addressDto.getStreetAddress(),
                        addressDto.getCity(),
                        addressDto.getState(),
                        addressDto.getCountry(),
                        addressDto.getPostalCode());
            }
        } catch (Exception e) {
            log.warn("Could not fetch address details from profile-service, using fallback ID: {}", e.getMessage());
        }

        // 2. Fetch authoritative product info & calculate totals
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderCreateRequest.OrderItemRequest itemReq : request.getItems()) {
            ProductDto product = null;
            try {
                product = productClient.getProductById(itemReq.getProductId());
            } catch (Exception e) {
                log.error("Failed to fetch product with id {}: {}", itemReq.getProductId(), e.getMessage());
            }

            if (product == null) {
                throw new BadRequestException("Product not found or unavailable for ID: " + itemReq.getProductId());
            }

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new BadRequestException("Product '" + product.getName() + "' is currently inactive.");
            }

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(product.getImageUrl())
                    .merchantId(product.getMerchantId())
                    .unitPrice(product.getPrice())
                    .quantity(itemReq.getQuantity())
                    .totalPrice(itemTotal)
                    .build();

            orderItems.add(orderItem);
        }

        // 3. Create and persist initial order
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerId(customerId)
                .customerUsername(username)
                .customerEmail(email)
                .status(OrderStatus.CREATED)
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(totalAmount)
                .shippingAddressId(request.getShippingAddressId())
                .shippingAddressSnapshot(addressSnapshot)
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        log.info("Order saved with ID: {} and number: {}", savedOrder.getId(), orderNumber);

        // 4. Saga Step: Reserve Stock
        List<StockReservationRequest.StockItemRequest> stockItems = request.getItems().stream()
                .map(i -> StockReservationRequest.StockItemRequest.builder()
                        .productId(i.getProductId())
                        .quantity(i.getQuantity())
                        .build())
                .collect(Collectors.toList());

        StockReservationRequest reserveReq = StockReservationRequest.builder()
                .orderId(savedOrder.getId())
                .items(stockItems)
                .build();

        StockReservationResponse reserveRes = null;
        try {
            reserveRes = inventoryClient.reserveStock(reserveReq);
        } catch (Exception e) {
            log.error("Stock reservation call failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        if (reserveRes == null || !reserveRes.isSuccessful()) {
            savedOrder.setStatus(OrderStatus.CANCELLED);
            savedOrder.setCancellationReason(reserveRes != null && reserveRes.getMessage() != null ? reserveRes.getMessage() : "Inventory reservation failed");
            orderRepository.save(savedOrder);
            throw new BadRequestException("Order checkout failed: " + savedOrder.getCancellationReason());
        }

        // 5. Saga Step: Initiate Payment
        PaymentInitiateRequest payReq = PaymentInitiateRequest.builder()
                .orderId(savedOrder.getId())
                .customerId(customerId)
                .amount(totalAmount)
                .paymentMethod(request.getPaymentMethod())
                .build();

        PaymentDto paymentDto = null;
        try {
            paymentDto = paymentClient.initiatePayment(payReq);
        } catch (Exception e) {
            log.error("Payment initiation call failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        boolean paymentSuccessful = paymentDto != null &&
                (paymentDto.getStatus() == PaymentStatus.SUCCESS ||
                 (request.getPaymentMethod() == PaymentMethod.COD && paymentDto.getStatus() == PaymentStatus.PENDING));

        if (!paymentSuccessful) {
            log.warn("Payment failed for order {}. Compensating stock reservation...", savedOrder.getId());
            // Compensate: Release reserved stock
            try {
                inventoryClient.releaseStock(StockReleaseRequest.builder()
                        .orderId(savedOrder.getId())
                        .items(stockItems)
                        .build());
            } catch (Exception e) {
                log.error("Stock release compensation failed for order {}: {}", savedOrder.getId(), e.getMessage());
            }

            savedOrder.setStatus(OrderStatus.CANCELLED);
            savedOrder.setCancellationReason("Payment processing failed or insufficient balance");
            orderRepository.save(savedOrder);
            throw new BadRequestException("Payment failed: Insufficient balance or payment error.");
        }

        // 6. Saga Step: Confirm Stock
        try {
            inventoryClient.confirmStock(StockConfirmRequest.builder()
                    .orderId(savedOrder.getId())
                    .build());
        } catch (Exception e) {
            log.error("Stock confirmation failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        // 7. Update order to CONFIRMED
        savedOrder.setStatus(OrderStatus.CONFIRMED);
        savedOrder = orderRepository.save(savedOrder);

        // 8. Saga Step: Create Delivery Task
        try {
            deliveryClient.createDelivery(DeliveryCreateRequest.builder()
                    .orderId(savedOrder.getId())
                    .shippingAddressSnapshot(addressSnapshot)
                    .customerNotes("Standard delivery")
                    .build());
        } catch (Exception e) {
            log.error("Delivery creation call failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        // 9. Publish OrderConfirmedEvent
        try {
            OrderConfirmedEvent event = OrderConfirmedEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .timestamp(Instant.now())
                    .orderId(savedOrder.getId())
                    .orderNumber(savedOrder.getOrderNumber())
                    .customerId(savedOrder.getCustomerId())
                    .totalAmount(savedOrder.getTotalAmount())
                    .build();

            rabbitTemplate.convertAndSend(exchange, "order.confirmed", event);
            log.info("Published OrderConfirmedEvent for order {}", savedOrder.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to publish OrderConfirmedEvent: {}", e.getMessage());
        }

        return mapToDto(savedOrder);
    }

    @Override
    @Transactional
    public OrderDto cancelOrder(Long orderId, OrderCancelRequest request, Long userId, UserRole userRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = UserRole.ADMIN == userRole;
        if (!isAdmin && !order.getCustomerId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to cancel this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel an already delivered order");
        }
        if (order.getStatus() == OrderStatus.SHIPPED && !isAdmin) {
            throw new BadRequestException("Order has already been shipped and cannot be cancelled by customer");
        }

        // If order was confirmed and paid via WALLET, process refund
        if (order.getStatus() == OrderStatus.CONFIRMED && order.getPaymentMethod() == PaymentMethod.WALLET) {
            try {
                PaymentDto payment = paymentClient.getPaymentByOrderId(order.getId());
                if (payment != null && payment.getId() != null) {
                    paymentClient.refundPayment(payment.getId(), RefundRequest.builder()
                            .amount(order.getTotalAmount())
                            .reason(request != null && request.getReason() != null ? request.getReason() : "Customer order cancellation")
                            .build());
                    log.info("Triggered refund for cancelled order ID: {}", order.getId());
                }
            } catch (Exception e) {
                log.error("Refund processing failed for order ID {}: {}", order.getId(), e.getMessage());
            }
        }

        // Release inventory
        try {
            List<StockReservationRequest.StockItemRequest> items = order.getItems().stream()
                    .map(i -> StockReservationRequest.StockItemRequest.builder()
                            .productId(i.getProductId())
                            .quantity(i.getQuantity())
                            .build())
                    .collect(Collectors.toList());

            inventoryClient.releaseStock(StockReleaseRequest.builder()
                    .orderId(order.getId())
                    .items(items)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to release stock during order cancellation: {}", e.getMessage());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(request != null && request.getReason() != null ? request.getReason() : "Cancelled by user");
        Order saved = orderRepository.save(order);

        // Publish OrderCancelledEvent
        try {
            OrderCancelledEvent event = OrderCancelledEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .timestamp(Instant.now())
                    .orderId(saved.getId())
                    .orderNumber(saved.getOrderNumber())
                    .customerId(saved.getCustomerId())
                    .refundAmount(saved.getTotalAmount())
                    .cancellationReason(saved.getCancellationReason())
                    .build();

            rabbitTemplate.convertAndSend(exchange, "order.cancelled", event);
        } catch (Exception e) {
            log.error("Failed to publish OrderCancelledEvent: {}", e.getMessage());
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long orderId, Long userId, UserRole userRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAuthorized = UserRole.ADMIN == userRole
                || UserRole.DELIVERY_AGENT == userRole
                || order.getCustomerId().equals(userId);

        if (!isAuthorized) {
            throw new ForbiddenException("You are not authorized to view this order");
        }

        return mapToDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrderByOrderNumber(String orderNumber, Long userId, UserRole userRole) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));

        boolean isAuthorized = UserRole.ADMIN == userRole
                || UserRole.DELIVERY_AGENT == userRole
                || order.getCustomerId().equals(userId);

        if (!isAuthorized) {
            throw new ForbiddenException("You are not authorized to view this order");
        }

        return mapToDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDto> getCustomerOrders(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDto> getAllOrders(OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return orderRepository.findAll(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional
    public void updateOrderStatusFromDelivery(Long orderId, OrderStatus newStatus) {
        orderRepository.findById(orderId).ifPresent(order -> {
            log.info("Updating order {} status from {} to {}", order.getOrderNumber(), order.getStatus(), newStatus);
            order.setStatus(newStatus);
            orderRepository.save(order);
        });
    }

    private OrderDto mapToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems() != null ? order.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .productImageUrl(item.getProductImageUrl())
                        .merchantId(item.getMerchantId())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList()) : new ArrayList<>();

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .customerUsername(order.getCustomerUsername())
                .customerEmail(order.getCustomerEmail())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .totalAmount(order.getTotalAmount())
                .shippingAddressId(order.getShippingAddressId())
                .shippingAddressSnapshot(order.getShippingAddressSnapshot())
                .cancellationReason(order.getCancellationReason())
                .items(itemDtos)
                .version(order.getVersion())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
