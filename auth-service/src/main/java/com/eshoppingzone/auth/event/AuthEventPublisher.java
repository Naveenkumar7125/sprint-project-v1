package com.eshoppingzone.auth.event;

import com.eshoppingzone.common.event.BaseEvent;
import com.eshoppingzone.common.event.PasswordResetCompletedEvent;
import com.eshoppingzone.common.event.PasswordResetRequestedEvent;
import com.eshoppingzone.common.event.UserRegisteredEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class AuthEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(AuthEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    public AuthEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishUserRegistered(UserRegisteredEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("USER_REGISTERED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.info("Publishing UserRegisteredEvent for userId: {}, role: {}", event.getUserId(), event.getRole());
        rabbitTemplate.convertAndSend(exchange, "auth.user.registered", event);
    }

    public void publishPasswordResetRequested(PasswordResetRequestedEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("PASSWORD_RESET_REQUESTED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        // Do NOT log the raw reset token
        log.info("Publishing PasswordResetRequestedEvent for email: {}", event.getEmail());
        rabbitTemplate.convertAndSend(exchange, "auth.password.reset.requested", event);
    }

    public void publishPasswordResetCompleted(PasswordResetCompletedEvent event) {
        event.setEventId(BaseEvent.generateEventId());
        event.setEventType("PASSWORD_RESET_COMPLETED");
        event.setTimestamp(Instant.now());
        event.setCorrelationId(UUID.randomUUID().toString());

        log.info("Publishing PasswordResetCompletedEvent for email: {}", event.getEmail());
        rabbitTemplate.convertAndSend(exchange, "auth.password.reset.completed", event);
    }
}
