package com.eshoppingzone.inventory.service.impl;

import com.eshoppingzone.common.dto.inventory.*;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.inventory.entity.Inventory;
import com.eshoppingzone.inventory.entity.InventoryHistory;
import com.eshoppingzone.inventory.event.InventoryEventPublisher;
import com.eshoppingzone.inventory.repository.InventoryHistoryRepository;
import com.eshoppingzone.inventory.repository.InventoryRepository;
import com.eshoppingzone.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceImpl.class);

    private final InventoryRepository inventoryRepository;
    private final InventoryHistoryRepository historyRepository;
    private final InventoryEventPublisher eventPublisher;

    public InventoryServiceImpl(InventoryRepository inventoryRepository,
                                InventoryHistoryRepository historyRepository,
                                InventoryEventPublisher eventPublisher) {
        this.inventoryRepository = inventoryRepository;
        this.historyRepository = historyRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryDto getInventory(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));
        return mapToDto(inventory);
    }

    @Override
    public StockReservationResponse reserveStock(StockReservationRequest request) {
        log.info("Attempting to reserve stock for orderId: {} with {} items", request.getOrderId(), request.getItems().size());
        List<StockReservationResponse.ReservedItemDetail> details = new ArrayList<>();

        // 1. Validation phase: check availability for all items first
        for (StockReservationRequest.StockItemRequest item : request.getItems()) {
            Inventory inv = inventoryRepository.findByProductId(item.getProductId())
                    .orElse(null);

            if (inv == null || inv.getAvailableStock() < item.getQuantity()) {
                int available = inv != null ? inv.getAvailableStock() : 0;
                log.warn("Insufficient stock for productId: {}. Requested: {}, Available: {}",
                        item.getProductId(), item.getQuantity(), available);

                details.add(StockReservationResponse.ReservedItemDetail.builder()
                        .productId(item.getProductId())
                        .requestedQuantity(item.getQuantity())
                        .reservedQuantity(0)
                        .available(false)
                        .build());

                return StockReservationResponse.builder()
                        .successful(false)
                        .orderId(request.getOrderId())
                        .message("Insufficient stock for product id: " + item.getProductId())
                        .reservedItems(details)
                        .build();
            }

            details.add(StockReservationResponse.ReservedItemDetail.builder()
                    .productId(item.getProductId())
                    .requestedQuantity(item.getQuantity())
                    .reservedQuantity(item.getQuantity())
                    .available(true)
                    .build());
        }

        // 2. Reservation phase: atomically decrement available and increment reserved
        for (StockReservationRequest.StockItemRequest item : request.getItems()) {
            int updated = inventoryRepository.atomicReserveStock(item.getProductId(), item.getQuantity());
            if (updated == 0) {
                log.error("Optimistic reservation failed for productId: {} (concurrent modification)", item.getProductId());
                throw new BadRequestException("Stock reservation failed due to concurrent update for product: " + item.getProductId());
            }

            Inventory current = inventoryRepository.findByProductId(item.getProductId()).orElseThrow();
            historyRepository.save(InventoryHistory.builder()
                    .productId(item.getProductId())
                    .orderId(request.getOrderId())
                    .changeType("RESERVE")
                    .quantity(item.getQuantity())
                    .availableStockAfter(current.getAvailableStock())
                    .reservedStockAfter(current.getReservedStock())
                    .build());
        }

        log.info("Successfully reserved stock for orderId: {}", request.getOrderId());
        return StockReservationResponse.builder()
                .successful(true)
                .orderId(request.getOrderId())
                .message("Stock reserved successfully")
                .reservedItems(details)
                .build();
    }

    @Override
    public void releaseStock(StockReleaseRequest request) {
        log.info("Releasing reserved stock for orderId: {}", request.getOrderId());
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return;
        }

        for (StockReservationRequest.StockItemRequest item : request.getItems()) {
            int updated = inventoryRepository.atomicReleaseStock(item.getProductId(), item.getQuantity());
            if (updated > 0) {
                Inventory current = inventoryRepository.findByProductId(item.getProductId()).orElseThrow();
                historyRepository.save(InventoryHistory.builder()
                        .productId(item.getProductId())
                        .orderId(request.getOrderId())
                        .changeType("RELEASE")
                        .quantity(item.getQuantity())
                        .availableStockAfter(current.getAvailableStock())
                        .reservedStockAfter(current.getReservedStock())
                        .build());
                log.info("Released {} units for productId: {}", item.getQuantity(), item.getProductId());
            }
        }
    }

    @Override
    public void confirmStock(StockConfirmRequest request) {
        log.info("Confirming reserved stock as sold for orderId: {}", request.getOrderId());
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return;
        }

        for (StockReservationRequest.StockItemRequest item : request.getItems()) {
            int updated = inventoryRepository.atomicConfirmStock(item.getProductId(), item.getQuantity());
            if (updated > 0) {
                Inventory current = inventoryRepository.findByProductId(item.getProductId()).orElseThrow();
                historyRepository.save(InventoryHistory.builder()
                        .productId(item.getProductId())
                        .orderId(request.getOrderId())
                        .changeType("CONFIRM")
                        .quantity(item.getQuantity())
                        .availableStockAfter(current.getAvailableStock())
                        .reservedStockAfter(current.getReservedStock())
                        .build());
                log.info("Confirmed {} units sold for productId: {}", item.getQuantity(), item.getProductId());

                if (current.getAvailableStock() <= current.getLowStockThreshold()) {
                    eventPublisher.publishLowStock(current.getProductId(), current.getAvailableStock(), current.getLowStockThreshold());
                }
            }
        }
    }

    @Override
    public InventoryDto updateStock(StockUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElseGet(() -> Inventory.builder()
                        .productId(request.getProductId())
                        .availableStock(0)
                        .reservedStock(0)
                        .soldStock(0)
                        .lowStockThreshold(5)
                        .build());

        inventory.setAvailableStock(request.getAvailableStock());
        if (request.getLowStockThreshold() != null) {
            inventory.setLowStockThreshold(request.getLowStockThreshold());
        }

        Inventory saved = inventoryRepository.save(inventory);

        historyRepository.save(InventoryHistory.builder()
                .productId(request.getProductId())
                .changeType("MANUAL_UPDATE")
                .quantity(request.getAvailableStock())
                .availableStockAfter(saved.getAvailableStock())
                .reservedStockAfter(saved.getReservedStock())
                .build());

        log.info("Updated inventory for productId: {}, new available: {}", request.getProductId(), saved.getAvailableStock());
        return mapToDto(saved);
    }

    private InventoryDto mapToDto(Inventory inventory) {
        int total = inventory.getAvailableStock() + inventory.getReservedStock() + inventory.getSoldStock();
        return InventoryDto.builder()
                .id(inventory.getId())
                .productId(inventory.getProductId())
                .availableStock(inventory.getAvailableStock())
                .reservedStock(inventory.getReservedStock())
                .soldStock(inventory.getSoldStock())
                .totalStock(total)
                .lowStockThreshold(inventory.getLowStockThreshold())
                .version(inventory.getVersion())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
