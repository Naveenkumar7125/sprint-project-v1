package com.eshoppingzone.order.client;

import com.eshoppingzone.order.dto.ProductDto;
import org.springframework.stereotype.Component;

@Component
public class ProductClientFallback implements ProductClient {
    @Override
    public ProductDto getProductById(Long id) {
        return null;
    }
}
