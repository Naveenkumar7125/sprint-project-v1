package com.eshoppingzone.order.service;

import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import com.eshoppingzone.common.dto.inventory.StockReservationResponse;
import com.eshoppingzone.common.dto.order.OrderCancelRequest;
import com.eshoppingzone.common.dto.order.OrderCreateRequest;
import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.payment.PaymentDto;
import com.eshoppingzone.common.dto.payment.RefundDto;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.profile.AddressDto;
import com.eshoppingzone.common.enums.*;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
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
        when(deliveryClient.createDelivery(any())).thenReturn(DeliveryDto.builder().id(10L).build());

        OrderDto result = orderService.createOrder(request, 3L, "customer1", "customer1@test.com");

        assertNotNull(result);
        assertEquals(OrderStatus.CONFIRMED, result.getStatus());
        verify(inventoryClient, times(1)).confirmStock(any());
        verify(deliveryClient, times(1)).createDelivery(any());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("order.confirmed"), any(Object.class));
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
