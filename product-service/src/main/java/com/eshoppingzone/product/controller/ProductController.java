package com.eshoppingzone.product.controller;

import com.eshoppingzone.common.dto.product.CategoryDto;
import com.eshoppingzone.common.dto.product.ProductCreateRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.product.ProductUpdateRequest;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product & Catalogue", description = "Endpoints for public product search/browsing and merchant catalogue management")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Browse active products with pagination (Public)")
    public ResponseEntity<Page<ProductDto>> getAllProducts(@ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductDto> products = productService.getAllActiveProducts(pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product details by ID (Public)")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/search")
    @Operation(summary = "Search products by keyword in name or description (Public)")
    public ResponseEntity<Page<ProductDto>> searchProducts(@RequestParam String query,
                                                            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductDto> products = productService.searchProducts(query, pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Browse products by category name (Public)")
    public ResponseEntity<Page<ProductDto>> getProductsByCategory(@PathVariable String category,
                                                                  @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductDto> products = productService.getProductsByCategory(category, pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/categories")
    @Operation(summary = "List all product categories (Public)")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = productService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Create a new product category (ADMIN only)")
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryDto categoryDto) {
        CategoryDto created = productService.createCategory(categoryDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Create a new product listing (MERCHANT / ADMIN)")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        Long merchantId = SecurityUtils.getCurrentUserId();
        ProductDto created = productService.createProduct(merchantId, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update product details (Merchant ownership enforced)")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id,
                                                    @Valid @RequestBody ProductUpdateRequest request) {
        Long callerId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.getCurrentUserRole() == UserRole.ADMIN;
        ProductDto updated = productService.updateProduct(callerId, id, request, isAdmin);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Activate or deactivate a product listing")
    public ResponseEntity<ProductDto> updateProductStatus(@PathVariable Long id,
                                                          @RequestParam boolean active) {
        Long callerId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.getCurrentUserRole() == UserRole.ADMIN;
        ProductDto updated = productService.updateProductStatus(callerId, id, active, isAdmin);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Delete a product listing (Merchant ownership enforced)")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Long callerId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.getCurrentUserRole() == UserRole.ADMIN;
        productService.deleteProduct(callerId, id, isAdmin);
        return ResponseEntity.noContent().build();
    }
}
