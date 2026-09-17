package com.eshoppingzone.product.service;

import com.eshoppingzone.common.dto.product.ProductCreateRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.product.ProductUpdateRequest;
import com.eshoppingzone.common.exception.ForbiddenException;
import com.eshoppingzone.product.entity.Category;
import com.eshoppingzone.product.entity.Product;
import com.eshoppingzone.product.repository.CategoryRepository;
import com.eshoppingzone.product.repository.ProductRepository;
import com.eshoppingzone.product.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productService = new ProductServiceImpl(productRepository, categoryRepository);
    }

    @Test
    @DisplayName("Create product listing successfully by merchant")
    void createProduct_Success() {
        Category category = Category.builder().id(1L).name("Electronics").build();

        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Wireless Noise-Canceling Headphones")
                .description("High-end bluetooth headphones")
                .price(new BigDecimal("199.99"))
                .categoryId(1L)
                .imageUrl("https://example.com/headphones.jpg")
                .specifications(new HashMap<>())
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        Product savedProduct = Product.builder()
                .id(10L)
                .merchantId(50L)
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        ProductDto result = productService.createProduct(50L, request);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Wireless Noise-Canceling Headphones", result.getName());
        assertEquals(new BigDecimal("199.99"), result.getPrice());
        assertEquals(50L, result.getMerchantId());
    }

    @Test
    @DisplayName("Update own product successfully by merchant")
    void updateProduct_OwnProduct_Success() {
        Category category = Category.builder().id(1L).name("Electronics").build();

        Product product = Product.builder()
                .id(10L)
                .merchantId(50L)
                .category(category)
                .name("Old Product Name")
                .description("Old Description")
                .price(new BigDecimal("100.00"))
                .active(true)
                .build();

        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("New Product Name")
                .price(new BigDecimal("120.00"))
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductDto result = productService.updateProduct(50L, 10L, request, false);

        assertNotNull(result);
        assertEquals("New Product Name", product.getName());
        assertEquals(new BigDecimal("120.00"), product.getPrice());
    }

    @Test
    @DisplayName("Update product of another merchant throws ForbiddenException")
    void updateProduct_OtherMerchant_ThrowsForbidden() {
        Category category = Category.builder().id(1L).name("Electronics").build();

        Product product = Product.builder()
                .id(10L)
                .merchantId(50L) // Owned by merchant 50
                .category(category)
                .name("Product Name")
                .price(new BigDecimal("100.00"))
                .active(true)
                .build();

        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Malicious Edit")
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        // Merchant 99 attempts to update merchant 50's product
        assertThrows(ForbiddenException.class, () ->
                productService.updateProduct(99L, 10L, request, false)
        );

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Admin can update any product regardless of merchantId")
    void updateProduct_ByAdmin_Success() {
        Category category = Category.builder().id(1L).name("Electronics").build();

        Product product = Product.builder()
                .id(10L)
                .merchantId(50L)
                .category(category)
                .name("Product Name")
                .price(new BigDecimal("100.00"))
                .active(true)
                .build();

        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Admin Modifies Name")
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductDto result = productService.updateProduct(1L, 10L, request, true); // isAdmin = true

        assertNotNull(result);
        assertEquals("Admin Modifies Name", product.getName());
    }

    @Test
    @DisplayName("Search active products returns matching page")
    void searchProducts_Success() {
        Category category = Category.builder().id(1L).name("Electronics").build();

        Product product = Product.builder()
                .id(10L)
                .merchantId(50L)
                .category(category)
                .name("Apple iPhone 15")
                .description("Latest smartphone")
                .price(new BigDecimal("999.99"))
                .active(true)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.searchProducts("iphone", pageable))
                .thenReturn(new PageImpl<>(List.of(product)));

        Page<ProductDto> result = productService.searchProducts("iphone", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Apple iPhone 15", result.getContent().get(0).getName());
    }
}
