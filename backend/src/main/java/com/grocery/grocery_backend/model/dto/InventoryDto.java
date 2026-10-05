package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Inventory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InventoryDto {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final String sku;
    private final int quantity;
    private final int reservedQuantity;
    private final int availableQuantity;
    private final int lowStockThreshold;
    private final boolean lowStock;
    private final LocalDateTime updatedAt;

    public static InventoryDto from(Inventory inventory) {
        int available = inventory.getAvailableQuantity();
        return InventoryDto.builder()
                .id(inventory.getId())
                .productId(inventory.getProduct().getId())
                .productName(inventory.getProduct().getName())
                .sku(inventory.getProduct().getSku())
                .quantity(inventory.getQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .availableQuantity(available)
                .lowStockThreshold(inventory.getLowStockThreshold())
                .lowStock(available <= inventory.getLowStockThreshold())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
