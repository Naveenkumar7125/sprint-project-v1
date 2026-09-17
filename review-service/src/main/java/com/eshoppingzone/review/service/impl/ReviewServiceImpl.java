package com.eshoppingzone.review.service.impl;

import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import com.eshoppingzone.common.dto.review.ReviewCreateRequest;
import com.eshoppingzone.common.dto.review.ReviewDto;
import com.eshoppingzone.common.dto.review.ReviewUpdateRequest;
import com.eshoppingzone.common.enums.OrderStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.review.client.OrderClient;
import com.eshoppingzone.review.entity.Review;
import com.eshoppingzone.review.repository.ReviewRepository;
import com.eshoppingzone.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderClient orderClient;

    @Override
    @Transactional
    public ReviewDto createReview(ReviewCreateRequest request, Long customerId, String username) {
        log.info("Creating review for product ID {} by customer ID {}", request.getProductId(), customerId);

        if (reviewRepository.findByProductIdAndCustomerId(request.getProductId(), customerId).isPresent()) {
            throw new BadRequestException("You have already reviewed this product.");
        }

        // Verify purchase via OrderClient
        boolean isVerifiedPurchase = false;
        try {
            Page<OrderDto> orders = orderClient.getMyOrders(0, 50);
            if (orders != null && orders.getContent() != null) {
                isVerifiedPurchase = orders.getContent().stream()
                        .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                        .anyMatch(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> i.getProductId().equals(request.getProductId())));
            }
        } catch (Exception e) {
            log.warn("Could not verify purchase against order-service: {}", e.getMessage());
        }

        Review review = Review.builder()
                .productId(request.getProductId())
                .customerId(customerId)
                .customerUsername(username)
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerifiedPurchase(isVerifiedPurchase)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review created successfully with ID {}", saved.getId());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public ReviewDto updateReview(Long reviewId, ReviewUpdateRequest request, Long customerId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getCustomerId().equals(customerId)) {
            throw new ForbiddenException("You can only edit your own reviews.");
        }

        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }
        if (request.getTitle() != null) {
            review.setTitle(request.getTitle());
        }
        if (request.getComment() != null) {
            review.setComment(request.getComment());
        }

        Review updated = reviewRepository.save(review);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long customerId, UserRole userRole) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        boolean isAdmin = userRole == UserRole.ADMIN;
        if (!isAdmin && !review.getCustomerId().equals(customerId)) {
            throw new ForbiddenException("You are not authorized to delete this review.");
        }

        reviewRepository.delete(review);
        log.info("Review ID {} deleted by user ID {} (Role: {})", reviewId, customerId, userRole);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDto> getCustomerReviews(Long customerId, Pageable pageable) {
        return reviewRepository.findByCustomerId(customerId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductReviewSummaryDto getProductReviewSummary(Long productId) {
        Double avgRating = reviewRepository.calculateAverageRatingByProductId(productId);
        Long totalReviews = reviewRepository.countByProductId(productId);
        List<ReviewDto> recentReviews = reviewRepository.findTop5ByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        Double formattedAvg = avgRating != null ?
                BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0;

        return ProductReviewSummaryDto.builder()
                .productId(productId)
                .averageRating(formattedAvg)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .recentReviews(recentReviews)
                .build();
    }

    private ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .customerId(review.getCustomerId())
                .customerUsername(review.getCustomerUsername())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
