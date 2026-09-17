package com.eshoppingzone.inventory.service;

import com.eshoppingzone.common.dto.inventory.StockConfirmRequest;
import com.eshoppingzone.common.dto.inventory.StockReleaseRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationResponse;
import com.eshoppingzone.inventory.entity.Inventory;
import com.eshoppingzone.inventory.event.InventoryEventPublisher;
import com.eshoppingzone.inventory.repository.InventoryHistoryRepository;
import com.eshoppingzone.inventory.repository.InventoryRepository;
import com.eshoppingzone.inventory.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryHistoryRepository historyRepository;

    @Mock
    private InventoryEventPublisher eventPublisher;

    private InventoryServiceImpl inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryServiceImpl(inventoryRepository, historyRepository, eventPublisher);
    }

    @Test
    @DisplayName("Reserve stock successfully when available quantity is sufficient")
    void reserveStock_Success() {
        StockReservationRequest request = StockReservationRequest.builder()
                .orderId(1001L)
                .items(List.of(
                        StockReservationRequest.StockItemRequest.builder().productId(10L).quantity(2).build(),
                        StockReservationRequest.StockItemRequest.builder().productId(20L).quantity(1).build()
                ))
                .build();

        Inventory inv1 = Inventory.builder().id(1L).productId(10L).availableStock(10).reservedStock(0).soldStock(0).build();
        Inventory inv2 = Inventory.builder().id(2L).productId(20L).availableStock(5).reservedStock(0).soldStock(0).build();

        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(inv1));
        when(inventoryRepository.findByProductId(20L)).thenReturn(Optional.of(inv2));
        when(inventoryRepository.atomicReserveStock(10L, 2)).thenReturn(1);
        when(inventoryRepository.atomicReserveStock(20L, 1)).thenReturn(1);

        StockReservationResponse response = inventoryService.reserveStock(request);

        assertNotNull(response);
        assertTrue(response.isSuccessful());
        assertEquals(1001L, response.getOrderId());
        verify(inventoryRepository, times(1)).atomicReserveStock(10L, 2);
        verify(inventoryRepository, times(1)).atomicReserveStock(20L, 1);
        verify(historyRepository, times(2)).save(any());
    }

    @Test
    @DisplayName("Reserve stock returns failure when stock is insufficient (Overselling prevention)")
    void reserveStock_InsufficientStock_ReturnsFailure() {
        StockReservationRequest request = StockReservationRequest.builder()
                .orderId(1002L)
                .items(List.of(
                        StockReservationRequest.StockItemRequest.builder().productId(10L).quantity(15).build() // Requesting 15
                ))
                .build();

        Inventory inv1 = Inventory.builder().id(1L).productId(10L).availableStock(10).reservedStock(0).soldStock(0).build(); // Only 10 available

        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(inv1));

        StockReservationResponse response = inventoryService.reserveStock(request);

        assertNotNull(response);
        assertFalse(response.isSuccessful());
        assertTrue(response.getMessage().contains("Insufficient stock"));
        verify(inventoryRepository, never()).atomicReserveStock(any(), any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Release stock restores reserved quantity back to available")
    void releaseStock_Success() {
        StockReleaseRequest request = StockReleaseRequest.builder()
                .orderId(1001L)
                .items(List.of(
                        StockReservationRequest.StockItemRequest.builder().productId(10L).quantity(2).build()
                ))
                .build();

        Inventory currentInv = Inventory.builder().id(1L).productId(10L).availableStock(10).reservedStock(0).soldStock(0).build();

        when(inventoryRepository.atomicReleaseStock(10L, 2)).thenReturn(1);
        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(currentInv));

        inventoryService.releaseStock(request);

        verify(inventoryRepository, times(1)).atomicReleaseStock(10L, 2);
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Confirm stock commits reserved units to sold and fires low stock alert if threshold reached")
    void confirmStock_TriggersLowStockAlert() {
        StockConfirmRequest request = StockConfirmRequest.builder()
                .orderId(1001L)
                .items(List.of(
                        StockReservationRequest.StockItemRequest.builder().productId(10L).quantity(2).build()
                ))
                .build();

        // 3 remaining available <= threshold of 5
        Inventory currentInv = Inventory.builder()
                .id(1L)
                .productId(10L)
                .availableStock(3)
                .reservedStock(0)
                .soldStock(2)
                .lowStockThreshold(5)
                .build();

        when(inventoryRepository.atomicConfirmStock(10L, 2)).thenReturn(1);
        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(currentInv));

        inventoryService.confirmStock(request);

        verify(inventoryRepository, times(1)).atomicConfirmStock(10L, 2);
        verify(eventPublisher, times(1)).publishLowStock(10L, 3, 5);
    }
}
