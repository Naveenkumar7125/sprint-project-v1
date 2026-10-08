package com.eshoppingzone.order.controller;

import com.eshoppingzone.order.dto.OrderCancelRequest;
import com.eshoppingzone.order.dto.OrderCreateRequest;
import com.eshoppingzone.order.dto.OrderDto;
import com.eshoppingzone.order.enums.OrderStatus;
import com.eshoppingzone.order.enums.UserRole;
import com.eshoppingzone.order.security.SecurityUtils;
import com.eshoppingzone.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Controller", description = "Endpoints for order management and distributed saga checkout")
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Checkout and create a new order through distributed saga")
    public ResponseEntity<OrderDto> checkout(@Valid @RequestBody OrderCreateRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        String username = SecurityUtils.getCurrentUsername();
        String email = SecurityUtils.getCurrentUserPrincipal().map(p -> p.getEmail()).orElse(null);

        OrderDto order = orderService.createOrder(
                request,
                userId,
                username,
                email
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel an order and trigger compensation / refund if applicable")
    public ResponseEntity<OrderDto> cancelOrder(
            @PathVariable("id") Long id,
            @RequestBody(required = false) OrderCancelRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        OrderDto order = orderService.cancelOrder(id, request, userId, role);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order details by order ID")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable("id") Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        OrderDto order = orderService.getOrderById(id, userId, role);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order details by unique order number")
    public ResponseEntity<OrderDto> getOrderByNumber(@PathVariable("orderNumber") String orderNumber) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        OrderDto order = orderService.getOrderByOrderNumber(orderNumber, userId, role);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current authenticated customer's orders")
    public ResponseEntity<Page<OrderDto>> getMyOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long customerId = SecurityUtils.getCurrentUserId();
        Page<OrderDto> orders = orderService.getCustomerOrders(customerId, pageable);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/merchant")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @Operation(summary = "Get orders containing items for the authenticated merchant")
    public ResponseEntity<Page<OrderDto>> getMerchantOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        Page<OrderDto> orders = orderService.getMerchantOrders(merchantId, pageable);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/{id}/merchant-status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @Operation(summary = "Update order status by merchant (PROCESSING, READY_FOR_PICKUP)")
    public ResponseEntity<OrderDto> updateMerchantOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody com.eshoppingzone.order.dto.MerchantOrderStatusUpdateRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        OrderDto order = orderService.updateMerchantOrderStatus(id, request.getStatus(), request.getRemarks(), userId, role);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{id}/delivery")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get delivery status tracking for an order")
    public ResponseEntity<com.eshoppingzone.order.dto.DeliveryDto> getOrderDelivery(@PathVariable("id") Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        com.eshoppingzone.order.dto.DeliveryDto delivery = orderService.getOrderDelivery(id, userId, role);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all orders with optional status filtering (Admin only)")
    public ResponseEntity<Page<OrderDto>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OrderDto> orders = orderService.getAllOrders(status, pageable);
        return ResponseEntity.ok(orders);
    }
}
