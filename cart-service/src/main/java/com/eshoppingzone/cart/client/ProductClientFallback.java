package com.eshoppingzone.cart.client;

import com.eshoppingzone.cart.dto.ProductDto;
import com.eshoppingzone.cart.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ProductClientFallback implements ProductClient {

    private static final Logger log = LoggerFactory.getLogger(ProductClientFallback.class);

    @Override
    public ProductDto getProductById(Long id) {
        log.error("Fallback triggered for ProductClient.getProductById with id: {}", id);
        throw new ResourceNotFoundException("Product Service is temporarily unavailable or product id not found: " + id);
    }
}
