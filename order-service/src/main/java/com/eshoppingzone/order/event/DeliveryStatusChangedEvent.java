package com.eshoppingzone.order.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.eshoppingzone.order.enums.DeliveryStatus;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryStatusChangedEvent extends BaseEvent {
    private Long deliveryId;
    private Long orderId;
    private Long customerId;
    private String trackingNumber;
    private DeliveryStatus previousStatus;
    private DeliveryStatus newStatus;
    private Long deliveryAgentId;
    private String deliveryAgentName;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String remarks;
}
