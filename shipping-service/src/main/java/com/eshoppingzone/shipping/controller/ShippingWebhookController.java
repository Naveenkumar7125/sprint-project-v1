package com.eshoppingzone.shipping.controller;

import com.eshoppingzone.common.dto.shipping.ShipmentDto;
import com.eshoppingzone.common.dto.shipping.ShippingWebhookPayload;
import com.eshoppingzone.shipping.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Shipping Webhooks", description = "Endpoints for receiving real-time tracking events from third-party shipping aggregators (Shiprocket/Shippo)")
public class ShippingWebhookController {

    private final ShippingService shippingService;

    @PostMapping("/shipping")
    @Operation(summary = "Handle third-party courier webhook event (Idempotent by eventId)")
    public ResponseEntity<ShipmentDto> handleShippingWebhook(
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @Valid @RequestBody ShippingWebhookPayload payload) {
        log.info("Received shipping webhook notification for tracking: {}, eventId: {}", payload.getTrackingNumber(), payload.getEventId());
        ShipmentDto updated = shippingService.handleWebhookEvent(payload);
        return ResponseEntity.ok(updated);
    }
}
