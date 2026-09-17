package com.eshoppingzone.inventory.controller;

import com.eshoppingzone.common.dto.inventory.*;
import com.eshoppingzone.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory & Stock", description = "Endpoints for checking product stock, reservations, release, and confirmations")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get current stock availability for a product (Public)")
    public ResponseEntity<InventoryDto> getInventory(@PathVariable Long productId) {
        InventoryDto dto = inventoryService.getInventory(productId);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/reserve")
    @Operation(summary = "Atomically reserve stock for an order (Internal / Saga Step)")
    public ResponseEntity<StockReservationResponse> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        StockReservationResponse response = inventoryService.reserveStock(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/release")
    @Operation(summary = "Release reserved stock for a cancelled/failed order (Internal / Saga Compensation)")
    public ResponseEntity<Void> releaseStock(@Valid @RequestBody StockReleaseRequest request) {
        inventoryService.releaseStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm reserved stock as sold upon successful payment (Internal / Saga Step)")
    public ResponseEntity<Void> confirmStock(@Valid @RequestBody StockConfirmRequest request) {
        inventoryService.confirmStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/stock-update")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Initialize or update product stock quantity (MERCHANT / ADMIN)")
    public ResponseEntity<InventoryDto> updateStock(@Valid @RequestBody StockUpdateRequest request) {
        InventoryDto updated = inventoryService.updateStock(request);
        return ResponseEntity.ok(updated);
    }
}
