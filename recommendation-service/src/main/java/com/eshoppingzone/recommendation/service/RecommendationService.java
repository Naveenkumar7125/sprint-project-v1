package com.eshoppingzone.recommendation.service;

import com.eshoppingzone.recommendation.dto.FrequentlyPurchasedTogetherDto;
import com.eshoppingzone.recommendation.dto.ProductRecommendationDto;
import com.eshoppingzone.recommendation.dto.SearchEventRequest;
import com.eshoppingzone.recommendation.dto.UserCategoryPreferenceDto;
import com.eshoppingzone.recommendation.event.OrderConfirmedEvent;
import com.eshoppingzone.recommendation.event.ProductSearchedEvent;

import java.util.List;

public interface RecommendationService {

    List<ProductRecommendationDto> getMostSearchedProducts(String period, int limit);

    List<ProductRecommendationDto> getMostPurchasedProducts(String period, int limit);

    List<ProductRecommendationDto> getTopRatedProducts(int limit);

    List<ProductRecommendationDto> getTrendingProducts(int limit);

    FrequentlyPurchasedTogetherDto getFrequentlyPurchasedTogether(Long productId, int limit);

    List<ProductRecommendationDto> getUserRecommendations(Long userId, int limit);

    List<UserCategoryPreferenceDto> getUserCategoryPreferences(Long userId);

    void recordSearchActivity(SearchEventRequest request, Long userId);

    void handleProductSearchedEvent(ProductSearchedEvent event);

    void handleOrderConfirmedEvent(OrderConfirmedEvent event);
}
