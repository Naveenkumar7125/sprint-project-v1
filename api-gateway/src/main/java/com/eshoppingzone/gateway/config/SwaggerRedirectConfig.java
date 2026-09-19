package com.eshoppingzone.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import java.net.URI;

@Configuration
public class SwaggerRedirectConfig {

    @Bean
    public RouterFunction<ServerResponse> swaggerRedirectRoutes() {
        return RouterFunctions
                .route(RequestPredicates.GET("/swagger-ui/index.html"),
                        req -> ServerResponse.temporaryRedirect(URI.create("/swagger-ui.html")).build())
                .andRoute(RequestPredicates.GET("/swagger-ui"),
                        req -> ServerResponse.temporaryRedirect(URI.create("/swagger-ui.html")).build())
                .andRoute(RequestPredicates.GET("/swagger-ui/"),
                        req -> ServerResponse.temporaryRedirect(URI.create("/swagger-ui.html")).build())
                .andRoute(RequestPredicates.GET("/swagger"),
                        req -> ServerResponse.temporaryRedirect(URI.create("/swagger-ui.html")).build())
                .andRoute(RequestPredicates.GET("/docs"),
                        req -> ServerResponse.temporaryRedirect(URI.create("/swagger-ui.html")).build());
    }
}
