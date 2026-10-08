package com.eshoppingzone.delivery.dto;

import com.eshoppingzone.delivery.enums.DeliveryStatus;
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
    private Long customerId;
    private Long merchantId;
    private String trackingNumber;
    private Long deliveryAgentId;
    private String deliveryAgentName;
    private String deliveryAgentPhone;
    private DeliveryStatus status;
    private String recipientName;
    private String recipientPhone;
    private String deliveryAddress;
    private String shippingAddressSnapshot;
    private String pickupAddressSnapshot;
    private String customerNotes;
    private Instant estimatedDeliveryTime;
    private Instant assignedAt;
    private Instant pickedUpAt;
    private Instant deliveredAt;
    private Instant createdAt;
    private Instant updatedAt;
}
