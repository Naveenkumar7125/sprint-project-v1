package com.eshoppingzone.order.service;

import com.eshoppingzone.order.dto.DeliveryDto;
import com.eshoppingzone.order.dto.OrderCancelRequest;
import com.eshoppingzone.order.dto.OrderCreateRequest;
import com.eshoppingzone.order.dto.OrderDto;
import com.eshoppingzone.order.enums.OrderStatus;
import com.eshoppingzone.order.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderDto createOrder(OrderCreateRequest request, Long customerId, String username, String email);
    OrderDto cancelOrder(Long orderId, OrderCancelRequest request, Long userId, UserRole userRole);
    OrderDto getOrderById(Long orderId, Long userId, UserRole userRole);
    OrderDto getOrderByOrderNumber(String orderNumber, Long userId, UserRole userRole);
    Page<OrderDto> getCustomerOrders(Long customerId, Pageable pageable);
    Page<OrderDto> getMerchantOrders(Long merchantId, Pageable pageable);
    Page<OrderDto> getAllOrders(OrderStatus status, Pageable pageable);
    OrderDto updateMerchantOrderStatus(Long orderId, OrderStatus newStatus, String remarks, Long userId, UserRole userRole);
    DeliveryDto getOrderDelivery(Long orderId, Long userId, UserRole userRole);
    void updateOrderStatusFromDelivery(Long orderId, OrderStatus newStatus);
}
