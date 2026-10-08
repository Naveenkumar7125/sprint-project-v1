package com.eshoppingzone.wallet.config;

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
    private String exchangeName;

    public static final String ORDER_CONFIRMED_QUEUE = "wallet.order.confirmed.queue";
    public static final String ORDER_CONFIRMED_ROUTING_KEY = "order.confirmed";

    public static final String DELIVERY_STATUS_QUEUE = "wallet.delivery.status.queue";
    public static final String DELIVERY_STATUS_ROUTING_KEY = "delivery.status.changed";

    public static final String ORDER_CANCELLED_QUEUE = "wallet.order.cancelled.queue";
    public static final String ORDER_CANCELLED_ROUTING_KEY = "order.cancelled";

    public static final String REFUND_COMPLETED_ROUTING_KEY = "refund.completed";

    @Bean
    public TopicExchange eshoppingZoneExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue orderConfirmedQueue() {
        return QueueBuilder.durable(ORDER_CONFIRMED_QUEUE).build();
    }

    @Bean
    public Binding orderConfirmedBinding(Queue orderConfirmedQueue, TopicExchange eshoppingZoneExchange) {
        return BindingBuilder.bind(orderConfirmedQueue).to(eshoppingZoneExchange).with(ORDER_CONFIRMED_ROUTING_KEY);
    }

    @Bean
    public Queue deliveryStatusQueue() {
        return QueueBuilder.durable(DELIVERY_STATUS_QUEUE).build();
    }

    @Bean
    public Binding deliveryStatusBinding(Queue deliveryStatusQueue, TopicExchange eshoppingZoneExchange) {
        return BindingBuilder.bind(deliveryStatusQueue).to(eshoppingZoneExchange).with(DELIVERY_STATUS_ROUTING_KEY);
    }

    @Bean
    public Queue orderCancelledQueue() {
        return QueueBuilder.durable(ORDER_CANCELLED_QUEUE).build();
    }

    @Bean
    public Binding orderCancelledBinding(Queue orderCancelledQueue, TopicExchange eshoppingZoneExchange) {
        return BindingBuilder.bind(orderCancelledQueue).to(eshoppingZoneExchange).with(ORDER_CANCELLED_ROUTING_KEY);
    }

    @Bean
    public Binding refundCompletedBinding(Queue orderCancelledQueue, TopicExchange eshoppingZoneExchange) {
        return BindingBuilder.bind(orderCancelledQueue).to(eshoppingZoneExchange).with(REFUND_COMPLETED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        converter.setAlwaysConvertToInferredType(true);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
