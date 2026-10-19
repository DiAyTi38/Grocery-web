package com.grocery.grocery_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoyaltyAccountDto {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String tier;
    private Integer points;
    private BigDecimal totalSpend;
    private LocalDateTime updatedAt;
}
