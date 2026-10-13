package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.model.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiServiceFeatureResolutionTest {

    private AiService aiService;

    @BeforeEach
    void setUp() {
        // Instantiate AiService with null dependencies since resolve methods are pure functions of Product
        aiService = new AiService(null, null, null, null, null);
    }

    @Test
    @DisplayName("Category 'Rau củ quả sạch': categoryType=FOOD, reminderDays=3.0")
    void testVegetablesCategory() {
        Category category = Category.builder().id(1L).name("Rau củ quả sạch").build();
        Product product = Product.builder().id(1L).name("Rau cải ngọt").category(category).build();

        assertEquals("FOOD", aiService.resolveCategoryType(product));
        assertEquals(3.0, aiService.resolveReminderIntervalDays(product));
    }

    @Test
    @DisplayName("Category 'Thịt - hải sản': categoryType=FOOD, reminderDays=5.0")
    void testMeatCategory() {
        Category category = Category.builder().id(2L).name("Thịt - hải sản").build();
        Product product = Product.builder().id(3L).name("Thịt heo ba chỉ").category(category).build();

        assertEquals("FOOD", aiService.resolveCategoryType(product));
        assertEquals(5.0, aiService.resolveReminderIntervalDays(product));
    }

    @Test
    @DisplayName("Category 'Sữa & trứng': categoryType=FOOD, reminderDays=7.0")
    void testDairyCategory() {
        Category category = Category.builder().id(3L).name("Sữa & trứng").build();
        Product product = Product.builder().id(4L).name("Sữa tươi Vinamilk").category(category).build();

        assertEquals("FOOD", aiService.resolveCategoryType(product));
        assertEquals(7.0, aiService.resolveReminderIntervalDays(product));
    }

    @Test
    @DisplayName("Category 'Đồ khô': categoryType=FOOD, reminderDays=14.0")
    void testDryGoodsCategory() {
        Category category = Category.builder().id(4L).name("Đồ khô").build();
        Product rice = Product.builder().id(5L).name("Gạo ST25").category(category).build();
        Product noodles = Product.builder().id(6L).name("Mì Hảo Hảo tôm chua cay").category(category).build();

        assertEquals("FOOD", aiService.resolveCategoryType(rice));
        assertEquals(14.0, aiService.resolveReminderIntervalDays(rice));

        assertEquals("FOOD", aiService.resolveCategoryType(noodles));
        assertEquals(14.0, aiService.resolveReminderIntervalDays(noodles));
    }

    @Test
    @DisplayName("Category 'Sắc đẹp': categoryType=COSMETIC, reminderDays=30.0")
    void testBeautyCategory() {
        Category category = Category.builder().id(5L).name("Sắc đẹp").build();
        Product sunscreen = Product.builder().id(14L).name("Kem chống nắng Anessa").category(category).build();

        assertEquals("COSMETIC", aiService.resolveCategoryType(sunscreen));
        assertEquals(30.0, aiService.resolveReminderIntervalDays(sunscreen));
    }

    @Test
    @DisplayName("Trap check: 'Sữa rửa mặt' & 'Sữa tắm' in 'Sắc đẹp' must NOT trigger dairy 7.0")
    void testBeautyProductsWithMilkKeywordDoNotTriggerDairy() {
        Category beauty = Category.builder().id(5L).name("Sắc đẹp").build();
        Product cleanser = Product.builder().id(15L).name("Sữa rửa mặt Cetaphil").category(beauty).build();
        Product showerGel = Product.builder().id(19L).name("Sữa tắm dưỡng ẩm Dove").category(beauty).build();

        assertEquals("COSMETIC", aiService.resolveCategoryType(cleanser));
        assertEquals(30.0, aiService.resolveReminderIntervalDays(cleanser),
                "Sữa rửa mặt phải có chu kỳ 30 ngày, không được nhầm thành sữa uống 7 ngày");

        assertEquals("COSMETIC", aiService.resolveCategoryType(showerGel));
        assertEquals(30.0, aiService.resolveReminderIntervalDays(showerGel),
                "Sữa tắm phải có chu kỳ 30 ngày, không được nhầm thành sữa uống 7 ngày");
    }

    @Test
    @DisplayName("Defensive check: Product with null Category safely falls back to FOOD / 7.0")
    void testProductWithNullCategory() {
        Product product = Product.builder().id(99L).name("Sản phẩm chưa rõ loại").category(null).build();

        assertEquals("FOOD", aiService.resolveCategoryType(product));
        assertEquals(7.0, aiService.resolveReminderIntervalDays(product));
    }
}
