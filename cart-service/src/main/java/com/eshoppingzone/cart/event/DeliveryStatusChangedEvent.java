package com.eshoppingzone.cart.event;

import com.eshoppingzone.cart.enums.DeliveryStatus;
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
public class DeliveryStatusChangedEvent extends BaseEvent {
    private Long deliveryId;
    private Long orderId;
    private String trackingNumber;
    private DeliveryStatus previousStatus;
    private DeliveryStatus newStatus;
    private Long deliveryAgentId;
    private String remarks;
}
