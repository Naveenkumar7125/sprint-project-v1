package com.eshoppingzone.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class LoggingAndCorrelationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(LoggingAndCorrelationFilter.class);
    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpHeaders headers = exchange.getRequest().getHeaders();
        String correlationId = headers.getFirst(CORRELATION_ID_HEADER);

        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header(CORRELATION_ID_HEADER, correlationId)
                .build();

        ServerWebExchange modifiedExchange = exchange.mutate().request(modifiedRequest).build();

        log.info("Gateway Request: [{}] {} - Correlation ID: [{}]",
                modifiedRequest.getMethod(),
                modifiedRequest.getURI().getPath(),
                correlationId);

        String finalCorrelationId = correlationId;
        modifiedExchange.getResponse().beforeCommit(() -> {
            modifiedExchange.getResponse().getHeaders().add(CORRELATION_ID_HEADER, finalCorrelationId);
            return Mono.empty();
        });

        return chain.filter(modifiedExchange).doFinally(signalType -> {
            log.info("Gateway Response: [{}] {} -> Status: {} - Correlation ID: [{}]",
                    modifiedRequest.getMethod(),
                    modifiedRequest.getURI().getPath(),
                    modifiedExchange.getResponse().getStatusCode(),
                    finalCorrelationId);
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
