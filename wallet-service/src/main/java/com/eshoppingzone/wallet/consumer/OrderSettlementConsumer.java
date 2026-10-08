package com.eshoppingzone.wallet.consumer;

import com.eshoppingzone.wallet.config.RabbitMQConfig;
import com.eshoppingzone.wallet.enums.DeliveryStatus;
import com.eshoppingzone.wallet.event.DeliveryStatusChangedEvent;
import com.eshoppingzone.wallet.event.OrderCancelledEvent;
import com.eshoppingzone.wallet.event.OrderConfirmedEvent;
import com.eshoppingzone.wallet.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderSettlementConsumer {

    private final SettlementService settlementService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_CONFIRMED_QUEUE)
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Received OrderConfirmedEvent for order #{} (ID: {}) with {} item(s)",
                event.getOrderNumber(), event.getOrderId(), event.getItems() != null ? event.getItems().size() : 0);

        if (event.getOrderId() == null) {
            return;
        }

        try {
            settlementService.createSettlementsForOrder(
                    event.getOrderId(),
                    event.getOrderNumber(),
                    event.getItems()
            );
        } catch (Exception e) {
            log.error("Failed to process settlements for confirmed order #{}: {}", event.getOrderNumber(), e.getMessage(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.DELIVERY_STATUS_QUEUE)
    public void handleDeliveryStatusChanged(DeliveryStatusChangedEvent event) {
        log.info("Received DeliveryStatusChangedEvent for order ID: {}, new status: {}",
                event.getOrderId(), event.getNewStatus());

        if (event.getOrderId() == null || event.getNewStatus() == null) {
            return;
        }

        if (event.getNewStatus() == DeliveryStatus.DELIVERED) {
            try {
                settlementService.releaseSettlementsForOrder(event.getOrderId());
            } catch (Exception e) {
                log.error("Failed to release settlements for delivered order ID {}: {}", event.getOrderId(), e.getMessage(), e);
            }
        }
    }

    @RabbitListener(queues = RabbitMQConfig.ORDER_CANCELLED_QUEUE)
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("Received OrderCancelledEvent for order #{} (ID: {}), reason: {}",
                event.getOrderNumber(), event.getOrderId(), event.getCancellationReason());

        if (event.getOrderId() == null) {
            return;
        }

        try {
            settlementService.cancelSettlementsForOrder(event.getOrderId(), event.getCancellationReason());
        } catch (Exception e) {
            log.error("Failed to cancel settlements for order ID {}: {}", event.getOrderId(), e.getMessage(), e);
        }
    }
}
