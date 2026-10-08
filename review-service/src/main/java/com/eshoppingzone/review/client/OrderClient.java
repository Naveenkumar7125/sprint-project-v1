package com.eshoppingzone.review.client;

import com.eshoppingzone.review.dto.OrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "order-service", fallback = OrderClientFallback.class)
public interface OrderClient {

    @GetMapping("/api/v1/orders/my-orders")
    Page<OrderDto> getMyOrders(@RequestParam("page") int page, @RequestParam("size") int size);
}
