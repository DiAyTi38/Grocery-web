package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Inventory;
import com.grocery.grocery_backend.model.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ProductDto {

    private final Long id;
    private final Long categoryId;
    private final String categoryName;
    private final String sku;
    private final String name;
    private final String description;
    private final String unit;
    private final BigDecimal price;
    private final String imageUrl;
    private final boolean active;
    private final int stockQuantity;
    private final int reservedQuantity;
    private final int availableQuantity;
    private final int lowStockThreshold;
    private final boolean lowStock;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static ProductDto from(Product product) {
        Inventory inventory = product.getInventory();
        int quantity = inventory == null ? 0 : inventory.getQuantity();
        int reserved = inventory == null ? 0 : inventory.getReservedQuantity();
        int available = inventory == null ? 0 : inventory.getAvailableQuantity();
        int threshold = inventory == null ? 0 : inventory.getLowStockThreshold();

        return ProductDto.builder()
                .id(product.getId())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .unit(product.getUnit())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .active(product.isActive())
                .stockQuantity(quantity)
                .reservedQuantity(reserved)
                .availableQuantity(available)
                .lowStockThreshold(threshold)
                .lowStock(available <= threshold)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
