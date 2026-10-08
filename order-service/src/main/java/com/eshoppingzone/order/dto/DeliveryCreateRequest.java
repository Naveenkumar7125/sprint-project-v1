package com.eshoppingzone.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryCreateRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private Long customerId;

    private Long merchantId;

    private String recipientName;

    private String recipientPhone;

    @NotBlank(message = "Shipping address snapshot is required")
    private String shippingAddressSnapshot;

    private String customerNotes;
}

