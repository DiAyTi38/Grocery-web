package com.grocery.grocery_backend.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LoyaltyAccountDto {
    private String tier;
    private Integer points;
    private BigDecimal totalSpend;
    private LocalDateTime updatedAt;
}
