package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.product.ProductDto;
import org.springframework.stereotype.Component;

@Component
public class ProductClientFallback implements ProductClient {
    @Override
    public ProductDto getProductById(Long id) {
        return null;
    }
}
