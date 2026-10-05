package com.grocery.grocery_backend.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InventoryUpdateRequest {

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be greater than or equal to 0")
    private Integer quantity;

    @Min(value = 0, message = "Low stock threshold must be greater than or equal to 0")
    private Integer lowStockThreshold;
}
