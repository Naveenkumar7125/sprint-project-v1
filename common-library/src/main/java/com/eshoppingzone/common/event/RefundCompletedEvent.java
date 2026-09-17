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
public class RefundCompletedEvent extends BaseEvent {
    private Long refundId;
    private String refundReference;
    private Long paymentId;
    private Long orderId;
    private Long customerId;
    private BigDecimal amount;
}
