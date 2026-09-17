package com.eshoppingzone.cart.service;

import com.eshoppingzone.common.dto.cart.AddToCartRequest;
import com.eshoppingzone.common.dto.cart.CartDto;
import com.eshoppingzone.common.dto.cart.UpdateCartItemRequest;

import java.math.BigDecimal;

public interface CartService {

    CartDto getCart(Long customerId);

    CartDto addItemToCart(Long customerId, AddToCartRequest request);

    CartDto updateItemQuantity(Long customerId, Long productId, UpdateCartItemRequest request);

    CartDto removeItemFromCart(Long customerId, Long productId);

    void clearCart(Long customerId);

    BigDecimal getCartTotal(Long customerId);
}
