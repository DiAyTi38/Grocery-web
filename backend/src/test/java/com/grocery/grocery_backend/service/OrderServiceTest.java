package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.OrderDto;
import com.grocery.grocery_backend.model.entity.*;
import com.grocery.grocery_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoyaltyService loyaltyService;

    @Mock
    private AiService aiService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OrderService orderService;

    private User sampleUser;
    private Product sampleProduct;
    private Cart sampleCart;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("dattran")
                .fullName("Trần Tiến Đạt")
                .role(Role.ROLE_USER)
                .build();

        sampleProduct = Product.builder()
                .id(10L)
                .name("Sữa tươi Vinamilk")
                .price(new BigDecimal("32000.00"))
                .active(true)
                .build();

        sampleInventory = Inventory.builder()
                .id(100L)
                .product(sampleProduct)
                .quantity(50)
                .lowStockThreshold(5)
                .build();

        CartItem cartItem = CartItem.builder()
                .id(1000L)
                .product(sampleProduct)
                .quantity(2)
                .unitPrice(new BigDecimal("32000.00"))
                .build();

        sampleCart = Cart.builder()
                .id(200L)
                .user(sampleUser)
                .items(new ArrayList<>(List.of(cartItem)))
                .build();
    }

    @Test
    @DisplayName("Checkout - Thành công trừ tồn kho và làm sạch giỏ hàng")
    void checkout_Success_DecrementsInventoryAndClearsCart() {
        when(authentication.getName()).thenReturn("dattran");
        when(userRepository.findByUsername("dattran")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(inventoryRepository.findByProductIdForUpdate(10L)).thenReturn(Optional.of(sampleInventory));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            if (order.getId() == null) {
                order.setId(5000L);
            }
            return order;
        });

        OrderDto result = orderService.checkout(authentication, false);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(5000L);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("64000.00"));
        assertThat(result.getStatus()).isEqualTo("PENDING");

        // Kiểm tra tồn kho bị trừ: 50 - 2 = 48
        assertThat(sampleInventory.getQuantity()).isEqualTo(48);
        verify(inventoryRepository).save(sampleInventory);

        // Kiểm tra xóa giỏ hàng
        verify(cartItemRepository).deleteByCartId(200L);
        assertThat(sampleCart.getItems()).isEmpty();
    }

    @Test
    @DisplayName("Checkout - Bị chặn khi tồn kho không đủ (Insufficient Stock)")
    void checkout_InsufficientStock_ThrowsBadRequest() {
        // Tồn kho chỉ còn 1 nhưng giỏ hàng đòi mua 2
        sampleInventory.setQuantity(1);

        when(authentication.getName()).thenReturn("dattran");
        when(userRepository.findByUsername("dattran")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(inventoryRepository.findByProductIdForUpdate(10L)).thenReturn(Optional.of(sampleInventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(5000L);
            return order;
        });

        assertThatThrownBy(() -> orderService.checkout(authentication, false))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
                .hasMessageContaining("Not enough stock for product");

        // Giỏ hàng KHÔNG bị xóa khi ném lỗi
        verify(cartItemRepository, never()).deleteByCartId(anyLong());
    }

    @Test
    @DisplayName("Checkout - Bị chặn khi giỏ hàng rỗng")
    void checkout_EmptyCart_ThrowsBadRequest() {
        sampleCart.getItems().clear();

        when(authentication.getName()).thenReturn("dattran");
        when(userRepository.findByUsername("dattran")).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));

        assertThatThrownBy(() -> orderService.checkout(authentication, false))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
                .hasMessageContaining("Cart is empty");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Checkout - Bị chặn khi không tìm thấy User")
    void checkout_UserNotFound_ThrowsNotFound() {
        when(authentication.getName()).thenReturn("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.checkout(authentication, false))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND)
                .hasMessageContaining("User not found");
    }
}
