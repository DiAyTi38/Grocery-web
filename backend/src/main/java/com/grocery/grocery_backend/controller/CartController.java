package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.dto.AddToCartRequest;
import com.grocery.grocery_backend.model.dto.CartDto;
import com.grocery.grocery_backend.model.dto.UpdateCartItemRequest;
import com.grocery.grocery_backend.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDto> getMyCart(Authentication authentication) {
        return ResponseEntity.ok(cartService.getMyCart(authentication));
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(cartService.addToCart(request, authentication));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartDto> updateCartItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(cartService.updateCartItem(itemId, request, authentication));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartDto> removeCartItem(
            @PathVariable Long itemId,
            Authentication authentication) {
        return ResponseEntity.ok(cartService.removeCartItem(itemId, authentication));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        cartService.clearCart(authentication);
        return ResponseEntity.noContent().build();
    }
}
