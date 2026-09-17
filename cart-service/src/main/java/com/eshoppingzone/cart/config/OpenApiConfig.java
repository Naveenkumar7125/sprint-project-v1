package com.eshoppingzone.cart.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(
        name = "BearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI cartServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EShopping Zone — Cart Service API")
                        .description("Shopping Cart, Cart Items, and Calculation Operations")
                        .version("1.0.0")
                        .contact(new Contact().name("EShopping Zone Engineering")));
    }
}
