package com.eshoppingzone.wallet.controller;

import com.eshoppingzone.common.dto.wallet.*;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wallet")
@Tag(name = "Wallet & Finance", description = "Endpoints for user digital wallets, balance, top-up, and atomic transfers")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get current authenticated user's wallet details")
    public ResponseEntity<WalletDto> getWallet() {
        Long userId = SecurityUtils.getCurrentUserId();
        WalletDto wallet = walletService.getWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/balance")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get current wallet balance")
    public ResponseEntity<Map<String, Object>> getBalance() {
        Long userId = SecurityUtils.getCurrentUserId();
        BigDecimal balance = walletService.getBalance(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "balance", balance,
                "currency", "INR"
        ));
    }

    @PostMapping("/top-up")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Top-up wallet balance with idempotency key")
    public ResponseEntity<WalletDto> topUp(@Valid @RequestBody WalletTopUpRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        WalletDto updated = walletService.topUp(userId, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/transactions")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get transaction history for current user")
    public ResponseEntity<Page<WalletTransactionDto>> getTransactions(@PageableDefault(size = 20) Pageable pageable) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<WalletTransactionDto> transactions = walletService.getTransactions(userId, pageable);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/transactions/{reference}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get transaction details by reference")
    public ResponseEntity<WalletTransactionDto> getTransactionByReference(@PathVariable String reference) {
        WalletTransactionDto tx = walletService.getTransactionByReference(reference);
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/internal/transfer/customer-to-admin")
    @Operation(summary = "Internal Feign: Atomically debits customer and credits admin for an order")
    public ResponseEntity<InternalWalletTransferResponse> transferCustomerToAdmin(@Valid @RequestBody InternalWalletTransferRequest request) {
        InternalWalletTransferResponse response = walletService.transferCustomerToAdmin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/internal/transfer/admin-to-customer")
    @Operation(summary = "Internal Feign: Atomically debits admin and credits customer for a refund")
    public ResponseEntity<InternalWalletTransferResponse> transferAdminToCustomer(@Valid @RequestBody InternalWalletTransferRequest request) {
        InternalWalletTransferResponse response = walletService.transferAdminToCustomer(request);
        return ResponseEntity.ok(response);
    }
}
