package com.eshoppingzone.recommendation.config;

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

    public static final String SEARCH_EVENT_QUEUE = "recommendation.product.searched.queue";
    public static final String SEARCH_EVENT_ROUTING_KEY = "product.searched";

    public static final String ORDER_CONFIRMED_QUEUE = "recommendation.order.confirmed.queue";
    public static final String ORDER_CONFIRMED_ROUTING_KEY = "order.confirmed";

    @Bean
    public TopicExchange recommendationExchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue searchEventQueue() {
        return QueueBuilder.durable(SEARCH_EVENT_QUEUE).build();
    }

    @Bean
    public Binding searchEventBinding(Queue searchEventQueue, TopicExchange recommendationExchange) {
        return BindingBuilder.bind(searchEventQueue).to(recommendationExchange).with(SEARCH_EVENT_ROUTING_KEY);
    }

    @Bean
    public Queue orderConfirmedQueue() {
        return QueueBuilder.durable(ORDER_CONFIRMED_QUEUE).build();
    }

    @Bean
    public Binding orderConfirmedBinding(Queue orderConfirmedQueue, TopicExchange recommendationExchange) {
        return BindingBuilder.bind(orderConfirmedQueue).to(recommendationExchange).with(ORDER_CONFIRMED_ROUTING_KEY);
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
