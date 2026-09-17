package com.eshoppingzone.order.config;

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

    public static final String DELIVERY_STATUS_QUEUE = "order.delivery.status.queue";
    public static final String DELIVERY_STATUS_ROUTING_KEY = "delivery.status.changed";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue deliveryStatusQueue() {
        return QueueBuilder.durable(DELIVERY_STATUS_QUEUE).build();
    }

    @Bean
    public Binding deliveryStatusBinding(Queue deliveryStatusQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(deliveryStatusQueue).to(orderExchange).with(DELIVERY_STATUS_ROUTING_KEY);
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
