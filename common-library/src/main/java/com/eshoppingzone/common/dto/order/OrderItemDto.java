package com.eshoppingzone.common.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Long merchantId;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
}
