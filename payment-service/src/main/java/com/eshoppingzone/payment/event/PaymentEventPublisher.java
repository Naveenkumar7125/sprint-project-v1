package com.eshoppingzone.payment.event;

import com.eshoppingzone.common.event.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class PaymentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    public PaymentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishPaymentInitiated(PaymentInitiatedEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("PAYMENT_INITIATED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.info("Publishing PaymentInitiatedEvent for orderId: {}, paymentRef: {}", event.getOrderId(), event.getPaymentReference());
        rabbitTemplate.convertAndSend(exchange, "payment.initiated", event);
    }

    public void publishPaymentSuccess(PaymentSuccessEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("PAYMENT_SUCCESS");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.info("Publishing PaymentSuccessEvent for orderId: {}, paymentRef: {}", event.getOrderId(), event.getPaymentReference());
        rabbitTemplate.convertAndSend(exchange, "payment.success", event);
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("PAYMENT_FAILED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.warn("Publishing PaymentFailedEvent for orderId: {}, reason: {}", event.getOrderId(), event.getFailureReason());
        rabbitTemplate.convertAndSend(exchange, "payment.failed", event);
    }

    public void publishRefundCompleted(RefundCompletedEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("REFUND_COMPLETED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.info("Publishing RefundCompletedEvent for orderId: {}, refundRef: {}", event.getOrderId(), event.getRefundReference());
        rabbitTemplate.convertAndSend(exchange, "payment.refund.completed", event);
    }
}
