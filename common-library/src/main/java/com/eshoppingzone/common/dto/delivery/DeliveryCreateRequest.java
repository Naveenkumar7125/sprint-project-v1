package com.eshoppingzone.common.dto.delivery;

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

    @NotBlank(message = "Shipping address snapshot is required")
    private String shippingAddressSnapshot;

    private String customerNotes;
}
