package com.eshoppingzone.shipping.controller;

import com.eshoppingzone.common.dto.shipping.ManualShipRequest;
import com.eshoppingzone.common.dto.shipping.OrderTrackingDto;
import com.eshoppingzone.common.dto.shipping.ShipmentDto;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.shipping.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
@Tag(name = "Shipping & Tracking Controller", description = "Endpoints for order shipment tracking, multi-vendor carrier dispatch, and shipment details")
public class ShippingController {

    private final ShippingService shippingService;

    @GetMapping("/orders/{orderId}/tracking")
    @Operation(summary = "Get complete tracking details and milestone history for all vendor shipments in an order (Public / Authenticated)")
    public ResponseEntity<OrderTrackingDto> getOrderTracking(@PathVariable Long orderId) {
        OrderTrackingDto tracking = shippingService.getOrderTracking(orderId);
        return ResponseEntity.ok(tracking);
    }

    @GetMapping("/tracking/{trackingNumber}")
    @Operation(summary = "Get shipment tracking information by carrier AWB / tracking number (Public)")
    public ResponseEntity<ShipmentDto> getShipmentByTrackingNumber(@PathVariable String trackingNumber) {
        ShipmentDto shipment = shippingService.getShipmentByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(shipment);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get shipment details by database ID")
    public ResponseEntity<ShipmentDto> getShipmentById(@PathVariable Long id) {
        ShipmentDto shipment = shippingService.getShipmentById(id);
        return ResponseEntity.ok(shipment);
    }

    @GetMapping("/merchant/shipments")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "List all shipments assigned to the current merchant")
    public ResponseEntity<Page<ShipmentDto>> getMerchantShipments(
            @ParameterObject @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        Page<ShipmentDto> shipments = shippingService.getMerchantShipments(merchantId, pageable);
        return ResponseEntity.ok(shipments);
    }

    @PostMapping("/orders/{orderId}/ship")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Trigger manual third-party shipment creation for an order")
    public ResponseEntity<ShipmentDto> createManualShipment(
            @PathVariable Long orderId,
            @Valid @RequestBody(required = false) ManualShipRequest request) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        ShipmentDto shipment = shippingService.createManualShipment(orderId, request != null ? request : new ManualShipRequest(), merchantId);
        return ResponseEntity.ok(shipment);
    }
}
