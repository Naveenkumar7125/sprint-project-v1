package com.eshoppingzone.common.dto.inventory;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReleaseRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private List<StockReservationRequest.StockItemRequest> items;
}
