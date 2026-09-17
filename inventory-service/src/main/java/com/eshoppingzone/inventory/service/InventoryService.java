package com.eshoppingzone.inventory.service;

import com.eshoppingzone.common.dto.inventory.*;

public interface InventoryService {

    InventoryDto getInventory(Long productId);

    StockReservationResponse reserveStock(StockReservationRequest request);

    void releaseStock(StockReleaseRequest request);

    void confirmStock(StockConfirmRequest request);

    InventoryDto updateStock(StockUpdateRequest request);
}
