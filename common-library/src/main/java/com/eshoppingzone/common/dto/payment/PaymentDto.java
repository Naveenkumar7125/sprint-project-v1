package com.eshoppingzone.common.dto.payment;

import com.eshoppingzone.common.enums.PaymentMethod;
import com.eshoppingzone.common.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private Long id;
    private String paymentReference;
    private Long orderId;
    private Long customerId;
    private BigDecimal amount;
    private String currency;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String failureReason;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
