package com.eshoppingzone.common.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDto {
    private Long id;
    private Long productId;
    private Integer availableStock;
    private Integer reservedStock;
    private Integer soldStock;
    private Integer totalStock;
    private Integer lowStockThreshold;
    private Long version;
    private Instant updatedAt;
}
