package com.eshoppingzone.payment.dto;

import com.eshoppingzone.payment.enums.UserRole;
import com.eshoppingzone.payment.enums.WalletStatus;
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
public class WalletDto {
    private Long id;
    private Long userId;
    private UserRole role;
    private BigDecimal balance;
    private String currency;
    private WalletStatus status;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
