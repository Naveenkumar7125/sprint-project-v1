package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.inventory.StockConfirmRequest;
import com.eshoppingzone.common.dto.inventory.StockReleaseRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationRequest;
import com.eshoppingzone.common.dto.inventory.StockReservationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service", fallback = InventoryClientFallback.class)
public interface InventoryClient {

    @PostMapping("/api/v1/inventory/reserve")
    StockReservationResponse reserveStock(@RequestBody StockReservationRequest request);

    @PostMapping("/api/v1/inventory/release")
    void releaseStock(@RequestBody StockReleaseRequest request);

    @PostMapping("/api/v1/inventory/confirm")
    void confirmStock(@RequestBody StockConfirmRequest request);
}
