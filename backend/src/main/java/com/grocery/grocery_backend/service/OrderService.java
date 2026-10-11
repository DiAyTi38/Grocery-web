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
    private final LoyaltyService loyaltyService;

    public OrderDto checkout(Authentication authentication) {
        return checkout(authentication, false);
    }

    public OrderDto checkout(Authentication authentication, boolean autoDeliver) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = Order.builder()
                .user(user)
                .status(autoDeliver ? Order.OrderStatus.DELIVERED : Order.OrderStatus.PENDING)
                .build();
        
        // Save order first to get ID for OrderItems
        order = orderRepository.save(order);

        for (CartItem cartItem : cart.getItems()) {
            // Check inventory với Khóa Bi Quan (Pessimistic Lock)
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

        Order savedOrder = orderRepository.save(order);

        // Kết hợp Phương án 3: Nếu autoDeliver = true, kích hoạt tích điểm Loyalty ngay lập tức
        if (autoDeliver) {
            loyaltyService.earnPointsFromOrder(savedOrder);
        }

        return OrderDto.from(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getMyOrders(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(OrderDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(OrderDto::from).toList();
    }

    public OrderDto updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng #" + orderId));

        Order.OrderStatus oldStatus = order.getStatus();
        if (oldStatus == newStatus) {
            return OrderDto.from(order);
        }

        // Kết hợp Phương án 1: Nếu chuyển sang DELIVERED -> Tự động kích hoạt tích điểm Loyalty
        if (newStatus == Order.OrderStatus.DELIVERED && oldStatus != Order.OrderStatus.DELIVERED) {
            loyaltyService.earnPointsFromOrder(order);
        }

        // Nếu chuyển sang CANCELLED -> Tự động hoàn trả tồn kho vào MySQL
        if (newStatus == Order.OrderStatus.CANCELLED && oldStatus != Order.OrderStatus.CANCELLED) {
            restoreInventory(order);
        }

        order.setStatus(newStatus);
        return OrderDto.from(orderRepository.save(order));
    }

    public OrderDto markAsReceived(Long orderId, Authentication authentication) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng #" + orderId));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!order.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên đơn hàng này");
        }

        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng đã bị hủy, không thể nhận hàng");
        }

        return updateOrderStatus(orderId, Order.OrderStatus.DELIVERED);
    }

    public OrderDto cancelOrder(Long orderId, Authentication authentication) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng #" + orderId));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!order.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên đơn hàng này");
        }

        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng đã giao thành công, không thể hủy");
        }

        return updateOrderStatus(orderId, Order.OrderStatus.CANCELLED);
    }

    private void restoreInventory(Order order) {
        for (OrderItem item : order.getItems()) {
            Inventory inventory = inventoryRepository.findByProductIdForUpdate(item.getProduct().getId())
                    .orElse(null);
            if (inventory != null) {
                inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                inventoryRepository.save(inventory);
            }
        }
    }
}
