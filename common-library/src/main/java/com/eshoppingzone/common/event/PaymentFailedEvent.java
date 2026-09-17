package com.eshoppingzone.common.event;

import com.eshoppingzone.common.enums.PaymentMethod;
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
public class PaymentFailedEvent extends BaseEvent {
    private Long paymentId;
    private String paymentReference;
    private Long orderId;
    private Long customerId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String failureReason;
}
