package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Cart;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CartDto {
    private Long id;
    private List<CartItemDto> items;
    private BigDecimal totalAmount;

    public static CartDto from(Cart cart) {
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(CartItemDto::from)
                .toList();
                
        BigDecimal total = itemDtos.stream()
                .map(CartItemDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartDto.builder()
                .id(cart.getId())
                .items(itemDtos)
                .totalAmount(total)
                .build();
    }
}
