package com.eshoppingzone.common.dto.shipping;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingWebhookPayload {
    @NotBlank(message = "eventId is required")
    private String eventId;

    @NotBlank(message = "trackingNumber is required")
    private String trackingNumber;

    private String carrier;
    private String status;
    private String location;
    private String description;
    private Instant timestamp;
}
