package com.eshoppingzone.recommendation.controller;

import com.eshoppingzone.common.dto.recommendation.FrequentlyPurchasedTogetherDto;
import com.eshoppingzone.common.dto.recommendation.ProductRecommendationDto;
import com.eshoppingzone.common.dto.recommendation.SearchEventRequest;
import com.eshoppingzone.common.dto.recommendation.UserCategoryPreferenceDto;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.recommendation.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendation Controller", description = "Behavior and statistics-based product recommendations, trending feeds, and search activity analytics")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/most-searched")
    @Operation(summary = "Get most searched products by time window (24H, 7D, 30D, ALL)")
    public ResponseEntity<List<ProductRecommendationDto>> getMostSearched(
            @RequestParam(defaultValue = "7D") String period,
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductRecommendationDto> results = recommendationService.getMostSearchedProducts(period, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/most-purchased")
    @Operation(summary = "Get most purchased / top seller products")
    public ResponseEntity<List<ProductRecommendationDto>> getMostPurchased(
            @RequestParam(defaultValue = "30D") String period,
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductRecommendationDto> results = recommendationService.getMostPurchasedProducts(period, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Get top rated products with minimum review threshold")
    public ResponseEntity<List<ProductRecommendationDto>> getTopRated(
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductRecommendationDto> results = recommendationService.getTopRatedProducts(limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/trending")
    @Operation(summary = "Get trending products based on combined popularity score (Search, Purchase, Rating)")
    public ResponseEntity<List<ProductRecommendationDto>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductRecommendationDto> results = recommendationService.getTrendingProducts(limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/product/{productId}/frequently-purchased")
    @Operation(summary = "Get products frequently purchased together with a given product")
    public ResponseEntity<FrequentlyPurchasedTogetherDto> getFrequentlyPurchasedTogether(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {
        FrequentlyPurchasedTogetherDto results = recommendationService.getFrequentlyPurchasedTogether(productId, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/user/preferences")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get personalized product recommendations based on user's category browsing & purchase habits")
    public ResponseEntity<List<ProductRecommendationDto>> getUserRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<ProductRecommendationDto> results = recommendationService.getUserRecommendations(userId, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/user/category-stats")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get user's top interacted category statistics")
    public ResponseEntity<List<UserCategoryPreferenceDto>> getUserCategoryStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<UserCategoryPreferenceDto> results = recommendationService.getUserCategoryPreferences(userId);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/events/search")
    @Operation(summary = "Record search activity event (Public / Gateway)")
    public ResponseEntity<Void> recordSearchEvent(@Valid @RequestBody SearchEventRequest request) {
        Long userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {}
        recommendationService.recordSearchActivity(request, userId);
        return ResponseEntity.ok().build();
    }
}
