package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.AiPredictionDto;
import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.model.entity.Product;
import com.grocery.grocery_backend.repository.AiPredictionRepository;
import com.grocery.grocery_backend.repository.ProductRepository;
import com.grocery.grocery_backend.repository.PurchaseHistoryRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceFallbackTest {

    @Mock
    private AiPredictionRepository aiPredictionRepository;
    @Mock
    private PurchaseHistoryRepository purchaseHistoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;

    private AiService aiService;

    @BeforeEach
    void setUp() {
        aiService = new AiService(
                null, // aiServiceClient not needed for fallback test
                aiPredictionRepository,
                purchaseHistoryRepository,
                productRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Fallback excludes inactive products and supplements with active products to reach 5")
    void testFallbackExcludesInactiveAndSupplements() {
        Category cat = Category.builder().id(1L).name("Rau củ").build();

        Product activeProd1 = Product.builder().id(1L).name("Cải xanh").price(BigDecimal.valueOf(15000)).active(true).category(cat).build();
        Product inactiveProd2 = Product.builder().id(2L).name("Cà rốt ngừng bán").price(BigDecimal.valueOf(20000)).active(false).category(cat).build();
        Product activeProd3 = Product.builder().id(3L).name("Thịt bò").price(BigDecimal.valueOf(100000)).active(true).category(cat).build();

        // purchase history returns 3 items: prod 1 (active), prod 2 (inactive), prod 3 (active)
        List<Object[]> topSold = new ArrayList<>();
        topSold.add(new Object[]{1L, 50L});
        topSold.add(new Object[]{2L, 40L});
        topSold.add(new Object[]{3L, 30L});
        when(purchaseHistoryRepository.findTopSellingProducts(5)).thenReturn(topSold);

        when(productRepository.findById(1L)).thenReturn(Optional.of(activeProd1));
        when(productRepository.findById(2L)).thenReturn(Optional.of(inactiveProd2));
        when(productRepository.findById(3L)).thenReturn(Optional.of(activeProd3));

        // Latest active products in catalog to supplement up to 5
        Product activeProd4 = Product.builder().id(4L).name("Sữa tươi").price(BigDecimal.valueOf(35000)).active(true).category(cat).build();
        Product activeProd5 = Product.builder().id(5L).name("Trứng gà").price(BigDecimal.valueOf(30000)).active(true).category(cat).build();
        Product activeProd6 = Product.builder().id(6L).name("Gạo ST25").price(BigDecimal.valueOf(180000)).active(true).category(cat).build();

        when(productRepository.findTop5ByActiveTrueOrderByIdDesc()).thenReturn(List.of(activeProd6, activeProd5, activeProd4, activeProd3, activeProd1));

        List<AiPredictionDto> results = aiService.getFallbackTopSelling();

        // Total returned should be exactly 5 active products
        assertEquals(5, results.size());

        // Inactive product 2 must NOT be in results
        assertTrue(results.stream().noneMatch(dto -> dto.getProductId().equals(2L)));

        // Active products 1, 3, 6, 5, 4 should be present
        List<Long> ids = results.stream().map(AiPredictionDto::getProductId).toList();
        assertTrue(ids.contains(1L));
        assertTrue(ids.contains(3L));
        assertTrue(ids.contains(6L));
        assertTrue(ids.contains(5L));
        assertTrue(ids.contains(4L));
    }

    @Test
    @DisplayName("Fallback returns active catalog products on complete cold start (empty purchase history)")
    void testFallbackColdStartEmptyHistory() {
        when(purchaseHistoryRepository.findTopSellingProducts(5)).thenReturn(List.of());

        Category cat = Category.builder().id(1L).name("Rau củ").build();
        Product p1 = Product.builder().id(10L).name("SP 10").active(true).category(cat).build();
        Product p2 = Product.builder().id(11L).name("SP 11").active(true).category(cat).build();

        when(productRepository.findTop5ByActiveTrueOrderByIdDesc()).thenReturn(List.of(p1, p2));

        List<AiPredictionDto> results = aiService.getFallbackTopSelling();

        assertEquals(2, results.size());
        assertEquals(10L, results.get(0).getProductId());
        assertEquals(11L, results.get(1).getProductId());
    }
}
