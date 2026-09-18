package com.eshoppingzone.common.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendationDto {
    private Long productId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String categoryName;
    private Long merchantId;
    private Long searchCount;
    private Long purchaseCount;
    private Double averageRating;
    private Long ratingCount;
    private Double popularityScore;
    private String recommendationReason;
    private Map<String, String> specifications;
}
