package com.eshoppingzone.review.dto;

import com.eshoppingzone.review.enums.OrderStatus;
import com.eshoppingzone.review.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerUsername;
    private String customerEmail;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private Long shippingAddressId;
    private String shippingAddressSnapshot;
    private String cancellationReason;
    @Builder.Default
    private List<OrderItemDto> items = new ArrayList<>();
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
