package com.eshoppingzone.order.service;

import com.eshoppingzone.order.dto.DeliveryDto;
import com.eshoppingzone.order.dto.StockReservationResponse;
import com.eshoppingzone.order.dto.OrderCancelRequest;
import com.eshoppingzone.order.dto.OrderCreateRequest;
import com.eshoppingzone.order.dto.OrderDto;
import com.eshoppingzone.order.dto.PaymentDto;
import com.eshoppingzone.order.dto.RefundDto;
import com.eshoppingzone.order.dto.ProductDto;
import com.eshoppingzone.order.dto.AddressDto;
import com.eshoppingzone.order.enums.*;
import com.eshoppingzone.order.exception.BadRequestException;
import com.eshoppingzone.order.exception.ForbiddenException;
import com.eshoppingzone.order.client.*;
import com.eshoppingzone.order.entity.Order;
import com.eshoppingzone.order.repository.OrderRepository;
import com.eshoppingzone.order.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductClient productClient;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private DeliveryClient deliveryClient;

    @Mock
    private ProfileClient profileClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private OrderServiceImpl orderService;

    private ProductDto sampleProduct;
    private AddressDto sampleAddress;

    @BeforeEach
    void setUp() {
        sampleProduct = ProductDto.builder()
                .id(1L)
                .name("Laptop")
                .price(new BigDecimal("1000.00"))
                .merchantId(2L)
                .active(true)
                .build();

        sampleAddress = AddressDto.builder()
                .id(1L)
                .streetAddress("123 Street")
                .city("Tech City")
                .state("State")
                .country("Country")
                .postalCode("12345")
                .build();
    }

    @Test
    @DisplayName("Create Order Saga - Success with Wallet Payment")
    void testCreateOrder_Success() {
        OrderCreateRequest request = OrderCreateRequest.builder()
                .shippingAddressId(1L)
                .paymentMethod(PaymentMethod.WALLET)
                .items(List.of(OrderCreateRequest.OrderItemRequest.builder().productId(1L).quantity(2).build()))
                .build();

        when(profileClient.getAddressById(1L)).thenReturn(sampleAddress);
        when(productClient.getProductById(1L)).thenReturn(sampleProduct);

        Order savedOrder = Order.builder()
                .id(100L)
                .orderNumber("ORD-12345678")
                .customerId(3L)
                .customerUsername("customer1")
                .customerEmail("customer1@test.com")
                .status(OrderStatus.CREATED)
                .paymentMethod(PaymentMethod.WALLET)
                .totalAmount(new BigDecimal("2000.00"))
                .items(new ArrayList<>())
                .build();

        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(inventoryClient.reserveStock(any())).thenReturn(StockReservationResponse.builder().orderId(100L).successful(true).build());
        when(paymentClient.initiatePayment(any())).thenReturn(PaymentDto.builder().id(50L).status(PaymentStatus.SUCCESS).build());

        OrderDto result = orderService.createOrder(request, 3L, "customer1", "customer1@test.com");

        assertNotNull(result);
        assertEquals(OrderStatus.CONFIRMED, result.getStatus());
        verify(inventoryClient, times(1)).confirmStock(any());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("order.confirmed"), any(Object.class));
    }

    @Test
    @DisplayName("Merchant marks order PROCESSING then READY_FOR_PICKUP - Creates Delivery Job")
    void testMerchantUpdateOrderStatus_ReadyForPickup_CreatesDelivery() {
        com.eshoppingzone.order.entity.OrderItem item = com.eshoppingzone.order.entity.OrderItem.builder()
                .id(1L)
                .productId(1L)
                .productName("Laptop")
                .merchantId(2L)
                .unitPrice(new BigDecimal("1000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("1000.00"))
                .build();

        Order order = Order.builder()
                .id(100L)
                .orderNumber("ORD-12345678")
                .customerId(3L)
                .status(OrderStatus.CONFIRMED)
                .shippingAddressSnapshot("123 Street, Tech City")
                .items(List.of(item))
                .build();

        when(orderRepository.findByIdWithItems(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(deliveryClient.createDelivery(any())).thenReturn(DeliveryDto.builder().id(10L).trackingNumber("TRK-123456").status(DeliveryStatus.AVAILABLE).build());

        // Step 1: CONFIRMED -> PROCESSING
        OrderDto processingOrder = orderService.updateMerchantOrderStatus(100L, OrderStatus.PROCESSING, "Packing item", 2L, UserRole.MERCHANT);
        assertEquals(OrderStatus.PROCESSING, processingOrder.getStatus());
        verify(deliveryClient, never()).createDelivery(any());

        // Step 2: PROCESSING -> READY_FOR_PICKUP
        OrderDto readyOrder = orderService.updateMerchantOrderStatus(100L, OrderStatus.READY_FOR_PICKUP, "Packed and ready", 2L, UserRole.MERCHANT);
        assertEquals(OrderStatus.READY_FOR_PICKUP, readyOrder.getStatus());
        verify(deliveryClient, times(1)).createDelivery(any());
    }

    @Test
    @DisplayName("Merchant update order status - Unauthorized merchant throws ForbiddenException")
    void testMerchantUpdateOrderStatus_UnauthorizedMerchant() {
        com.eshoppingzone.order.entity.OrderItem item = com.eshoppingzone.order.entity.OrderItem.builder()
                .id(1L)
                .productId(1L)
                .merchantId(2L)
                .unitPrice(new BigDecimal("1000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("1000.00"))
                .build();

        Order order = Order.builder()
                .id(100L)
                .customerId(3L)
                .status(OrderStatus.CONFIRMED)
                .items(List.of(item))
                .build();

        when(orderRepository.findByIdWithItems(100L)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenException.class, () ->
                orderService.updateMerchantOrderStatus(100L, OrderStatus.PROCESSING, "Packing item", 999L, UserRole.MERCHANT));
    }

    @Test
    @DisplayName("Get Order Delivery - Customer views their own order delivery")
    void testGetOrderDelivery_Customer_Success() {
        Order order = Order.builder()
                .id(100L)
                .customerId(3L)
                .items(List.of())
                .build();

        when(orderRepository.findByIdWithItems(100L)).thenReturn(Optional.of(order));
        when(deliveryClient.getDeliveryByOrderId(100L)).thenReturn(DeliveryDto.builder().id(10L).trackingNumber("TRK-123").status(DeliveryStatus.AVAILABLE).build());

        DeliveryDto result = orderService.getOrderDelivery(100L, 3L, UserRole.CUSTOMER);
        assertNotNull(result);
        assertEquals("TRK-123", result.getTrackingNumber());
    }

    @Test
    @DisplayName("Get Order Delivery - Customer accessing other customer's order delivery throws Forbidden")
    void testGetOrderDelivery_Forbidden() {
        Order order = Order.builder()
                .id(100L)
                .customerId(3L)
                .items(List.of())
                .build();

        when(orderRepository.findByIdWithItems(100L)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenException.class, () ->
                orderService.getOrderDelivery(100L, 999L, UserRole.CUSTOMER));
    }

    @Test
    @DisplayName("Create Order Saga - Stock Reservation Fails - Order Cancelled")
    void testCreateOrder_StockReservationFails() {
        OrderCreateRequest request = OrderCreateRequest.builder()
                .shippingAddressId(1L)
                .paymentMethod(PaymentMethod.WALLET)
                .items(List.of(OrderCreateRequest.OrderItemRequest.builder().productId(1L).quantity(2).build()))
                .build();

        when(profileClient.getAddressById(1L)).thenReturn(sampleAddress);
        when(productClient.getProductById(1L)).thenReturn(sampleProduct);

        Order savedOrder = Order.builder()
                .id(100L)
                .orderNumber("ORD-12345678")
                .customerId(3L)
                .status(OrderStatus.CREATED)
                .items(new ArrayList<>())
                .build();

        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(inventoryClient.reserveStock(any())).thenReturn(StockReservationResponse.builder().orderId(100L).successful(false).message("Out of stock").build());

        assertThrows(BadRequestException.class, () -> orderService.createOrder(request, 3L, "customer1", "customer1@test.com"));
        verify(paymentClient, never()).initiatePayment(any());
    }

    @Test
    @DisplayName("Create Order Saga - Payment Fails - Compensates Stock and Cancels Order")
    void testCreateOrder_PaymentFails_CompensatesInventory() {
        OrderCreateRequest request = OrderCreateRequest.builder()
                .shippingAddressId(1L)
                .paymentMethod(PaymentMethod.WALLET)
                .items(List.of(OrderCreateRequest.OrderItemRequest.builder().productId(1L).quantity(2).build()))
                .build();

        when(profileClient.getAddressById(1L)).thenReturn(sampleAddress);
        when(productClient.getProductById(1L)).thenReturn(sampleProduct);

        Order savedOrder = Order.builder()
                .id(100L)
                .orderNumber("ORD-12345678")
                .customerId(3L)
                .status(OrderStatus.CREATED)
                .items(new ArrayList<>())
                .build();

        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(inventoryClient.reserveStock(any())).thenReturn(StockReservationResponse.builder().orderId(100L).successful(true).build());
        when(paymentClient.initiatePayment(any())).thenReturn(PaymentDto.builder().id(50L).status(PaymentStatus.FAILED).build());

        assertThrows(BadRequestException.class, () -> orderService.createOrder(request, 3L, "customer1", "customer1@test.com"));
        verify(inventoryClient, times(1)).releaseStock(any());
    }

    @Test
    @DisplayName("Cancel Order - Customer Cancels Confirmed Order with Wallet Refund")
    void testCancelOrder_Customer_Success() {
        Order order = Order.builder()
                .id(100L)
                .orderNumber("ORD-12345678")
                .customerId(3L)
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.WALLET)
                .totalAmount(new BigDecimal("100.00"))
                .items(new ArrayList<>())
                .build();

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(paymentClient.getPaymentByOrderId(100L)).thenReturn(PaymentDto.builder().id(500L).build());
        when(paymentClient.refundPayment(eq(500L), any())).thenReturn(RefundDto.builder().id(1L).status(RefundStatus.SUCCESS).build());

        OrderCancelRequest cancelReq = OrderCancelRequest.builder().reason("Changed mind").build();
        OrderDto result = orderService.cancelOrder(100L, cancelReq, 3L, UserRole.CUSTOMER);

        assertNotNull(result);
        assertEquals(OrderStatus.CANCELLED, result.getStatus());
        verify(paymentClient, times(1)).refundPayment(eq(500L), any());
        verify(inventoryClient, times(1)).releaseStock(any());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("order.cancelled"), any(Object.class));
    }

    @Test
    @DisplayName("Cancel Order - Delivered Order Cannot Be Cancelled")
    void testCancelOrder_Delivered_ThrowsBadRequest() {
        Order order = Order.builder()
                .id(100L)
                .customerId(3L)
                .status(OrderStatus.DELIVERED)
                .build();

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class, () -> orderService.cancelOrder(100L, null, 3L, UserRole.CUSTOMER));
    }

    @Test
    @DisplayName("Get Order By ID - Customer Accessing Other Customer's Order Throws Forbidden")
    void testGetOrderById_Forbidden() {
        Order order = Order.builder()
                .id(100L)
                .customerId(3L)
                .status(OrderStatus.CONFIRMED)
                .build();

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenException.class, () -> orderService.getOrderById(100L, 999L, UserRole.CUSTOMER));
    }
}
