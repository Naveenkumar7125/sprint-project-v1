package com.eshoppingzone.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    public static final String USER_REGISTERED_QUEUE = "notification.user.registered.queue";
    public static final String PASSWORD_RESET_QUEUE = "notification.password.reset.queue";
    public static final String ORDER_QUEUE = "notification.order.queue";
    public static final String PAYMENT_QUEUE = "notification.payment.queue";
    public static final String REFUND_QUEUE = "notification.refund.queue";
    public static final String DELIVERY_QUEUE = "notification.delivery.queue";
    public static final String INVENTORY_QUEUE = "notification.inventory.queue";

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return QueueBuilder.durable(USER_REGISTERED_QUEUE).build();
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(notificationExchange).with("auth.user.registered");
    }

    @Bean
    public Queue passwordResetQueue() {
        return QueueBuilder.durable(PASSWORD_RESET_QUEUE).build();
    }

    @Bean
    public Binding passwordResetBinding(Queue passwordResetQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(passwordResetQueue).to(notificationExchange).with("auth.password.reset.#");
    }

    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE).build();
    }

    @Bean
    public Binding orderBinding(Queue orderQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(orderQueue).to(notificationExchange).with("order.#");
    }

    @Bean
    public Queue paymentQueue() {
        return QueueBuilder.durable(PAYMENT_QUEUE).build();
    }

    @Bean
    public Binding paymentBinding(Queue paymentQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(paymentQueue).to(notificationExchange).with("payment.success");
    }

    @Bean
    public Queue refundQueue() {
        return QueueBuilder.durable(REFUND_QUEUE).build();
    }

    @Bean
    public Binding refundBinding(Queue refundQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(refundQueue).to(notificationExchange).with("payment.refund.#");
    }

    @Bean
    public Queue deliveryQueue() {
        return QueueBuilder.durable(DELIVERY_QUEUE).build();
    }

    @Bean
    public Binding deliveryBinding(Queue deliveryQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(deliveryQueue).to(notificationExchange).with("delivery.status.#");
    }

    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable(INVENTORY_QUEUE).build();
    }

    @Bean
    public Binding inventoryBinding(Queue inventoryQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(inventoryQueue).to(notificationExchange).with("inventory.low.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
