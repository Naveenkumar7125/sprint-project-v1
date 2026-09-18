package com.eshoppingzone.recommendation.consumer;

import com.eshoppingzone.common.event.ProductSearchedEvent;
import com.eshoppingzone.recommendation.config.RabbitMQConfig;
import com.eshoppingzone.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductSearchedConsumer {

    private final RecommendationService recommendationService;

    @RabbitListener(queues = RabbitMQConfig.SEARCH_EVENT_QUEUE)
    public void consumeProductSearched(ProductSearchedEvent event) {
        try {
            log.info("Received ProductSearchedEvent for query: '{}', userId: {}", event.getQuery(), event.getUserId());
            recommendationService.handleProductSearchedEvent(event);
        } catch (Exception e) {
            log.error("Error processing ProductSearchedEvent: {}", e.getMessage(), e);
        }
    }
}
