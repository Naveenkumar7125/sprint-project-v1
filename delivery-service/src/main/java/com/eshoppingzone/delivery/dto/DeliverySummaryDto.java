package com.eshoppingzone.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverySummaryDto {
    private long totalDeliveries;
    private long availableDeliveries;
    private long assignedDeliveries;
    private long pickedUpDeliveries;
    private long outForDeliveryDeliveries;
    private long deliveredDeliveries;
    private long failedDeliveries;
    private long cancelledDeliveries;
}
