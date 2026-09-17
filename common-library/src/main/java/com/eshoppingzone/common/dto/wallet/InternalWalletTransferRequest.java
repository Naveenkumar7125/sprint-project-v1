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
public class InternalWalletTransferRequest {

    @NotNull(message = "Customer User ID is required")
    private Long customerUserId;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Transaction reference / Idempotency key is required")
    private String transactionReference;

    private String description;
    private Long orderId;
}
