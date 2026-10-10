package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.OrderDto;
import com.grocery.grocery_backend.model.entity.Cart;
import com.grocery.grocery_backend.model.entity.CartItem;
import com.grocery.grocery_backend.model.entity.Inventory;
import com.grocery.grocery_backend.model.entity.Order;
import com.grocery.grocery_backend.model.entity.OrderItem;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.CartItemRepository;
import com.grocery.grocery_backend.repository.CartRepository;
import com.grocery.grocery_backend.repository.InventoryRepository;
import com.grocery.grocery_backend.repository.OrderRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    public OrderDto checkout(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = Order.builder().user(user).status(Order.OrderStatus.PENDING).build();
        
        // Save order first to get ID for OrderItems
        order = orderRepository.save(order);

        for (CartItem cartItem : cart.getItems()) {
            // Check inventory
            // Sử dụng hàm ForUpdate để áp dụng Khóa Bi Quan (Pessimistic Lock)
            Inventory inventory = inventoryRepository.findByProductIdForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Inventory missing for product: " + cartItem.getProduct().getName()));

            if (inventory.getQuantity() < cartItem.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough stock for product: " + cartItem.getProduct().getName());
            }

            // Deduct inventory
            inventory.setQuantity(inventory.getQuantity() - cartItem.getQuantity());
            inventoryRepository.save(inventory);

            // Create OrderItem
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(cartItem.getProduct())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getUnitPrice())
                    .build();
            
            order.getItems().add(orderItem);

            BigDecimal itemTotal = cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);
        }

        order.setTotalAmount(totalAmount);
        
        // Clear cart
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();

        return OrderDto.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getMyOrders(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(OrderDto::from).toList();
    }
}
