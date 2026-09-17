package com.eshoppingzone.common.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewSummaryDto {
    private Long productId;
    private Double averageRating;
    private Long totalReviews;
    private List<ReviewDto> recentReviews;
}
