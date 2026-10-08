package com.eshoppingzone.order.client;

import com.eshoppingzone.order.dto.StockConfirmRequest;
import com.eshoppingzone.order.dto.StockReleaseRequest;
import com.eshoppingzone.order.dto.StockReservationRequest;
import com.eshoppingzone.order.dto.StockReservationResponse;
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
