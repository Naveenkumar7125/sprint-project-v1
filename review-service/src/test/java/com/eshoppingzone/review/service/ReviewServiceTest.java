package com.eshoppingzone.review.service;

import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.order.OrderItemDto;
import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import com.eshoppingzone.common.dto.review.ReviewCreateRequest;
import com.eshoppingzone.common.dto.review.ReviewDto;
import com.eshoppingzone.common.dto.review.ReviewUpdateRequest;
import com.eshoppingzone.common.enums.OrderStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
import com.eshoppingzone.review.client.OrderClient;
import com.eshoppingzone.review.entity.Review;
import com.eshoppingzone.review.repository.ReviewRepository;
import com.eshoppingzone.review.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @Test
    @DisplayName("Create Review - Verified Purchase - Success")
    void testCreateReview_VerifiedPurchase_Success() {
        ReviewCreateRequest request = ReviewCreateRequest.builder()
                .productId(10L)
                .rating(5)
                .title("Great!")
                .comment("Loved this item")
                .build();

        OrderDto deliveredOrder = OrderDto.builder()
                .id(1L)
                .status(OrderStatus.DELIVERED)
                .items(List.of(OrderItemDto.builder().productId(10L).build()))
                .build();

        when(reviewRepository.findByProductIdAndCustomerId(10L, 3L)).thenReturn(Optional.empty());
        when(orderClient.getMyOrders(0, 50)).thenReturn(new PageImpl<>(List.of(deliveredOrder)));

        Review saved = Review.builder()
                .id(1L)
                .productId(10L)
                .customerId(3L)
                .customerUsername("customer1")
                .rating(5)
                .title("Great!")
                .comment("Loved this item")
                .isVerifiedPurchase(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(reviewRepository.save(any(Review.class))).thenReturn(saved);

        ReviewDto result = reviewService.createReview(request, 3L, "customer1");

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertEquals("customer1", result.getCustomerUsername());
    }

    @Test
    @DisplayName("Create Review - Duplicate Review - Throws BadRequestException")
    void testCreateReview_Duplicate_ThrowsBadRequest() {
        ReviewCreateRequest request = ReviewCreateRequest.builder()
                .productId(10L)
                .rating(5)
                .title("Great!")
                .comment("Loved this item")
                .build();

        Review existing = Review.builder().id(1L).productId(10L).customerId(3L).build();
        when(reviewRepository.findByProductIdAndCustomerId(10L, 3L)).thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () -> reviewService.createReview(request, 3L, "customer1"));
    }

    @Test
    @DisplayName("Update Review - Owner - Success")
    void testUpdateReview_Success() {
        Review existing = Review.builder()
                .id(1L)
                .productId(10L)
                .customerId(3L)
                .rating(4)
                .title("Good")
                .comment("Pretty good")
                .build();

        ReviewUpdateRequest updateReq = ReviewUpdateRequest.builder()
                .rating(5)
                .title("Excellent")
                .comment("Much better after update")
                .build();

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(reviewRepository.save(any(Review.class))).thenReturn(existing);

        ReviewDto result = reviewService.updateReview(1L, updateReq, 3L);

        assertNotNull(result);
        assertEquals(5, existing.getRating());
        assertEquals("Excellent", existing.getTitle());
    }

    @Test
    @DisplayName("Delete Review - Customer Owner - Success")
    void testDeleteReview_Owner_Success() {
        Review existing = Review.builder()
                .id(1L)
                .customerId(3L)
                .build();

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertDoesNotThrow(() -> reviewService.deleteReview(1L, 3L, UserRole.CUSTOMER));
        verify(reviewRepository, times(1)).delete(existing);
    }

    @Test
    @DisplayName("Delete Review - Admin Moderation - Success")
    void testDeleteReview_Admin_Success() {
        Review existing = Review.builder()
                .id(1L)
                .customerId(3L)
                .build();

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertDoesNotThrow(() -> reviewService.deleteReview(1L, 1L, UserRole.ADMIN));
        verify(reviewRepository, times(1)).delete(existing);
    }

    @Test
    @DisplayName("Delete Review - Other Customer - Throws ForbiddenException")
    void testDeleteReview_OtherCustomer_Forbidden() {
        Review existing = Review.builder()
                .id(1L)
                .customerId(3L)
                .build();

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () -> reviewService.deleteReview(1L, 999L, UserRole.CUSTOMER));
    }

    @Test
    @DisplayName("Get Product Review Summary - Metrics Calculation")
    void testGetProductReviewSummary() {
        when(reviewRepository.calculateAverageRatingByProductId(10L)).thenReturn(4.6666);
        when(reviewRepository.countByProductId(10L)).thenReturn(15L);
        when(reviewRepository.findTop5ByProductIdOrderByCreatedAtDesc(10L)).thenReturn(List.of());

        ProductReviewSummaryDto summary = reviewService.getProductReviewSummary(10L);

        assertNotNull(summary);
        assertEquals(4.7, summary.getAverageRating());
        assertEquals(15L, summary.getTotalReviews());
    }
}
