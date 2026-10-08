package com.eshoppingzone.product.service.impl;

import com.eshoppingzone.product.dto.CategoryDto;
import com.eshoppingzone.product.dto.ProductCreateRequest;
import com.eshoppingzone.product.dto.ProductDto;
import com.eshoppingzone.product.dto.ProductUpdateRequest;
import com.eshoppingzone.product.exception.ConflictException;
import com.eshoppingzone.product.exception.ForbiddenException;
import com.eshoppingzone.product.exception.ResourceNotFoundException;
import com.eshoppingzone.product.entity.Category;
import com.eshoppingzone.product.entity.Product;
import com.eshoppingzone.product.repository.CategoryRepository;
import com.eshoppingzone.product.repository.ProductRepository;
import com.eshoppingzone.product.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import com.eshoppingzone.product.event.ProductSearchedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this(productRepository, categoryRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ProductServiceImpl(ProductRepository productRepository, 
                              CategoryRepository categoryRepository,
                              @org.springframework.beans.factory.annotation.Autowired(required = false) RabbitTemplate rabbitTemplate) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> getAllActiveProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable).map(this::mapToProductDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        return mapToProductDto(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> searchProducts(String query, Pageable pageable) {
        Page<ProductDto> result = productRepository.searchProducts(query, pageable).map(this::mapToProductDto);
        if (rabbitTemplate != null) {
            try {
                List<Long> matchedIds = result.getContent().stream().map(ProductDto::getId).collect(Collectors.toList());
                ProductSearchedEvent event = ProductSearchedEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType("PRODUCT_SEARCHED")
                        .timestamp(Instant.now())
                        .query(query)
                        .matchedProductIds(matchedIds)
                        .resultCount(result.getNumberOfElements())
                        .build();
                rabbitTemplate.convertAndSend(exchange, "product.searched", event);
                log.debug("Published ProductSearchedEvent for query: '{}' with {} matches", query, matchedIds.size());
            } catch (Exception e) {
                log.warn("Could not publish ProductSearchedEvent: {}", e.getMessage());
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> getProductsByCategory(String categoryName, Pageable pageable) {
        return productRepository.findByCategoryName(categoryName, pageable).map(this::mapToProductDto);
    }

    @Override
    public ProductDto createProduct(Long merchantId, ProductCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = Product.builder()
                .merchantId(merchantId)
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .active(true)
                .specifications(request.getSpecifications() != null ? new HashMap<>(request.getSpecifications()) : new HashMap<>())
                .build();

        Product saved = productRepository.save(product);
        log.info("Created product id: {} by merchantId: {}", saved.getId(), merchantId);
        return mapToProductDto(saved);
    }

    @Override
    public ProductDto updateProduct(Long merchantId, Long productId, ProductUpdateRequest request, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        validateOwnership(product, merchantId, isAdmin);

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
            product.setCategory(category);
        }
        if (request.getSpecifications() != null) {
            product.setSpecifications(new HashMap<>(request.getSpecifications()));
        }

        Product saved = productRepository.save(product);
        log.info("Updated product id: {} by merchantId: {} (isAdmin: {})", productId, merchantId, isAdmin);
        return mapToProductDto(saved);
    }

    @Override
    public ProductDto updateProductStatus(Long merchantId, Long productId, boolean active, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        validateOwnership(product, merchantId, isAdmin);

        product.setActive(active);
        Product saved = productRepository.save(product);
        log.info("Updated product status for id: {} to active: {} by merchantId: {}", productId, active, merchantId);
        return mapToProductDto(saved);
    }

    @Override
    public void deleteProduct(Long merchantId, Long productId, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        validateOwnership(product, merchantId, isAdmin);

        productRepository.delete(product);
        log.info("Deleted product id: {} by merchantId: {} (isAdmin: {})", productId, merchantId, isAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToCategoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDto createCategory(CategoryDto categoryDto) {
        if (categoryRepository.existsByNameIgnoreCase(categoryDto.getName())) {
            throw new ConflictException("Category already exists with name: " + categoryDto.getName());
        }

        Category category = Category.builder()
                .name(categoryDto.getName())
                .description(categoryDto.getDescription())
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category id: {}, name: {}", saved.getId(), saved.getName());
        return mapToCategoryDto(saved);
    }

    @Override
    public CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (!category.getName().equalsIgnoreCase(categoryDto.getName()) &&
                categoryRepository.existsByNameIgnoreCase(categoryDto.getName())) {
            throw new ConflictException("Category already exists with name: " + categoryDto.getName());
        }

        category.setName(categoryDto.getName());
        if (categoryDto.getDescription() != null) {
            category.setDescription(categoryDto.getDescription());
        }

        Category updated = categoryRepository.save(category);
        log.info("Updated category id: {}, name: {}", updated.getId(), updated.getName());
        return mapToCategoryDto(updated);
    }

    @Override
    public void deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        long productCount = productRepository.countByCategoryId(categoryId);
        if (productCount > 0) {
            throw new ConflictException("Cannot delete category '" + category.getName() + "' because it has " + productCount + " products assigned to it. Please reassign or delete the products first.");
        }

        categoryRepository.delete(category);
        log.info("Deleted category id: {}, name: {}", categoryId, category.getName());
    }

    private void validateOwnership(Product product, Long merchantId, boolean isAdmin) {
        if (!isAdmin && !product.getMerchantId().equals(merchantId)) {
            throw new ForbiddenException("You do not have permission to modify this product");
        }
    }

    private ProductDto mapToProductDto(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .merchantId(product.getMerchantId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .imageUrl(product.getImageUrl())
                .active(product.isActive())
                .specifications(product.getSpecifications())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private CategoryDto mapToCategoryDto(Category category) {
        long count = productRepository.countByCategoryId(category.getId());
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .productCount(count)
                .build();
    }
}
