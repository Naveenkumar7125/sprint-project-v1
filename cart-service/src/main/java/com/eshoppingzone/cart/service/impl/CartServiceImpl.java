package com.eshoppingzone.cart.service.impl;

import com.eshoppingzone.cart.client.ProductClient;
import com.eshoppingzone.cart.entity.Cart;
import com.eshoppingzone.cart.entity.CartItem;
import com.eshoppingzone.cart.repository.CartItemRepository;
import com.eshoppingzone.cart.repository.CartRepository;
import com.eshoppingzone.cart.service.CartService;
import com.eshoppingzone.common.dto.cart.AddToCartRequest;
import com.eshoppingzone.common.dto.cart.CartDto;
import com.eshoppingzone.common.dto.cart.CartItemDto;
import com.eshoppingzone.common.dto.cart.UpdateCartItemRequest;
import com.eshoppingzone.common.dto.product.ProductDto;
import com.eshoppingzone.common.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private static final Logger log = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductClient productClient;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductClient productClient) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productClient = productClient;
    }

    @Override
    public CartDto getCart(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        return mapToDto(cart);
    }

    @Override
    public CartDto addItemToCart(Long customerId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(customerId);

        // Authoritative product validation from Product Service
        ProductDto product = productClient.getProductById(request.getProductId());
        if (product == null || !Boolean.TRUE.equals(product.getActive())) {
            throw new BadRequestException("Product is inactive or does not exist");
        }

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            existing.setQuantity(existing.getQuantity() + request.getQuantity());
            existing.setUnitPrice(product.getPrice()); // Always update to latest authoritative price
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(product.getImageUrl())
                    .unitPrice(product.getPrice())
                    .quantity(request.getQuantity())
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())))
                    .build();
            cart.getItems().add(newItem);
        }

        cart.recalculateTotals();
        Cart savedCart = cartRepository.save(cart);
        log.info("Added productId: {} to cart for customerId: {}, total: {}", request.getProductId(), customerId, savedCart.getTotalAmount());
        return mapToDto(savedCart);
    }

    @Override
    public CartDto updateItemQuantity(Long customerId, Long productId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(customerId);

        if (request.getQuantity() <= 0) {
            return removeItemFromCart(customerId, productId);
        }

        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            // Fetch latest authoritative price
            ProductDto product = productClient.getProductById(productId);
            if (product != null) {
                item.setUnitPrice(product.getPrice());
            }
            item.setQuantity(request.getQuantity());
            cart.recalculateTotals();
            Cart saved = cartRepository.save(cart);
            return mapToDto(saved);
        } else {
            throw new BadRequestException("Item not found in cart with productId: " + productId);
        }
    }

    @Override
    public CartDto removeItemFromCart(Long customerId, Long productId) {
        Cart cart = getOrCreateCart(customerId);
        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        if (removed) {
            cart.recalculateTotals();
            Cart saved = cartRepository.save(cart);
            log.info("Removed productId: {} from cart for customerId: {}", productId, customerId);
            return mapToDto(saved);
        }
        return mapToDto(cart);
    }

    @Override
    public void clearCart(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        cart.getItems().clear();
        cart.recalculateTotals();
        cartRepository.save(cart);
        log.info("Cleared cart for customerId: {}", customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCartTotal(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        return cart.getTotalAmount();
    }

    private Cart getOrCreateCart(Long customerId) {
        return cartRepository.findByCustomerIdWithItems(customerId)
                .orElseGet(() -> cartRepository.findByCustomerId(customerId)
                        .orElseGet(() -> {
                            Cart newCart = Cart.builder()
                                    .customerId(customerId)
                                    .items(new ArrayList<>())
                                    .totalAmount(BigDecimal.ZERO)
                                    .totalItems(0)
                                    .build();
                            return cartRepository.save(newCart);
                        }));
    }

    private CartDto mapToDto(Cart cart) {
        return CartDto.builder()
                .id(cart.getId())
                .customerId(cart.getCustomerId())
                .items(cart.getItems() != null ? cart.getItems().stream().map(this::mapToItemDto).collect(Collectors.toList()) : new ArrayList<>())
                .totalAmount(cart.getTotalAmount())
                .totalItems(cart.getTotalItems())
                .build();
    }

    private CartItemDto mapToItemDto(CartItem item) {
        return CartItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productImageUrl(item.getProductImageUrl())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}
