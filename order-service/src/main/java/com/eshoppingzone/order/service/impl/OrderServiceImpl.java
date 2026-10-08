package com.eshoppingzone.order.service.impl;

import com.eshoppingzone.order.dto.DeliveryCreateRequest;
import com.eshoppingzone.order.dto.DeliveryDto;
import com.eshoppingzone.order.dto.StockConfirmRequest;
import com.eshoppingzone.order.dto.StockReleaseRequest;
import com.eshoppingzone.order.dto.StockReservationRequest;
import com.eshoppingzone.order.dto.StockReservationResponse;
import com.eshoppingzone.order.dto.OrderCancelRequest;
import com.eshoppingzone.order.dto.OrderCreateRequest;
import com.eshoppingzone.order.dto.OrderDto;
import com.eshoppingzone.order.dto.OrderItemDto;
import com.eshoppingzone.order.dto.PaymentDto;
import com.eshoppingzone.order.dto.PaymentInitiateRequest;
import com.eshoppingzone.order.dto.RefundRequest;
import com.eshoppingzone.order.dto.ProductDto;
import com.eshoppingzone.order.dto.AddressDto;
import com.eshoppingzone.order.enums.OrderStatus;
import com.eshoppingzone.order.enums.PaymentMethod;
import com.eshoppingzone.order.enums.PaymentStatus;
import com.eshoppingzone.order.enums.UserRole;
import com.eshoppingzone.order.event.OrderCancelledEvent;
import com.eshoppingzone.order.event.OrderConfirmedEvent;
import com.eshoppingzone.order.exception.BadRequestException;
import com.eshoppingzone.order.exception.ForbiddenException;
import com.eshoppingzone.order.exception.ResourceNotFoundException;
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
        String addressSnapshot = null;
        if (org.springframework.util.StringUtils.hasText(request.getShippingAddressSnapshot())) {
            addressSnapshot = request.getShippingAddressSnapshot();
        } else {
            try {
                AddressDto addressDto = profileClient.getAddressById(request.getShippingAddressId());
                if (addressDto != null && addressDto.getStreetAddress() != null) {
                    addressSnapshot = String.format("%s, %s, %s, %s - %s",
                            addressDto.getStreetAddress(),
                            addressDto.getCity(),
                            addressDto.getState(),
                            addressDto.getCountry(),
                            addressDto.getPostalCode());
                }
            } catch (Exception e) {
                log.warn("Could not fetch address details from profile-service: {}", e.getMessage());
            }
        }

        if (!org.springframework.util.StringUtils.hasText(addressSnapshot)) {
            addressSnapshot = "Address ID: " + request.getShippingAddressId();
        }

        // 2. Fetch authoritative product info & calculate totals
        BigDecimal itemsTotal = BigDecimal.ZERO;
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
            itemsTotal = itemsTotal.add(itemTotal);

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

        // Apply delivery charge of 60 if total cost of ordering products is less than 500
        BigDecimal deliveryFee = (itemsTotal.compareTo(BigDecimal.valueOf(500)) < 0)
                ? BigDecimal.valueOf(60)
                : BigDecimal.ZERO;
        BigDecimal totalAmount = itemsTotal.add(deliveryFee);

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
        Long orderMerchantId = (savedOrder.getItems() != null && !savedOrder.getItems().isEmpty())
                ? savedOrder.getItems().get(0).getMerchantId()
                : null;

        PaymentInitiateRequest payReq = PaymentInitiateRequest.builder()
                .orderId(savedOrder.getId())
                .customerId(customerId)
                .amount(totalAmount)
                .paymentMethod(request.getPaymentMethod())
                .merchantId(orderMerchantId)
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
                    .items(stockItems)
                    .build());
        } catch (Exception e) {
            log.error("Stock confirmation failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        // 7. Update order to CONFIRMED
        savedOrder.setStatus(OrderStatus.CONFIRMED);
        savedOrder = orderRepository.save(savedOrder);

        // 8. Publish OrderConfirmedEvent
        try {
            List<OrderConfirmedEvent.OrderItemSummary> itemSummaries = savedOrder.getItems() != null
                    ? savedOrder.getItems().stream()
                    .map(i -> OrderConfirmedEvent.OrderItemSummary.builder()
                            .productId(i.getProductId())
                            .productName(i.getProductName())
                            .merchantId(i.getMerchantId())
                            .unitPrice(i.getUnitPrice())
                            .quantity(i.getQuantity())
                            .totalPrice(i.getTotalPrice())
                            .build())
                    .collect(Collectors.toList())
                    : new ArrayList<>();

            OrderConfirmedEvent event = OrderConfirmedEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .timestamp(Instant.now())
                    .orderId(savedOrder.getId())
                    .orderNumber(savedOrder.getOrderNumber())
                    .customerId(savedOrder.getCustomerId())
                    .totalAmount(savedOrder.getTotalAmount())
                    .items(itemSummaries)
                    .build();

            rabbitTemplate.convertAndSend(exchange, "order.confirmed", event);
            log.info("Published OrderConfirmedEvent for order {} with {} item breakdown(s)", savedOrder.getOrderNumber(), itemSummaries.size());
        } catch (Exception e) {
            log.error("Failed to publish OrderConfirmedEvent: {}", e.getMessage());
        }

        // 9. Create Delivery record (status CREATED, waiting for merchant pickup preparation)
        try {
            Long primaryMerchantId = (savedOrder.getItems() != null && !savedOrder.getItems().isEmpty())
                    ? savedOrder.getItems().get(0).getMerchantId()
                    : null;

            String recipientName = savedOrder.getCustomerUsername() != null ? savedOrder.getCustomerUsername() : ("Customer #" + savedOrder.getCustomerId());
            String recipientPhone = "+91 98765 43210";

            DeliveryCreateRequest deliveryReq = DeliveryCreateRequest.builder()
                    .orderId(savedOrder.getId())
                    .customerId(savedOrder.getCustomerId())
                    .merchantId(primaryMerchantId)
                    .recipientName(recipientName)
                    .recipientPhone(recipientPhone)
                    .shippingAddressSnapshot(savedOrder.getShippingAddressSnapshot())
                    .customerNotes("Order #" + savedOrder.getOrderNumber())
                    .build();

            deliveryClient.createDelivery(deliveryReq);
            log.info("Triggered delivery creation for order ID: {} with merchant ID: {}", savedOrder.getId(), primaryMerchantId);
        } catch (Exception e) {
            log.error("Failed to trigger delivery creation for order {}: {}", savedOrder.getId(), e.getMessage());
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
    @Transactional(readOnly = true)
    public Page<OrderDto> getMerchantOrders(Long merchantId, Pageable pageable) {
        return orderRepository.findByMerchantId(merchantId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional
    public OrderDto updateMerchantOrderStatus(Long orderId, OrderStatus newStatus, String remarks, Long userId, UserRole userRole) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = userRole == UserRole.ADMIN;
        boolean isMerchantOfOrder = order.getItems() != null && order.getItems().stream()
                .anyMatch(i -> i.getMerchantId() != null && i.getMerchantId().equals(userId));

        if (!isAdmin && !isMerchantOfOrder) {
            throw new ForbiddenException("You are not authorized to update status for this order");
        }

        OrderStatus currentStatus = order.getStatus();

        // Validate merchant transition rules
        if (!isAdmin) {
            if (currentStatus == OrderStatus.CONFIRMED && (newStatus == OrderStatus.PROCESSING || newStatus == OrderStatus.READY_FOR_PICKUP)) {
                // Allowed
            } else if (currentStatus == OrderStatus.PROCESSING && newStatus == OrderStatus.READY_FOR_PICKUP) {
                // Allowed
            } else {
                throw new BadRequestException(String.format("Invalid status transition from %s to %s for merchant", currentStatus, newStatus));
            }
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        log.info("Merchant/Admin updated order {} status to {}", savedOrder.getOrderNumber(), newStatus);

        // When order is marked READY_FOR_PICKUP, create Delivery Task in delivery-service
        if (newStatus == OrderStatus.READY_FOR_PICKUP) {
            try {
                Long primaryMerchantId = (savedOrder.getItems() != null && !savedOrder.getItems().isEmpty())
                        ? savedOrder.getItems().get(0).getMerchantId()
                        : userId;

                DeliveryDto delivery = deliveryClient.createDelivery(DeliveryCreateRequest.builder()
                        .orderId(savedOrder.getId())
                        .customerId(savedOrder.getCustomerId())
                        .merchantId(primaryMerchantId)
                        .shippingAddressSnapshot(savedOrder.getShippingAddressSnapshot())
                        .customerNotes(remarks != null ? remarks : "Order packed and ready for pickup")
                        .build());
                log.info("Successfully requested Delivery Job creation for ready-for-pickup order {}: {}",
                        savedOrder.getOrderNumber(), delivery != null ? delivery.getTrackingNumber() : "created");
            } catch (Exception e) {
                log.error("Failed to invoke delivery-service createDelivery for order {}: {}", savedOrder.getId(), e.getMessage());
            }
        }

        return mapToDto(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryDto getOrderDelivery(Long orderId, Long userId, UserRole userRole) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = userRole == UserRole.ADMIN;
        boolean isAgent = userRole == UserRole.DELIVERY_AGENT;
        boolean isCustomer = order.getCustomerId().equals(userId);
        boolean isMerchant = order.getItems() != null && order.getItems().stream()
                .anyMatch(i -> i.getMerchantId() != null && i.getMerchantId().equals(userId));

        if (!isAdmin && !isAgent && !isCustomer && !isMerchant) {
            throw new ForbiddenException("You are not authorized to view delivery tracking for this order");
        }

        return deliveryClient.getDeliveryByOrderId(orderId);
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
