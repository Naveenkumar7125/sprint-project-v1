package com.eshoppingzone.order.service;

import com.eshoppingzone.common.dto.order.OrderCancelRequest;
import com.eshoppingzone.common.dto.order.OrderCreateRequest;
import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.enums.OrderStatus;
import com.eshoppingzone.common.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderDto createOrder(OrderCreateRequest request, Long customerId, String username, String email);
    OrderDto cancelOrder(Long orderId, OrderCancelRequest request, Long userId, UserRole userRole);
    OrderDto getOrderById(Long orderId, Long userId, UserRole userRole);
    OrderDto getOrderByOrderNumber(String orderNumber, Long userId, UserRole userRole);
    Page<OrderDto> getCustomerOrders(Long customerId, Pageable pageable);
    Page<OrderDto> getAllOrders(OrderStatus status, Pageable pageable);
    void updateOrderStatusFromDelivery(Long orderId, OrderStatus newStatus);
}
