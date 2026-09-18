package com.eshoppingzone.common.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FrequentlyPurchasedTogetherDto {
    private Long primaryProductId;
    private String primaryProductName;
    private List<RecommendedItem> frequentlyPurchasedItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedItem {
        private Long productId;
        private String name;
        private BigDecimal price;
        private String imageUrl;
        private String categoryName;
        private Long coPurchaseFrequency;
        private Double averageRating;
    }
}
