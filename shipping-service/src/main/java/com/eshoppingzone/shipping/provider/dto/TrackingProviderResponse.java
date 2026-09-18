package com.eshoppingzone.shipping.provider.dto;

import com.eshoppingzone.common.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingProviderResponse {
    private boolean successful;
    private String trackingNumber;
    private String carrier;
    private ShipmentStatus currentStatus;
    private LocalDate estimatedDelivery;
    private List<TrackingMilestone> milestones;
    private String errorMessage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingMilestone {
        private ShipmentStatus status;
        private String location;
        private String description;
        private Instant timestamp;
    }
}
