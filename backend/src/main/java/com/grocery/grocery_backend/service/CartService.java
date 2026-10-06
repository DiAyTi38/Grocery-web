package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.AddToCartRequest;
import com.grocery.grocery_backend.model.dto.CartDto;
import com.grocery.grocery_backend.model.dto.UpdateCartItemRequest;
import com.grocery.grocery_backend.model.entity.Cart;
import com.grocery.grocery_backend.model.entity.CartItem;
import com.grocery.grocery_backend.model.entity.Product;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.CartItemRepository;
import com.grocery.grocery_backend.repository.CartRepository;
import com.grocery.grocery_backend.repository.ProductRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartDto getMyCart(Authentication authentication) {
        return CartDto.from(getOrCreateCart(authentication.getName()));
    }

    public CartDto addToCart(AddToCartRequest request, Authentication authentication) {
        Cart cart = getOrCreateCart(authentication.getName());
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
                
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add inactive product to cart");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        
        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            // Optionally update unit price to latest if they add more, but here we keep simple or update it.
            item.setUnitPrice(product.getPrice());
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            cartItemRepository.save(newItem);
            cart.getItems().add(newItem); // keep in sync for current transaction DTO generation
        }

        // flush so db generates subtotal
        cartItemRepository.flush();
        return CartDto.from(cart);
    }

    public CartDto updateCartItem(Long itemId, UpdateCartItemRequest request, Authentication authentication) {
        Cart cart = getOrCreateCart(authentication.getName());
        
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
                
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Item does not belong to your cart");
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        cartItemRepository.flush();

        return CartDto.from(cart);
    }

    public CartDto removeCartItem(Long itemId, Authentication authentication) {
        Cart cart = getOrCreateCart(authentication.getName());
        
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
                
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Item does not belong to your cart");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        
        return CartDto.from(cart);
    }

    public void clearCart(Authentication authentication) {
        Cart cart = getOrCreateCart(authentication.getName());
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
    }

    private Cart getOrCreateCart(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });
    }
}
