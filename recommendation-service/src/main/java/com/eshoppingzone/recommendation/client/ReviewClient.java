package com.eshoppingzone.recommendation.client;

import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "review-service")
public interface ReviewClient {

    @GetMapping("/api/v1/reviews/product/{productId}/summary")
    ProductReviewSummaryDto getProductReviewSummary(@PathVariable("productId") Long productId);
}
