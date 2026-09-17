package com.eshoppingzone.common.dto.delivery;

import com.eshoppingzone.common.enums.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDto {
    private Long id;
    private Long orderId;
    private String trackingNumber;
    private Long deliveryAgentId;
    private String deliveryAgentName;
    private String deliveryAgentPhone;
    private DeliveryStatus status;
    private String shippingAddressSnapshot;
    private String customerNotes;
    private Instant estimatedDeliveryTime;
    private Instant deliveredAt;
    private Instant createdAt;
    private Instant updatedAt;
}
