package com.eshoppingzone.recommendation.service.impl;

import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.dto.recommendation.FrequentlyPurchasedTogetherDto;
import com.eshoppingzone.common.dto.recommendation.ProductRecommendationDto;
import com.eshoppingzone.common.dto.recommendation.SearchEventRequest;
import com.eshoppingzone.common.dto.recommendation.UserCategoryPreferenceDto;
import com.eshoppingzone.common.dto.review.ProductReviewSummaryDto;
import com.eshoppingzone.common.event.OrderConfirmedEvent;
import com.eshoppingzone.common.event.ProductSearchedEvent;
import com.eshoppingzone.recommendation.client.ProductClient;
import com.eshoppingzone.recommendation.client.ReviewClient;
import com.eshoppingzone.recommendation.entity.ProductPairAssociation;
import com.eshoppingzone.recommendation.entity.ProductStatistics;
import com.eshoppingzone.recommendation.entity.SearchActivity;
import com.eshoppingzone.recommendation.entity.UserCategoryPreference;
import com.eshoppingzone.recommendation.repository.ProductPairAssociationRepository;
import com.eshoppingzone.recommendation.repository.ProductStatisticsRepository;
import com.eshoppingzone.recommendation.repository.SearchActivityRepository;
import com.eshoppingzone.recommendation.repository.UserCategoryPreferenceRepository;
import com.eshoppingzone.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationServiceImpl implements RecommendationService {

    private final ProductStatisticsRepository productStatisticsRepository;
    private final SearchActivityRepository searchActivityRepository;
    private final ProductPairAssociationRepository productPairAssociationRepository;
    private final UserCategoryPreferenceRepository userCategoryPreferenceRepository;
    private final ProductClient productClient;
    private final ReviewClient reviewClient;

    @Value("${recommendation.search-weight:1.0}")
    private double searchWeight;

    @Value("${recommendation.purchase-weight:5.0}")
    private double purchaseWeight;

    @Value("${recommendation.rating-weight:10.0}")
    private double ratingWeight;

    @Value("${recommendation.minimum-search-threshold:1}")
    private long minimumSearchThreshold;

    @Value("${recommendation.minimum-rating-count:1}")
    private long minimumRatingCount;

    @Override
    @Transactional(readOnly = true)
    public List<ProductRecommendationDto> getMostSearchedProducts(String period, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<ProductRecommendationDto> recommendations = new ArrayList<>();

        if (period != null && !period.equalsIgnoreCase("ALL")) {
            Instant since = calculateSinceTimestamp(period);
            List<Object[]> results = searchActivityRepository.findMostSearchedSince(since, minimumSearchThreshold, pageable);
            for (Object[] row : results) {
                Long productId = (Long) row[0];
                Long count = (Long) row[1];
                ProductDto product = fetchProductDetails(productId);
                if (product != null) {
                    ProductStatistics stat = getOrCreateStat(productId);
                    recommendations.add(buildRecommendationDto(product, stat, "Most Searched in " + period.toUpperCase() + " (" + count + " searches)"));
                }
            }
        }

        if (recommendations.isEmpty()) {
            List<ProductStatistics> stats = productStatisticsRepository.findMostSearched(minimumSearchThreshold, pageable);
            for (ProductStatistics stat : stats) {
                ProductDto product = fetchProductDetails(stat.getProductId());
                if (product != null) {
                    recommendations.add(buildRecommendationDto(product, stat, "Most Searched (" + stat.getSearchCount() + " lifetime searches)"));
                }
            }
        }

        return recommendations;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRecommendationDto> getMostPurchasedProducts(String period, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<ProductStatistics> stats = productStatisticsRepository.findMostPurchased(pageable);
        List<ProductRecommendationDto> recommendations = new ArrayList<>();

        for (ProductStatistics stat : stats) {
            ProductDto product = fetchProductDetails(stat.getProductId());
            if (product != null) {
                recommendations.add(buildRecommendationDto(product, stat, "Top Seller (" + stat.getPurchaseCount() + " purchases)"));
            }
        }
        return recommendations;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRecommendationDto> getTopRatedProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<ProductStatistics> stats = productStatisticsRepository.findTopRated(minimumRatingCount, pageable);
        List<ProductRecommendationDto> recommendations = new ArrayList<>();

        for (ProductStatistics stat : stats) {
            ProductDto product = fetchProductDetails(stat.getProductId());
            if (product != null) {
                recommendations.add(buildRecommendationDto(product, stat, String.format("Top Rated (★ %.1f / %d reviews)", stat.getAverageRating(), stat.getRatingCount())));
            }
        }
        return recommendations;
    }

    @Override
    @Transactional
    public List<ProductRecommendationDto> getTrendingProducts(int limit) {
        recalculatePopularityScores();
        Pageable pageable = PageRequest.of(0, limit);
        List<ProductStatistics> stats = productStatisticsRepository.findTrending(pageable);
        List<ProductRecommendationDto> recommendations = new ArrayList<>();

        for (ProductStatistics stat : stats) {
            ProductDto product = fetchProductDetails(stat.getProductId());
            if (product != null) {
                recommendations.add(buildRecommendationDto(product, stat, String.format("Trending Popularity Score: %.1f", stat.getPopularityScore())));
            }
        }
        return recommendations;
    }

    @Override
    @Transactional(readOnly = true)
    public FrequentlyPurchasedTogetherDto getFrequentlyPurchasedTogether(Long productId, int limit) {
        ProductDto primaryProduct = fetchProductDetails(productId);
        String primaryName = primaryProduct != null ? primaryProduct.getName() : "Product #" + productId;

        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> associations = productPairAssociationRepository.findFrequentlyPurchasedTogether(productId, pageable);

        List<FrequentlyPurchasedTogetherDto.RecommendedItem> items = new ArrayList<>();
        for (Object[] row : associations) {
            Long associatedId = (Long) row[0];
            Long count = (Long) row[1];
            ProductDto associatedProduct = fetchProductDetails(associatedId);
            if (associatedProduct != null) {
                ProductStatistics stat = getOrCreateStat(associatedId);
                items.add(FrequentlyPurchasedTogetherDto.RecommendedItem.builder()
                        .productId(associatedProduct.getId())
                        .name(associatedProduct.getName())
                        .price(associatedProduct.getPrice())
                        .imageUrl(associatedProduct.getImageUrl())
                        .categoryName(associatedProduct.getCategoryName())
                        .coPurchaseFrequency(count)
                        .averageRating(stat.getAverageRating())
                        .build());
            }
        }

        return FrequentlyPurchasedTogetherDto.builder()
                .primaryProductId(productId)
                .primaryProductName(primaryName)
                .frequentlyPurchasedItems(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRecommendationDto> getUserRecommendations(Long userId, int limit) {
        List<UserCategoryPreference> preferences = userCategoryPreferenceRepository.findByUserIdOrderByInteractionCountDesc(userId, PageRequest.of(0, 3));
        if (preferences.isEmpty()) {
            return getTrendingProducts(limit);
        }

        List<ProductRecommendationDto> recommendations = new ArrayList<>();
        int perCategoryLimit = Math.max(1, limit / preferences.size());

        for (UserCategoryPreference pref : preferences) {
            try {
                List<ProductStatistics> topStats = productStatisticsRepository.findTrending(PageRequest.of(0, perCategoryLimit * 3));
                for (ProductStatistics stat : topStats) {
                    if (recommendations.size() >= limit) break;
                    ProductDto product = fetchProductDetails(stat.getProductId());
                    if (product != null && pref.getCategoryName().equalsIgnoreCase(product.getCategoryName())) {
                        boolean alreadyAdded = recommendations.stream().anyMatch(r -> r.getProductId().equals(product.getId()));
                        if (!alreadyAdded) {
                            recommendations.add(buildRecommendationDto(product, stat, "Recommended for you based on interest in " + pref.getCategoryName()));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error fetching user category recommendations for category {}: {}", pref.getCategoryName(), e.getMessage());
            }
        }

        if (recommendations.size() < limit) {
            List<ProductRecommendationDto> trending = getTrendingProducts(limit - recommendations.size());
            for (ProductRecommendationDto trend : trending) {
                if (recommendations.size() >= limit) break;
                if (recommendations.stream().noneMatch(r -> r.getProductId().equals(trend.getProductId()))) {
                    recommendations.add(trend);
                }
            }
        }

        return recommendations;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserCategoryPreferenceDto> getUserCategoryPreferences(Long userId) {
        return userCategoryPreferenceRepository.findByUserIdOrderByInteractionCountDesc(userId, PageRequest.of(0, 10))
                .stream()
                .map(p -> UserCategoryPreferenceDto.builder()
                        .categoryId(p.getCategoryId())
                        .categoryName(p.getCategoryName())
                        .interactionCount(p.getInteractionCount())
                        .lastInteractionAt(p.getLastInteractionAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void recordSearchActivity(SearchEventRequest request, Long userId) {
        if (request.getMatchedProductIds() != null && !request.getMatchedProductIds().isEmpty()) {
            for (Long productId : request.getMatchedProductIds()) {
                SearchActivity activity = SearchActivity.builder()
                        .productId(productId)
                        .keyword(request.getQuery())
                        .categoryId(request.getCategoryId())
                        .categoryName(request.getCategoryName())
                        .userId(userId)
                        .searchedAt(Instant.now())
                        .build();
                searchActivityRepository.save(activity);

                ProductStatistics stat = getOrCreateStat(productId);
                stat.setSearchCount(stat.getSearchCount() + 1);
                productStatisticsRepository.save(stat);
            }
        } else {
            SearchActivity activity = SearchActivity.builder()
                    .keyword(request.getQuery())
                    .categoryId(request.getCategoryId())
                    .categoryName(request.getCategoryName())
                    .userId(userId)
                    .searchedAt(Instant.now())
                    .build();
            searchActivityRepository.save(activity);
        }

        if (userId != null && request.getCategoryName() != null && !request.getCategoryName().isBlank()) {
            recordUserCategoryInteraction(userId, request.getCategoryId(), request.getCategoryName());
        }
    }

    @Override
    @Transactional
    public void handleProductSearchedEvent(ProductSearchedEvent event) {
        if (event == null || event.getQuery() == null) return;
        SearchEventRequest request = SearchEventRequest.builder()
                .query(event.getQuery())
                .categoryName(event.getCategoryName())
                .matchedProductIds(event.getMatchedProductIds())
                .build();
        recordSearchActivity(request, event.getUserId());
        log.info("Processed ProductSearchedEvent for keyword: {}", event.getQuery());
    }

    @Override
    @Transactional
    public void handleOrderConfirmedEvent(OrderConfirmedEvent event) {
        if (event == null || event.getOrderId() == null) return;
        log.info("Processing OrderConfirmedEvent for orderId: {}", event.getOrderId());

        // Update purchase statistics for products
        // When order items are known:
        // Also update co-purchase associations
        // If rating updates are needed, query review-service
    }

    @Transactional
    public void recordProductPurchase(Long productId, int quantity, Long userId, Long categoryId, String categoryName) {
        ProductStatistics stat = getOrCreateStat(productId);
        stat.setPurchaseCount(stat.getPurchaseCount() + quantity);
        productStatisticsRepository.save(stat);

        if (userId != null && categoryName != null) {
            recordUserCategoryInteraction(userId, categoryId, categoryName);
        }
    }

    @Transactional
    public void recordProductPairAssociation(Long prodA, Long prodB) {
        if (prodA == null || prodB == null || prodA.equals(prodB)) return;
        Long minId = Math.min(prodA, prodB);
        Long maxId = Math.max(prodA, prodB);

        ProductPairAssociation association = productPairAssociationRepository.findByProductIdAAndProductIdB(minId, maxId)
                .orElse(ProductPairAssociation.builder()
                        .productIdA(minId)
                        .productIdB(maxId)
                        .coPurchaseCount(0L)
                        .build());

        association.setCoPurchaseCount(association.getCoPurchaseCount() + 1);
        productPairAssociationRepository.save(association);
    }

    private void recordUserCategoryInteraction(Long userId, Long categoryId, String categoryName) {
        UserCategoryPreference pref = userCategoryPreferenceRepository.findByUserIdAndCategoryName(userId, categoryName)
                .orElse(UserCategoryPreference.builder()
                        .userId(userId)
                        .categoryId(categoryId)
                        .categoryName(categoryName)
                        .interactionCount(0L)
                        .build());

        pref.setInteractionCount(pref.getInteractionCount() + 1);
        userCategoryPreferenceRepository.save(pref);
    }

    private ProductStatistics getOrCreateStat(Long productId) {
        return productStatisticsRepository.findByProductId(productId)
                .orElseGet(() -> {
                    ProductStatistics stat = ProductStatistics.builder()
                            .productId(productId)
                            .searchCount(0L)
                            .purchaseCount(0L)
                            .averageRating(0.0)
                            .ratingCount(0L)
                            .popularityScore(0.0)
                            .build();
                    // Try to sync initial rating metrics from review service
                    try {
                        ProductReviewSummaryDto summary = reviewClient.getProductReviewSummary(productId);
                        if (summary != null) {
                            if (summary.getAverageRating() != null) stat.setAverageRating(summary.getAverageRating());
                            if (summary.getTotalReviews() != null) stat.setRatingCount(summary.getTotalReviews());
                        }
                    } catch (Exception e) {
                        log.debug("Review service not available for product {}: {}", productId, e.getMessage());
                    }
                    return productStatisticsRepository.save(stat);
                });
    }

    private void recalculatePopularityScores() {
        List<ProductStatistics> allStats = productStatisticsRepository.findAll();
        for (ProductStatistics stat : allStats) {
            // Update review metrics if available
            try {
                ProductReviewSummaryDto summary = reviewClient.getProductReviewSummary(stat.getProductId());
                if (summary != null) {
                    if (summary.getAverageRating() != null) stat.setAverageRating(summary.getAverageRating());
                    if (summary.getTotalReviews() != null) stat.setRatingCount(summary.getTotalReviews());
                }
            } catch (Exception ignored) {}

            double score = (stat.getSearchCount() * searchWeight) +
                           (stat.getPurchaseCount() * purchaseWeight) +
                           (stat.getAverageRating() * stat.getRatingCount() * ratingWeight);
            stat.setPopularityScore(score);
            stat.setLastCalculatedAt(Instant.now());
            productStatisticsRepository.save(stat);
        }
    }

    private ProductDto fetchProductDetails(Long productId) {
        try {
            return productClient.getProductById(productId);
        } catch (Exception e) {
            log.warn("Failed to fetch product details from product-service for id {}: {}", productId, e.getMessage());
            return null;
        }
    }

    private ProductRecommendationDto buildRecommendationDto(ProductDto product, ProductStatistics stat, String reason) {
        return ProductRecommendationDto.builder()
                .productId(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .categoryName(product.getCategoryName())
                .merchantId(product.getMerchantId())
                .searchCount(stat != null ? stat.getSearchCount() : 0L)
                .purchaseCount(stat != null ? stat.getPurchaseCount() : 0L)
                .averageRating(stat != null ? stat.getAverageRating() : 0.0)
                .ratingCount(stat != null ? stat.getRatingCount() : 0L)
                .popularityScore(stat != null ? stat.getPopularityScore() : 0.0)
                .recommendationReason(reason)
                .specifications(product.getSpecifications())
                .build();
    }

    private Instant calculateSinceTimestamp(String period) {
        Instant now = Instant.now();
        switch (period.toUpperCase()) {
            case "24H":
                return now.minus(Duration.ofHours(24));
            case "7D":
                return now.minus(Duration.ofDays(7));
            case "30D":
                return now.minus(Duration.ofDays(30));
            default:
                return now.minus(Duration.ofDays(7));
        }
    }
}
