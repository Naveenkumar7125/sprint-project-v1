package com.eshoppingzone.payment.dto;

import com.eshoppingzone.payment.enums.PaymentMethod;
import com.eshoppingzone.payment.enums.PaymentStatus;
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
