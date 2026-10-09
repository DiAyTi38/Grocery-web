package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.ai.AiSchemas;
import com.grocery.grocery_backend.ai.AiServiceClient;
import com.grocery.grocery_backend.model.dto.AiPredictionDto;
import com.grocery.grocery_backend.model.entity.AiPrediction;
import com.grocery.grocery_backend.model.entity.Product;
import com.grocery.grocery_backend.model.entity.PurchaseHistory;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.AiPredictionRepository;
import com.grocery.grocery_backend.repository.ProductRepository;
import com.grocery.grocery_backend.repository.PurchaseHistoryRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AiService {

    private final AiServiceClient aiServiceClient;
    private final AiPredictionRepository aiPredictionRepository;
    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Get AI recommendations for current user.
     * 1. Try to return cached predictions from DB.
     * 2. If no cached predictions, try calling Python AI service (parallel).
     * 3. If AI service is down or no data, fallback to top selling products.
     */
    @Transactional(readOnly = true)
    public List<AiPredictionDto> getRecommendations(Authentication authentication) {
        User user = getUser(authentication.getName());

        // Check cached predictions in DB
        List<AiPrediction> cached = aiPredictionRepository.findAllByUserIdOrderByConfidenceDesc(user.getId());
        if (!cached.isEmpty()) {
            return cached.stream().map(this::toDto).toList();
        }

        // No cached predictions — fallback to top selling
        return getFallbackTopSelling();
    }

    /**
     * Call Python AI to refresh predictions for current user.
     * Uses CompletableFuture parallel calls (Solution A - Problem 1).
     * Falls back to top selling if AI fails (Solution A - Problem 2).
     */
    public List<AiPredictionDto> refreshPredictions(Authentication authentication) {
        User user = getUser(authentication.getName());

        // Get user's purchase history grouped by product
        List<PurchaseHistory> allHistory = purchaseHistoryRepository.findAllByUserIdOrderByPurchaseDateAsc(user.getId());

        if (allHistory.isEmpty()) {
            log.info("User {} has no purchase history, returning fallback", user.getUsername());
            return getFallbackTopSelling();
        }

        // Group purchases by productId
        Map<Long, List<PurchaseHistory>> byProduct = allHistory.stream()
                .collect(Collectors.groupingBy(ph -> ph.getProduct().getId()));

        // Build prediction requests for products with >= 2 purchases
        List<AiSchemas.PredictionRequest> requests = byProduct.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= 2)
                .map(entry -> {
                    List<AiSchemas.Purchase> purchases = entry.getValue().stream()
                            .map(ph -> AiSchemas.Purchase.builder()
                                    .productId(ph.getProduct().getId())
                                    .purchaseDate(ph.getPurchaseDate().toLocalDate())
                                    .quantity(ph.getQuantity())
                                    .build())
                            .toList();

                    return AiSchemas.PredictionRequest.builder()
                            .userId(user.getId())
                            .productId(entry.getKey())
                            .purchases(purchases)
                            .categoryType("FOOD")
                            .reminderIntervalDays(7.0)
                            .build();
                })
                .toList();

        if (requests.isEmpty()) {
            log.info("User {} has insufficient purchase data (needs 2+ per product), returning fallback", user.getUsername());
            return getFallbackTopSelling();
        }

        // Call Python AI in PARALLEL (CompletableFuture)
        List<AiSchemas.PredictionResponse> aiResults = aiServiceClient.predictParallel(requests);

        if (aiResults.isEmpty()) {
            log.warn("AI service returned no results, returning fallback");
            return getFallbackTopSelling();
        }

        // Clear old predictions and save new ones
        aiPredictionRepository.deleteAllByUserId(user.getId());

        List<AiPrediction> predictions = aiResults.stream()
                .map(result -> {
                    Product product = productRepository.findById(result.getProductId())
                            .orElse(null);
                    if (product == null) return null;

                    return AiPrediction.builder()
                            .user(user)
                            .product(product)
                            .predictedNextDate(result.getPredictedNextDate())
                            .confidence(BigDecimal.valueOf(result.getConfidence()))
                            .type(AiPrediction.PredictionType.REPLENISHMENT)
                            .build();
                })
                .filter(p -> p != null)
                .toList();

        aiPredictionRepository.saveAll(predictions);

        return predictions.stream().map(this::toDto).toList();
    }

    /**
     * Fallback: Return top 5 best-selling products when AI is unavailable.
     * (Solution A - Problem 2: Cold Start)
     */
    @Transactional(readOnly = true)
    public List<AiPredictionDto> getFallbackTopSelling() {
        List<Object[]> topProducts = purchaseHistoryRepository.findTopSellingProducts(5);

        return topProducts.stream()
                .map(row -> {
                    Long productId = (Long) row[0];
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product == null) return null;

                    AiPredictionDto dto = new AiPredictionDto();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setProductImageUrl(product.getImageUrl());
                    dto.setPredictedNextDate(LocalDate.now().plusDays(7));
                    dto.setPredictedDays(7.0);
                    dto.setConfidence(0.5); // Medium confidence for fallback
                    dto.setType("RECOMMENDATION");
                    return dto;
                })
                .filter(dto -> dto != null)
                .toList();
    }

    /**
     * Check if Python AI service is alive.
     */
    public boolean healthCheck() {
        return aiServiceClient.isHealthy();
    }

    private AiPredictionDto toDto(AiPrediction prediction) {
        AiPredictionDto dto = new AiPredictionDto();
        dto.setProductId(prediction.getProduct().getId());
        dto.setProductName(prediction.getProduct().getName());
        dto.setProductImageUrl(prediction.getProduct().getImageUrl());
        dto.setPredictedNextDate(prediction.getPredictedNextDate());
        
        // Tính toán số ngày còn lại (predictedDays) để không bị null
        if (prediction.getPredictedNextDate() != null) {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), prediction.getPredictedNextDate());
            dto.setPredictedDays((double) daysBetween);
        }
        
        dto.setConfidence(prediction.getConfidence().doubleValue());
        dto.setType(prediction.getType().name());
        return dto;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
