package com.eshoppingzone.common.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTrackingDto {
    private Long orderId;
    private String orderNumber;
    private Integer totalShipments;
    private List<ShipmentDto> shipments;
}
