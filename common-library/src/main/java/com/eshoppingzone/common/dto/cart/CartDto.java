package com.eshoppingzone.common.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {
    private Long id;
    private Long customerId;
    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();
    private BigDecimal totalAmount;
    private Integer totalItems;
}
