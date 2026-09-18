package com.eshoppingzone.common.event;

import com.eshoppingzone.common.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ShipmentCreatedEvent extends BaseEvent {
    private Long shipmentId;
    private String shipmentReference;
    private Long orderId;
    private String orderNumber;
    private Long merchantId;
    private String trackingNumber;
    private String carrier;
    private String trackingUrl;
    private ShipmentStatus status;
    private LocalDate estimatedDelivery;
}
