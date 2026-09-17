package com.eshoppingzone.review.controller;

import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import com.eshoppingzone.common.dto.review.ReviewCreateRequest;
import com.eshoppingzone.common.dto.review.ReviewDto;
import com.eshoppingzone.common.dto.review.ReviewUpdateRequest;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Review Controller", description = "Endpoints for product ratings, customer feedback, verified purchase badges, and review moderation")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Submit a product review and rating (Customer only)")
    public ResponseEntity<ReviewDto> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        Long customerId = SecurityUtils.getCurrentUserId();
        String username = SecurityUtils.getCurrentUsername();
        ReviewDto review = reviewService.createReview(request, customerId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update an existing review (Customer only)")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReviewUpdateRequest request) {
        Long customerId = SecurityUtils.getCurrentUserId();
        ReviewDto review = reviewService.updateReview(id, request, customerId);
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Delete a review (Customer owner or Admin moderation)")
    public ResponseEntity<Void> deleteReview(@PathVariable("id") Long id) {
        Long customerId = SecurityUtils.getCurrentUserId();
        UserRole role = SecurityUtils.getCurrentUserRole();
        reviewService.deleteReview(id, customerId, role);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get paginated reviews for a product (Public)")
    public ResponseEntity<Page<ReviewDto>> getProductReviews(
            @PathVariable("productId") Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReviewDto> reviews = reviewService.getProductReviews(productId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productId}/summary")
    @Operation(summary = "Get aggregate review summary and rating metrics for a product (Public)")
    public ResponseEntity<ProductReviewSummaryDto> getProductReviewSummary(@PathVariable("productId") Long productId) {
        ProductReviewSummaryDto summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get all reviews submitted by the authenticated customer")
    public ResponseEntity<Page<ReviewDto>> getMyReviews(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long customerId = SecurityUtils.getCurrentUserId();
        Page<ReviewDto> reviews = reviewService.getCustomerReviews(customerId, pageable);
        return ResponseEntity.ok(reviews);
    }
}
