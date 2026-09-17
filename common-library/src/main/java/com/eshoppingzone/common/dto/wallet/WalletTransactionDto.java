package com.eshoppingzone.common.dto.wallet;

import com.eshoppingzone.common.enums.TransactionStatus;
import com.eshoppingzone.common.enums.TransactionType;
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
public class WalletTransactionDto {
    private Long id;
    private String transactionReference;
    private Long walletId;
    private Long userId;
    private TransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private TransactionStatus status;
    private String description;
    private String sourceParty;
    private String destinationParty;
    private Instant createdAt;
}
