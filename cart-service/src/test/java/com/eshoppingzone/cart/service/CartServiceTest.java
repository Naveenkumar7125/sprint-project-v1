package com.eshoppingzone.cart.service;

import com.eshoppingzone.cart.client.ProductClient;
import com.eshoppingzone.cart.entity.Cart;
import com.eshoppingzone.cart.entity.CartItem;
import com.eshoppingzone.cart.repository.CartItemRepository;
import com.eshoppingzone.cart.repository.CartRepository;
import com.eshoppingzone.cart.service.impl.CartServiceImpl;
import com.eshoppingzone.common.dto.cart.AddToCartRequest;
import com.eshoppingzone.common.dto.cart.CartDto;
import com.eshoppingzone.common.dto.cart.UpdateCartItemRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductClient productClient;

    private CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartServiceImpl(cartRepository, cartItemRepository, productClient);
    }

    @Test
    @DisplayName("Add item to cart verifies authoritative price from ProductService and recalculates total")
    void addItemToCart_Success() {
        Long customerId = 100L;
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(10L)
                .quantity(2)
                .build();

        ProductDto product = ProductDto.builder()
                .id(10L)
                .name("Smartphone")
                .price(new BigDecimal("499.99"))
                .imageUrl("https://example.com/phone.jpg")
                .active(true)
                .build();

        Cart cart = Cart.builder()
                .id(1L)
                .customerId(customerId)
                .items(new ArrayList<>())
                .totalAmount(BigDecimal.ZERO)
                .totalItems(0)
                .build();

        when(cartRepository.findByCustomerIdWithItems(customerId)).thenReturn(Optional.of(cart));
        when(productClient.getProductById(10L)).thenReturn(product);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartDto result = cartService.addItemToCart(customerId, request);

        assertNotNull(result);
        assertEquals(1, cart.getItems().size());
        assertEquals(new BigDecimal("999.98"), cart.getTotalAmount());
        assertEquals(2, cart.getTotalItems());
        assertEquals("Smartphone", cart.getItems().get(0).getProductName());
    }

    @Test
    @DisplayName("Update item quantity in cart recalculates totals")
    void updateItemQuantity_Success() {
        Long customerId = 100L;
        Cart cart = Cart.builder()
                .id(1L)
                .customerId(customerId)
                .items(new ArrayList<>())
                .totalAmount(new BigDecimal("100.00"))
                .totalItems(1)
                .build();

        CartItem item = CartItem.builder()
                .id(5L)
                .cart(cart)
                .productId(10L)
                .productName("Item A")
                .unitPrice(new BigDecimal("100.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("100.00"))
                .build();
        cart.getItems().add(item);

        when(cartRepository.findByCustomerIdWithItems(customerId)).thenReturn(Optional.of(cart));
        when(productClient.getProductById(10L)).thenReturn(ProductDto.builder().id(10L).price(new BigDecimal("100.00")).active(true).build());
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(3).build();
        CartDto result = cartService.updateItemQuantity(customerId, 10L, request);

        assertNotNull(result);
        assertEquals(3, item.getQuantity());
        assertEquals(new BigDecimal("300.00"), cart.getTotalAmount());
        assertEquals(3, cart.getTotalItems());
    }

    @Test
    @DisplayName("Update item quantity to 0 removes the item from cart")
    void updateItemQuantity_Zero_RemovesItem() {
        Long customerId = 100L;
        Cart cart = Cart.builder()
                .id(1L)
                .customerId(customerId)
                .items(new ArrayList<>())
                .build();

        CartItem item = CartItem.builder()
                .id(5L)
                .cart(cart)
                .productId(10L)
                .unitPrice(new BigDecimal("50.00"))
                .quantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .build();
        cart.getItems().add(item);
        cart.recalculateTotals();

        when(cartRepository.findByCustomerIdWithItems(customerId)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(0).build();
        CartDto result = cartService.updateItemQuantity(customerId, 10L, request);

        assertNotNull(result);
        assertTrue(cart.getItems().isEmpty());
        assertEquals(BigDecimal.ZERO, cart.getTotalAmount());
        assertEquals(0, cart.getTotalItems());
    }

    @Test
    @DisplayName("Clear cart removes all items and resets totals")
    void clearCart_Success() {
        Long customerId = 100L;
        Cart cart = Cart.builder()
                .id(1L)
                .customerId(customerId)
                .items(new ArrayList<>())
                .totalAmount(new BigDecimal("200.00"))
                .totalItems(4)
                .build();

        when(cartRepository.findByCustomerIdWithItems(customerId)).thenReturn(Optional.of(cart));

        cartService.clearCart(customerId);

        assertTrue(cart.getItems().isEmpty());
        assertEquals(BigDecimal.ZERO, cart.getTotalAmount());
        assertEquals(0, cart.getTotalItems());
        verify(cartRepository, times(1)).save(cart);
    }
}
