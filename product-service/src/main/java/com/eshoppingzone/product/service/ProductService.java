package com.eshoppingzone.product.service;

import com.eshoppingzone.common.dto.product.CategoryDto;
import com.eshoppingzone.common.dto.product.ProductCreateRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.product.ProductUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {

    Page<ProductDto> getAllActiveProducts(Pageable pageable);

    ProductDto getProductById(Long productId);

    Page<ProductDto> searchProducts(String query, Pageable pageable);

    Page<ProductDto> getProductsByCategory(String categoryName, Pageable pageable);

    ProductDto createProduct(Long merchantId, ProductCreateRequest request);

    ProductDto updateProduct(Long merchantId, Long productId, ProductUpdateRequest request, boolean isAdmin);

    ProductDto updateProductStatus(Long merchantId, Long productId, boolean active, boolean isAdmin);

    void deleteProduct(Long merchantId, Long productId, boolean isAdmin);

    List<CategoryDto> getAllCategories();

    CategoryDto createCategory(CategoryDto categoryDto);
}
