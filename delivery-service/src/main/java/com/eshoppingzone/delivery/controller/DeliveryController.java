package com.eshoppingzone.delivery.controller;

import com.eshoppingzone.delivery.dto.*;
import com.eshoppingzone.delivery.enums.DeliveryStatus;
import com.eshoppingzone.delivery.enums.UserRole;
import com.eshoppingzone.delivery.security.SecurityUtils;
import com.eshoppingzone.delivery.service.DeliveryService;
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
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
@Tag(name = "Delivery Controller", description = "Endpoints for order dispatching, agent assignment, and shipment lifecycle tracking")
public class DeliveryController {

    private final DeliveryService deliveryService;

    @PostMapping
    @Operation(summary = "Create a new delivery record (Internal / Authenticated)")
    public ResponseEntity<DeliveryDto> createDelivery(@Valid @RequestBody DeliveryCreateRequest request) {
        DeliveryDto delivery = deliveryService.createDelivery(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(delivery);
    }

    @PostMapping("/{id}/ready-for-pickup")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Merchant marks order shipment ready for pickup (Dispatches to available courier pool)")
    public ResponseEntity<DeliveryDto> markReadyForPickup(
            @PathVariable("id") Long id,
            @RequestBody(required = false) DeliveryStatusUpdateRequest request) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        String remarks = request != null && request.getRemarks() != null
                ? request.getRemarks()
                : "Merchant packaged items and marked ready for courier pickup";
        DeliveryDto delivery = deliveryService.markReadyForPickup(id, merchantId, role, remarks);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/merchant/my-orders")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get deliveries / shipment orders for current merchant")
    public ResponseEntity<Page<DeliveryDto>> getMerchantDeliveries(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        Page<DeliveryDto> deliveries = deliveryService.getMerchantDeliveries(merchantId, role, pageable);
        return ResponseEntity.ok(deliveries);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get available delivery tasks waiting for assignment")
    public ResponseEntity<Page<DeliveryDto>> getAvailableDeliveries(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DeliveryDto> deliveries = deliveryService.getAvailableDeliveries(pageable);
        return ResponseEntity.ok(deliveries);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Delivery agent self-accepts an available delivery")
    public ResponseEntity<DeliveryDto> acceptDelivery(@PathVariable("id") Long id) {
        Long agentId = SecurityUtils.getCurrentUserId();
        String username = SecurityUtils.getCurrentUsername();
        DeliveryDto delivery = deliveryService.acceptDelivery(id, agentId, username);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Assign a delivery task to a delivery agent (Admin only)")
    public ResponseEntity<DeliveryDto> assignDelivery(
            @PathVariable("id") Long id,
            @Valid @RequestBody DeliveryAssignmentRequest request) {
        DeliveryDto delivery = deliveryService.assignDelivery(id, request);
        return ResponseEntity.ok(delivery);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update delivery status lifecycle (DELIVERY_AGENT / ADMIN)")
    public ResponseEntity<DeliveryDto> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody DeliveryStatusUpdateRequest request) {
        Long agentId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        DeliveryDto delivery = deliveryService.updateDeliveryStatus(id, request, agentId, role);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/pickup")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Mark delivery as PICKED_UP by delivery agent")
    public ResponseEntity<DeliveryDto> markPickedUp(
            @PathVariable("id") Long id,
            @RequestBody(required = false) DeliveryStatusUpdateRequest request) {
        Long agentId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        DeliveryStatusUpdateRequest req = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.PICKED_UP)
                .remarks(request != null && request.getRemarks() != null ? request.getRemarks() : "Order picked up by agent")
                .build();
        DeliveryDto delivery = deliveryService.updateDeliveryStatus(id, req, agentId, role);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/out-for-delivery")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Mark delivery as OUT_FOR_DELIVERY by delivery agent")
    public ResponseEntity<DeliveryDto> markOutForDelivery(
            @PathVariable("id") Long id,
            @RequestBody(required = false) DeliveryStatusUpdateRequest request) {
        Long agentId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        DeliveryStatusUpdateRequest req = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.OUT_FOR_DELIVERY)
                .remarks(request != null && request.getRemarks() != null ? request.getRemarks() : "Shipment is out for delivery")
                .build();
        DeliveryDto delivery = deliveryService.updateDeliveryStatus(id, req, agentId, role);
        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/{id}/delivered")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Mark delivery as DELIVERED by delivery agent")
    public ResponseEntity<DeliveryDto> markDelivered(
            @PathVariable("id") Long id,
            @RequestBody(required = false) DeliveryStatusUpdateRequest request) {
        Long agentId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        DeliveryStatusUpdateRequest req = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.DELIVERED)
                .remarks(request != null && request.getRemarks() != null ? request.getRemarks() : "Package successfully delivered to customer")
                .build();
        DeliveryDto delivery = deliveryService.updateDeliveryStatus(id, req, agentId, role);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get delivery metrics summary for Admin dashboard")
    public ResponseEntity<DeliverySummaryDto> getDeliverySummary() {
        return ResponseEntity.ok(deliveryService.getDeliverySummary());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get delivery record by ID")
    public ResponseEntity<DeliveryDto> getById(@PathVariable("id") Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserRole currentRole = SecurityUtils.getCurrentUserRole();
        DeliveryDto delivery = deliveryService.getDeliveryById(id);

        if (currentRole == UserRole.CUSTOMER && delivery.getCustomerId() != null && !delivery.getCustomerId().equals(currentUserId)) {
            throw new com.eshoppingzone.delivery.exception.ForbiddenException("You are not authorized to view this delivery");
        }
        if (currentRole == UserRole.MERCHANT && delivery.getMerchantId() != null && !delivery.getMerchantId().equals(currentUserId)) {
            throw new com.eshoppingzone.delivery.exception.ForbiddenException("You are not authorized to view this delivery");
        }
        if (currentRole == UserRole.DELIVERY_AGENT && delivery.getDeliveryAgentId() != null && !delivery.getDeliveryAgentId().equals(currentUserId)) {
            throw new com.eshoppingzone.delivery.exception.ForbiddenException("You are not authorized to view this delivery");
        }
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get delivery tracking details by Order ID")
    public ResponseEntity<DeliveryDto> getByOrderId(@PathVariable("orderId") Long orderId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserRole currentRole = SecurityUtils.getCurrentUserRole();
        DeliveryDto delivery = deliveryService.getDeliveryByOrderId(orderId);

        if (currentRole == UserRole.CUSTOMER && delivery.getCustomerId() != null && !delivery.getCustomerId().equals(currentUserId)) {
            throw new com.eshoppingzone.delivery.exception.ForbiddenException("You are not authorized to view delivery information for this order");
        }
        if (currentRole == UserRole.MERCHANT && delivery.getMerchantId() != null && !delivery.getMerchantId().equals(currentUserId)) {
            throw new com.eshoppingzone.delivery.exception.ForbiddenException("You are not authorized to view delivery information for this order");
        }
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/tracking/{trackingNumber}")
    @Operation(summary = "Public tracking query by tracking number")
    public ResponseEntity<DeliveryDto> getByTrackingNumber(@PathVariable("trackingNumber") String trackingNumber) {
        DeliveryDto delivery = deliveryService.getDeliveryByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/agent/my-deliveries")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get assigned deliveries for the current delivery agent")
    public ResponseEntity<Page<DeliveryDto>> getMyDeliveries(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long agentId = SecurityUtils.getCurrentUserId();
        Page<DeliveryDto> deliveries = deliveryService.getAgentDeliveries(agentId, pageable);
        return ResponseEntity.ok(deliveries);
    }
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get all delivery tasks with optional status filter (Admin only)")
    public ResponseEntity<Page<DeliveryDto>> getAllDeliveries(
            @RequestParam(required = false) DeliveryStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DeliveryDto> deliveries = deliveryService.getAllDeliveries(status, pageable);
        return ResponseEntity.ok(deliveries);
    }
}

