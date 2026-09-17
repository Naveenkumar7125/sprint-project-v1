package com.eshoppingzone.delivery.controller;

import com.eshoppingzone.common.dto.delivery.DeliveryAssignmentRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import com.eshoppingzone.common.dto.delivery.DeliveryStatusUpdateRequest;
import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.security.SecurityUtils;
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

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get delivery record by ID")
    public ResponseEntity<DeliveryDto> getById(@PathVariable("id") Long id) {
        DeliveryDto delivery = deliveryService.getDeliveryById(id);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get delivery tracking details by Order ID")
    public ResponseEntity<DeliveryDto> getByOrderId(@PathVariable("orderId") Long orderId) {
        DeliveryDto delivery = deliveryService.getDeliveryByOrderId(orderId);
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
