package com.eshoppingzone.wallet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformCommissionSummaryDto {
    private BigDecimal configuredCommissionPercentage;
    private BigDecimal totalGrossMerchandiseValue;
    private BigDecimal totalPlatformCommission;
    private BigDecimal pendingPlatformCommission;
    private BigDecimal settledPlatformCommission;
    private long totalSettlementsCount;
    private long pendingSettlementsCount;
    private long completedSettlementsCount;
    private long cancelledSettlementsCount;
}
