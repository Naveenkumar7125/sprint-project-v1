package com.eshoppingzone.wallet.dto;

import com.eshoppingzone.wallet.enums.WalletStatus;
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
public class MerchantWalletDto {
    private Long id;
    private Long merchantId;
    private BigDecimal pendingBalance;
    private BigDecimal availableBalance;
    private BigDecimal totalBalance;
    private BigDecimal totalEarnings;
    private String currency;
    private WalletStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
