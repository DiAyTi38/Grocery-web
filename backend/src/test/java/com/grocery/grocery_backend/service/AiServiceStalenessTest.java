package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.AiPredictionDto;
import com.grocery.grocery_backend.model.entity.AiPrediction;
import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.model.entity.Product;
import com.grocery.grocery_backend.model.entity.User;
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
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceStalenessTest {

    @Mock
    private AiPredictionRepository aiPredictionRepository;
    @Mock
    private PurchaseHistoryRepository purchaseHistoryRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private Authentication authentication;

    private AiService aiService;
    private User testUser;
    private Category category;

    @BeforeEach
    void setUp() {
        aiService = new AiService(
                null,
                aiPredictionRepository,
                purchaseHistoryRepository,
                productRepository,
                userRepository
        );

        testUser = User.builder().id(1L).username("testuser").build();
        category = Category.builder().id(1L).name("Rau củ").build();

        when(authentication.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    }

    @Test
    @DisplayName("Quy tắc 1 & 2: Overdue > 7 ngày bị loại bỏ, Overdue 1-7 ngày bị phạt time-decay, và bù đắp fallback đủ 5")
    void testStalenessPolicyRules() {
        LocalDate today = LocalDate.now();

        // 1. Fresh prediction: due in 3 days -> confidence remains 100%
        Product p1 = Product.builder().id(101L).name("Cải ngọt").active(true).category(category).build();
        AiPrediction pred1 = AiPrediction.builder()
                .product(p1)
                .user(testUser)
                .predictedNextDate(today.plusDays(3))
                .confidence(BigDecimal.valueOf(0.85))
                .type(AiPrediction.PredictionType.REPLENISHMENT)
                .build();

        // 2. Overdue by 3 days: within 7 days -> kept, confidence decayed
        // decayFactor = 1 - (3 / 7) = 4/7 = ~0.5714 -> confidence = 0.80 * 0.5714 = ~0.46
        Product p2 = Product.builder().id(102L).name("Thịt heo").active(true).category(category).build();
        AiPrediction pred2 = AiPrediction.builder()
                .product(p2)
                .user(testUser)
                .predictedNextDate(today.minusDays(3))
                .confidence(BigDecimal.valueOf(0.80))
                .type(AiPrediction.PredictionType.REPLENISHMENT)
                .build();

        // 3. Overdue by 15 days (> 7 days) -> Quy tắc 1: MUST BE EXCLUDED
        Product p3 = Product.builder().id(103L).name("Gạo ST25 quá hạn 15 ngày").active(true).category(category).build();
        AiPrediction pred3 = AiPrediction.builder()
                .product(p3)
                .user(testUser)
                .predictedNextDate(today.minusDays(15))
                .confidence(BigDecimal.valueOf(0.90))
                .type(AiPrediction.PredictionType.REPLENISHMENT)
                .build();

        when(aiPredictionRepository.findAllByUserIdOrderByConfidenceDesc(1L))
                .thenReturn(List.of(pred1, pred2, pred3));

        // Quy tắc 3: Mock Fallback to supplement up to 5 items
        when(purchaseHistoryRepository.findTopSellingProducts(5)).thenReturn(List.of());
        Product p4 = Product.builder().id(104L).name("Sản phẩm FB 4").active(true).category(category).build();
        Product p5 = Product.builder().id(105L).name("Sản phẩm FB 5").active(true).category(category).build();
        Product p6 = Product.builder().id(106L).name("Sản phẩm FB 6").active(true).category(category).build();
        when(productRepository.findTop5ByActiveTrueOrderByIdDesc()).thenReturn(List.of(p4, p5, p6));

        List<AiPredictionDto> results = aiService.getRecommendations(authentication);

        // Assert total count is 5
        assertEquals(5, results.size());

        // Assert product 103 (overdue 15 days) was EXCLUDED
        assertTrue(results.stream().noneMatch(d -> d.getProductId().equals(103L)));

        // Assert fresh product 101 kept original confidence 0.85
        AiPredictionDto dto1 = results.stream().filter(d -> d.getProductId().equals(101L)).findFirst().orElseThrow();
        assertEquals(0.85, dto1.getConfidence());
        assertEquals(3.0, dto1.getPredictedDays());

        // Assert product 102 suffered Time-Decay penalty (< 0.80)
        AiPredictionDto dto2 = results.stream().filter(d -> d.getProductId().equals(102L)).findFirst().orElseThrow();
        assertEquals(-3.0, dto2.getPredictedDays());
        assertTrue(dto2.getConfidence() < 0.80);
        assertEquals(0.46, dto2.getConfidence()); // 0.80 * (4/7) = 0.457 -> 0.46

        // Assert fallback items supplemented
        assertTrue(results.stream().anyMatch(d -> d.getProductId().equals(104L)));
        assertTrue(results.stream().anyMatch(d -> d.getProductId().equals(105L)));
        assertTrue(results.stream().anyMatch(d -> d.getProductId().equals(106L)));
    }
}
