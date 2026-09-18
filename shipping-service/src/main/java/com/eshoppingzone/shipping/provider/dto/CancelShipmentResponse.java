package com.eshoppingzone.shipping.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelShipmentResponse {
    private boolean successful;
    private String providerShipmentId;
    private String message;
}
