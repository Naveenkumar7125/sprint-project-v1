package com.eshoppingzone.common.event;

import com.eshoppingzone.common.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderCreatedEvent extends BaseEvent {
    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private String customerEmail;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private List<OrderItemSummary> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemSummary {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
