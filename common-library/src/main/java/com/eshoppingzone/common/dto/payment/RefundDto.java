package com.eshoppingzone.common.dto.payment;

import com.eshoppingzone.common.enums.RefundStatus;
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
public class RefundDto {
    private Long id;
    private String refundReference;
    private Long paymentId;
    private Long orderId;
    private Long customerId;
    private BigDecimal amount;
    private RefundStatus status;
    private String reason;
    private Instant createdAt;
    private Instant updatedAt;
}
