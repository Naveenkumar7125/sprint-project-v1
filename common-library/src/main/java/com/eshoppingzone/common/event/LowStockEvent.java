package com.eshoppingzone.common.event;

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
public class LowStockEvent extends BaseEvent {
    private Long productId;
    private String productName;
    private Integer availableStock;
    private Integer threshold;
}
