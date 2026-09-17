package com.eshoppingzone.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderCancelledEvent extends BaseEvent {
    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private BigDecimal refundAmount;
    private String cancellationReason;
}
