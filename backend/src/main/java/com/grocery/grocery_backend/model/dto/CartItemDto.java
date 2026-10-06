package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.CartItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    public static CartItemDto from(CartItem item) {
        // Fallback for subtotal if it hasn't been fetched from DB yet after creation
        BigDecimal calcSubtotal = item.getSubtotal() != null ? item.getSubtotal() 
                : item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productImageUrl(item.getProduct().getImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(calcSubtotal)
                .build();
    }
}
