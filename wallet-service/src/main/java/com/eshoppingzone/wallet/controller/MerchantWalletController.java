package com.eshoppingzone.wallet.controller;

import com.eshoppingzone.wallet.dto.MerchantWalletDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.dto.WalletTransactionDto;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import com.eshoppingzone.wallet.enums.UserRole;
import com.eshoppingzone.wallet.exception.ForbiddenException;
import com.eshoppingzone.wallet.security.SecurityUtils;
import com.eshoppingzone.wallet.service.SettlementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/merchant", "/api/merchant", "/api/v1/wallet/merchant"})
@RequiredArgsConstructor
@Tag(name = "Merchant Finance & Settlements", description = "Endpoints for multi-vendor merchant balances, pending earnings, and settlement history")
public class MerchantWalletController {

    private final SettlementService settlementService;

    @GetMapping("/wallet")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @Operation(summary = "Get merchant wallet with pending balance, available balance, and total earnings")
    public ResponseEntity<MerchantWalletDto> getMerchantWallet(
            @RequestParam(name = "merchantId", required = false) Long explicitMerchantId) {
        Long targetMerchantId = resolveAuthorizedMerchantId(explicitMerchantId);
        MerchantWalletDto wallet = settlementService.getMerchantWallet(targetMerchantId);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/settlements")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @Operation(summary = "Get paginated settlement history for authenticated merchant")
    public ResponseEntity<Page<SettlementDto>> getMerchantSettlements(
            @RequestParam(name = "status", required = false) SettlementStatus status,
            @RequestParam(name = "merchantId", required = false) Long explicitMerchantId,
            @PageableDefault(size = 20) Pageable pageable) {
        Long targetMerchantId = resolveAuthorizedMerchantId(explicitMerchantId);
        Page<SettlementDto> settlements = settlementService.getMerchantSettlements(targetMerchantId, status, pageable);
        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/transactions")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @Operation(summary = "Get ledger transaction history for authenticated merchant")
    public ResponseEntity<Page<WalletTransactionDto>> getMerchantTransactions(
            @RequestParam(name = "merchantId", required = false) Long explicitMerchantId,
            @PageableDefault(size = 20) Pageable pageable) {
        Long targetMerchantId = resolveAuthorizedMerchantId(explicitMerchantId);
        Page<WalletTransactionDto> transactions = settlementService.getMerchantTransactions(targetMerchantId, pageable);
        return ResponseEntity.ok(transactions);
    }

    private Long resolveAuthorizedMerchantId(Long explicitMerchantId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserRole currentRole = SecurityUtils.getCurrentUserRole();

        if (currentRole == UserRole.ADMIN) {
            return explicitMerchantId != null ? explicitMerchantId : currentUserId;
        }

        if (currentRole == UserRole.MERCHANT) {
            if (explicitMerchantId != null && !explicitMerchantId.equals(currentUserId)) {
                throw new ForbiddenException("Merchants are only permitted to access their own financial records");
            }
            return currentUserId;
        }

        throw new ForbiddenException("Only merchants and administrators can access merchant financial portals");
    }
}
