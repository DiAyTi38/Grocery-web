package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Order;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderDto {
    private Long id;
    private Long userId;
    private String username;
    private String customerName;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;

    public static OrderDto from(Order order) {
        String custName = null;
        String uName = null;
        Long uId = null;

        if (order.getUser() != null) {
            uId = order.getUser().getId();
            uName = order.getUser().getUsername();
            custName = (order.getUser().getFullName() != null && !order.getUser().getFullName().isBlank())
                    ? order.getUser().getFullName()
                    : order.getUser().getUsername();
        }

        return OrderDto.builder()
                .id(order.getId())
                .userId(uId)
                .username(uName)
                .customerName(custName)
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(OrderItemDto::from).toList())
                .build();
    }
}
