package com.grocery.grocery_backend.model.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.model.entity.Inventory;
import com.grocery.grocery_backend.model.entity.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ProductDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("ProductDto maps inventory quantities and exposes backward-compatible stock and quantity properties")
    void shouldMapInventoryAndExposeStockAndQuantity() throws Exception {
        Category category = Category.builder()
                .id(1L)
                .name("Rau củ")
                .build();

        Product product = Product.builder()
                .id(10L)
                .category(category)
                .sku("VEG-001")
                .name("Cà chua bi")
                .price(BigDecimal.valueOf(25000))
                .unit("kg")
                .active(true)
                .build();

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(40)
                .reservedQuantity(5)
                .lowStockThreshold(8)
                .build();
        product.setInventory(inventory);

        ProductDto dto = ProductDto.from(product);

        assertThat(dto.getStockQuantity()).isEqualTo(40);
        assertThat(dto.getReservedQuantity()).isEqualTo(5);
        assertThat(dto.getAvailableQuantity()).isEqualTo(35);
        assertThat(dto.getStock()).isEqualTo(35); // stock reflects availableQuantity
        assertThat(dto.getQuantity()).isEqualTo(40); // quantity reflects total stockQuantity

        // Test Jackson serialization includes 'stock' and 'quantity'
        String json = objectMapper.writeValueAsString(dto);
        Map<?, ?> map = objectMapper.readValue(json, Map.class);

        assertThat(map.get("stock")).isEqualTo(35);
        assertThat(map.get("quantity")).isEqualTo(40);
        assertThat(map.get("stockQuantity")).isEqualTo(40);
        assertThat(map.get("availableQuantity")).isEqualTo(35);
    }
}
