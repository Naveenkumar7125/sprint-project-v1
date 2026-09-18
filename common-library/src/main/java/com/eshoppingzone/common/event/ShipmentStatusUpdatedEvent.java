package com.eshoppingzone.common.event;

import com.eshoppingzone.common.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ShipmentStatusUpdatedEvent extends BaseEvent {
    private Long shipmentId;
    private String trackingNumber;
    private Long orderId;
    private ShipmentStatus previousStatus;
    private ShipmentStatus currentStatus;
    private String location;
    private String description;
}
