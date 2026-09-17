package com.eshoppingzone.review.service;

import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import com.eshoppingzone.common.dto.review.ReviewCreateRequest;
import com.eshoppingzone.common.dto.review.ReviewDto;
import com.eshoppingzone.common.dto.review.ReviewUpdateRequest;
import com.eshoppingzone.common.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewDto createReview(ReviewCreateRequest request, Long customerId, String username);
    ReviewDto updateReview(Long reviewId, ReviewUpdateRequest request, Long customerId);
    void deleteReview(Long reviewId, Long customerId, UserRole userRole);
    Page<ReviewDto> getProductReviews(Long productId, Pageable pageable);
    Page<ReviewDto> getCustomerReviews(Long customerId, Pageable pageable);
    ProductReviewSummaryDto getProductReviewSummary(Long productId);
}
