package com.grocery.grocery_backend.model.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LoyaltyTransactionDto {
    private Long id;
    private Long orderId;
    private Integer points;
    private String type;
    private String description;
    private LocalDateTime createdAt;
}
