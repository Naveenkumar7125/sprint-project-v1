package com.eshoppingzone.wallet.dto;

import com.eshoppingzone.wallet.enums.SettlementStatus;
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
public class SettlementDto {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private Long merchantId;
    private BigDecimal grossAmount;
    private BigDecimal commissionPercentage;
    private BigDecimal platformCommission;
    private BigDecimal merchantAmount;
    private SettlementStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
