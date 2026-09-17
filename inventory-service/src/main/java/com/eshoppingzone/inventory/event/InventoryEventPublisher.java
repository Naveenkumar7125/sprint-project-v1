package com.eshoppingzone.inventory.event;

import com.eshoppingzone.common.event.BaseEvent;
import com.eshoppingzone.common.event.LowStockEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class InventoryEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    public InventoryEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishLowStock(Long productId, Integer availableStock, Integer threshold) {
        LowStockEvent event = LowStockEvent.builder()
                .eventId(BaseEvent.generateEventId())
                .eventType("LOW_STOCK")
                .timestamp(Instant.now())
                .correlationId(UUID.randomUUID().toString())
                .productId(productId)
                .availableStock(availableStock)
                .threshold(threshold)
                .build();

        log.warn("Publishing LowStockEvent for productId: {}, availableStock: {}, threshold: {}", productId, availableStock, threshold);
        rabbitTemplate.convertAndSend(exchange, "inventory.low.stock", event);
    }
}
