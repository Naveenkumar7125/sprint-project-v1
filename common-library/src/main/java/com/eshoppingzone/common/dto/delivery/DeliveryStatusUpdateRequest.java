package com.eshoppingzone.common.dto.delivery;

import com.eshoppingzone.common.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStatusUpdateRequest {

    @NotNull(message = "Delivery status is required")
    private DeliveryStatus status;

    private String remarks;
}
