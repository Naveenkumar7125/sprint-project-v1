package com.eshoppingzone.shipping.provider.dto;

import com.eshoppingzone.common.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentProviderResponse {
    private boolean successful;
    private String provider;
    private String providerShipmentId;
    private String trackingNumber;
    private String carrier;
    private String trackingUrl;
    private ShipmentStatus initialStatus;
    private LocalDate estimatedDelivery;
    private String errorMessage;
}
