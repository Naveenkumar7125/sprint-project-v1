package com.eshoppingzone.recommendation.consumer;

import com.eshoppingzone.common.event.OrderConfirmedEvent;
import com.eshoppingzone.recommendation.config.RabbitMQConfig;
import com.eshoppingzone.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderConfirmedConsumer {

    private final RecommendationService recommendationService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_CONFIRMED_QUEUE)
    public void consumeOrderConfirmed(OrderConfirmedEvent event) {
        try {
            log.info("Received OrderConfirmedEvent for orderId: {}, customerId: {}", event.getOrderId(), event.getCustomerId());
            recommendationService.handleOrderConfirmedEvent(event);
        } catch (Exception e) {
            log.error("Error processing OrderConfirmedEvent in recommendation-service: {}", e.getMessage(), e);
        }
    }
}
