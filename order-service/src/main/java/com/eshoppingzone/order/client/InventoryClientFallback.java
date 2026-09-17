package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.inventory.StockConfirmRequest;
import com.eshoppingzone.common.dto.inventory.StockReleaseRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationResponse;
import org.springframework.stereotype.Component;

@Component
public class InventoryClientFallback implements InventoryClient {
    @Override
    public StockReservationResponse reserveStock(StockReservationRequest request) {
        return StockReservationResponse.builder()
                .orderId(request.getOrderId())
                .successful(false)
                .message("Inventory service is currently unavailable")
                .build();
    }

    @Override
    public void releaseStock(StockReleaseRequest request) {
        // Fallback log / no-op
    }

    @Override
    public void confirmStock(StockConfirmRequest request) {
        // Fallback log / no-op
    }
}
