package com.eshoppingzone.common.dto.delivery;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAssignmentRequest {

    @NotNull(message = "Delivery Agent User ID is required")
    private Long deliveryAgentId;
}
