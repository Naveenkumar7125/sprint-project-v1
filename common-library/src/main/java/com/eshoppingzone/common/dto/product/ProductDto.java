package com.eshoppingzone.common.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private Long merchantId;
    private String name;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private String categoryName;
    private String imageUrl;
    private Boolean active;
    private Map<String, String> specifications;
    private Instant createdAt;
    private Instant updatedAt;
}
