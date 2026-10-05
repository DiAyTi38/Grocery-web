package com.grocery.grocery_backend.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must not exceed 150 characters")
    private String name;

    private String description;

    @NotBlank(message = "Unit is required")
    @Size(max = 20, message = "Unit must not exceed 20 characters")
    private String unit;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Min(value = 0, message = "Initial quantity must be greater than or equal to 0")
    private Integer initialQuantity;

    @Min(value = 0, message = "Low stock threshold must be greater than or equal to 0")
    private Integer lowStockThreshold;

    private Boolean active;
}
