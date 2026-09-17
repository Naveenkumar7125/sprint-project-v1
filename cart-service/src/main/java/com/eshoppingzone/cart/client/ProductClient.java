package com.eshoppingzone.cart.client;

import com.eshoppingzone.common.dto.product.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", fallback = ProductClientFallback.class)
public interface ProductClient {

    @GetMapping("/api/v1/products/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);
}
