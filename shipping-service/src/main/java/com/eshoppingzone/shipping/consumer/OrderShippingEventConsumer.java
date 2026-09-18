package com.eshoppingzone.shipping.consumer;

import com.eshoppingzone.common.event.OrderConfirmedEvent;
import com.eshoppingzone.common.event.PaymentSuccessEvent;
import com.eshoppingzone.shipping.config.RabbitMQConfig;
import com.eshoppingzone.shipping.service.ShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderShippingEventConsumer {

    private final ShippingService shippingService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_CONFIRMED_QUEUE)
    public void consumeOrderConfirmed(OrderConfirmedEvent event) {
        try {
            log.info("Shipping service received OrderConfirmedEvent for orderId: {}", event.getOrderId());
            shippingService.processOrderShipmentsById(event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to auto-create shipments on OrderConfirmedEvent: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_SUCCESS_QUEUE)
    public void consumePaymentSuccess(PaymentSuccessEvent event) {
        try {
            log.info("Shipping service received PaymentSuccessEvent for orderId: {}", event.getOrderId());
            shippingService.processOrderShipmentsById(event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to process shipments on PaymentSuccessEvent: {}", e.getMessage(), e);
        }
    }
}
