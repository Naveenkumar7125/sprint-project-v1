package com.eshoppingzone.common.dto.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTopUpRequest {

    @NotNull(message = "Top-up amount is required")
    @DecimalMin(value = "1.00", message = "Minimum top-up amount is 1.00")
    private BigDecimal amount;

    @NotBlank(message = "Top-up reference/idempotency key is required")
    private String referenceId;
}
