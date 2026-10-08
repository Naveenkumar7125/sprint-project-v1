package com.eshoppingzone.cart.service;

import com.eshoppingzone.cart.dto.AddToCartRequest;
import com.eshoppingzone.cart.dto.CartDto;
import com.eshoppingzone.cart.dto.UpdateCartItemRequest;

import java.math.BigDecimal;

public interface CartService {

    CartDto getCart(Long customerId);

    CartDto addItemToCart(Long customerId, AddToCartRequest request);

    CartDto updateItemQuantity(Long customerId, Long productId, UpdateCartItemRequest request);

    CartDto removeItemFromCart(Long customerId, Long productId);

    void clearCart(Long customerId);

    BigDecimal getCartTotal(Long customerId);
}
