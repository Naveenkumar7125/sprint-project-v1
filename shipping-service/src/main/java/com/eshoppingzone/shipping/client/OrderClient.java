package com.eshoppingzone.shipping.client;

import com.eshoppingzone.common.dto.order.OrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "order-service")
public interface OrderClient {

    @GetMapping("/api/v1/orders/{id}")
    OrderDto getOrderById(@PathVariable("id") Long id);
}
