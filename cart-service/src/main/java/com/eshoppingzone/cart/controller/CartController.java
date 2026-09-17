package com.eshoppingzone.cart.controller;

import com.eshoppingzone.cart.service.CartService;
import com.eshoppingzone.common.dto.cart.AddToCartRequest;
import com.eshoppingzone.common.dto.cart.CartDto;
import com.eshoppingzone.common.dto.cart.UpdateCartItemRequest;
import com.eshoppingzone.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cart")
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasRole('CUSTOMER')")
@Tag(name = "Cart", description = "Endpoints for managing customer shopping cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "Get current customer's shopping cart")
    public ResponseEntity<CartDto> getCart() {
        Long customerId = SecurityUtils.getCurrentUserId();
        CartDto cart = cartService.getCart(customerId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the shopping cart (Authoritative price fetched from Product Service)")
    public ResponseEntity<CartDto> addItemToCart(@Valid @RequestBody AddToCartRequest request) {
        Long customerId = SecurityUtils.getCurrentUserId();
        CartDto cart = cartService.addItemToCart(customerId, request);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update quantity of a product in the cart (0 removes the item)")
    public ResponseEntity<CartDto> updateItemQuantity(@PathVariable Long productId,
                                                      @Valid @RequestBody UpdateCartItemRequest request) {
        Long customerId = SecurityUtils.getCurrentUserId();
        CartDto cart = cartService.updateItemQuantity(customerId, productId, request);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove a product from the cart")
    public ResponseEntity<CartDto> removeItemFromCart(@PathVariable Long productId) {
        Long customerId = SecurityUtils.getCurrentUserId();
        CartDto cart = cartService.removeItemFromCart(customerId, productId);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping
    @Operation(summary = "Clear all items from current customer's shopping cart")
    public ResponseEntity<Void> clearCart() {
        Long customerId = SecurityUtils.getCurrentUserId();
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total")
    @Operation(summary = "Get the calculated total amount and item count of the cart")
    public ResponseEntity<Map<String, Object>> getCartTotal() {
        Long customerId = SecurityUtils.getCurrentUserId();
        CartDto cart = cartService.getCart(customerId);
        return ResponseEntity.ok(Map.of(
                "totalAmount", cart.getTotalAmount(),
                "totalItems", cart.getTotalItems()
        ));
    }
}
