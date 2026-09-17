package com.eshoppingzone.common.dto.wallet;

import com.eshoppingzone.common.enums.TransactionStatus;
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
public class InternalWalletTransferResponse {
    private boolean successful;
    private String transactionReference;
    private BigDecimal amount;
    private TransactionStatus status;
    private String message;
    private BigDecimal customerRemainingBalance;
    private Instant processedAt;
}
