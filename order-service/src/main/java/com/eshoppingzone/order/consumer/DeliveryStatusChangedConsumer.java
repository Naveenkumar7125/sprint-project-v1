package com.eshoppingzone.order.consumer;

import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.common.enums.OrderStatus;
import com.eshoppingzone.common.event.DeliveryStatusChangedEvent;
import com.eshoppingzone.order.config.RabbitMQConfig;
import com.eshoppingzone.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryStatusChangedConsumer {

    private final OrderService orderService;

    @RabbitListener(queues = RabbitMQConfig.DELIVERY_STATUS_QUEUE)
    public void handleDeliveryStatusChanged(DeliveryStatusChangedEvent event) {
        log.info("Received DeliveryStatusChangedEvent for order ID: {} with new status: {}",
                event.getOrderId(), event.getNewStatus());

        if (event.getOrderId() == null || event.getNewStatus() == null) {
            return;
        }

        if (event.getNewStatus() == DeliveryStatus.DELIVERED) {
            orderService.updateOrderStatusFromDelivery(event.getOrderId(), OrderStatus.DELIVERED);
        } else if (event.getNewStatus() == DeliveryStatus.PICKED_UP || event.getNewStatus() == DeliveryStatus.OUT_FOR_DELIVERY) {
            orderService.updateOrderStatusFromDelivery(event.getOrderId(), OrderStatus.SHIPPED);
        } else if (event.getNewStatus() == DeliveryStatus.FAILED) {
            orderService.updateOrderStatusFromDelivery(event.getOrderId(), OrderStatus.CANCELLED);
        }
    }
}
