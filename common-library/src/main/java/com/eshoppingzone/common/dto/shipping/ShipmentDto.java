package com.eshoppingzone.common.dto.shipping;

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
public class ShipmentDto {
    private Long id;
    private String shipmentReference;
    private Long orderId;
    private String orderNumber;
    private Long merchantId;
    private String provider;
    private String providerShipmentId;
    private String trackingNumber;
    private String carrier;
    private String trackingUrl;
    private ShipmentStatus status;
    private LocalDate estimatedDelivery;
    private String shippingAddressSnapshot;
    private String itemsSnapshot;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ShipmentEventDto> trackingEvents;
}
