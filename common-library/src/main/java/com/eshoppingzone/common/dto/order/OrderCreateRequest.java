package com.eshoppingzone.common.dto.order;

import com.eshoppingzone.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Shipping address ID is required")
    private Long shippingAddressId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}
