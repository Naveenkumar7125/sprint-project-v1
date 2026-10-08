package com.eshoppingzone.wallet.controller;

import com.eshoppingzone.wallet.dto.PlatformCommissionSummaryDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.enums.SettlementStatus;
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
@RequestMapping({"/api/v1/admin", "/api/admin", "/api/v1/wallet/admin"})
@RequiredArgsConstructor
@Tag(name = "Admin Platform Settlements & Commissions", description = "Endpoints for platform-wide multi-vendor settlements and commission auditing")
public class AdminSettlementController {

    private final SettlementService settlementService;

    @GetMapping("/settlements")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get platform-wide merchant settlements with optional status/merchant filters")
    public ResponseEntity<Page<SettlementDto>> getAdminSettlements(
            @RequestParam(name = "status", required = false) SettlementStatus status,
            @RequestParam(name = "merchantId", required = false) Long merchantId,
            @RequestParam(name = "orderId", required = false) Long orderId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<SettlementDto> settlements = settlementService.getAdminSettlements(status, merchantId, orderId, pageable);
        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/commissions")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get aggregated platform commission statistics, gross merchandise value, and status counts")
    public ResponseEntity<PlatformCommissionSummaryDto> getAdminCommissions() {
        PlatformCommissionSummaryDto summary = settlementService.getAdminCommissionSummary();
        return ResponseEntity.ok(summary);
    }
}
