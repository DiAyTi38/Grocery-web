package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.ai.AiSchemas;
import com.grocery.grocery_backend.ai.AiServiceClient;
import com.grocery.grocery_backend.model.dto.AiPredictionDto;
import com.grocery.grocery_backend.model.entity.AiPrediction;
import com.grocery.grocery_backend.model.entity.Order;
import com.grocery.grocery_backend.model.entity.OrderItem;
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
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
     * Uses CompletableFuture parallel calls if Python AI is alive.
     * If Python AI is down/unavailable, falls back to Embedded Intelligent Engine
     * calculated directly from the user's purchase history and updates the database.
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

        // 1. Try calling Python AI service if reachable
        if (aiServiceClient.isHealthy()) {
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

            if (!requests.isEmpty()) {
                List<AiSchemas.PredictionResponse> aiResults = aiServiceClient.predictParallel(requests);
                if (!aiResults.isEmpty()) {
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
                            .filter(Objects::nonNull)
                            .toList();

                    aiPredictionRepository.saveAll(predictions);
                    return predictions.stream().map(this::toDto).toList();
                }
            }
        }

        // 2. Embedded Intelligent Engine: Tự động tính chu kỳ dựa trên purchase_history
        log.info("Using embedded intelligent replenishment engine for user {}", user.getUsername());
        return calculateAndSaveEmbeddedPredictions(user, byProduct);
    }

    /**
     * Core handler triggered when an order is completed (DELIVERED).
     * 1. Records each item in purchase_history.
     * 2. Automatically updates/recalculates next predicted replenishment date for each purchased product.
     */
    @Transactional
    public void onOrderDelivered(Order order) {
        User user = order.getUser();
        LocalDateTime now = LocalDateTime.now();

        for (OrderItem item : order.getItems()) {
            PurchaseHistory history = PurchaseHistory.builder()
                    .user(user)
                    .product(item.getProduct())
                    .order(order)
                    .quantity(item.getQuantity())
                    .amount(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .purchaseDate(now)
                    .build();
            purchaseHistoryRepository.save(history);

            updatePredictionForProduct(user, item.getProduct());
        }
    }

    private void updatePredictionForProduct(User user, Product product) {
        List<PurchaseHistory> history = purchaseHistoryRepository.findAllByUserIdOrderByPurchaseDateAsc(user.getId())
                .stream()
                .filter(ph -> ph.getProduct().getId().equals(product.getId()))
                .toList();

        long cycleDays;
        if (history.size() >= 2) {
            long totalDays = 0;
            for (int i = 0; i < history.size() - 1; i++) {
                LocalDate d1 = history.get(i).getPurchaseDate().toLocalDate();
                LocalDate d2 = history.get(i + 1).getPurchaseDate().toLocalDate();
                totalDays += ChronoUnit.DAYS.between(d1, d2);
            }
            double avg = (double) totalDays / (history.size() - 1);
            cycleDays = Math.max(1, Math.round(avg));
        } else {
            cycleDays = getDefaultCycleDays(product);
        }

        LocalDate nextDate = LocalDate.now().plusDays(cycleDays);

        AiPrediction prediction = aiPredictionRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElse(AiPrediction.builder()
                        .user(user)
                        .product(product)
                        .type(AiPrediction.PredictionType.REPLENISHMENT)
                        .build());

        prediction.setPredictedNextDate(nextDate);
        prediction.setConfidence(BigDecimal.valueOf(0.85));
        aiPredictionRepository.save(prediction);
    }

    private List<AiPredictionDto> calculateAndSaveEmbeddedPredictions(User user, Map<Long, List<PurchaseHistory>> byProduct) {
        List<AiPrediction> predictions = new ArrayList<>();

        for (Map.Entry<Long, List<PurchaseHistory>> entry : byProduct.entrySet()) {
            List<PurchaseHistory> purchases = entry.getValue();
            if (purchases.isEmpty()) continue;

            Product product = purchases.get(0).getProduct();
            LocalDate lastPurchaseDate = purchases.get(purchases.size() - 1).getPurchaseDate().toLocalDate();

            long cycleDays;
            if (purchases.size() >= 2) {
                long totalDays = 0;
                for (int i = 0; i < purchases.size() - 1; i++) {
                    LocalDate d1 = purchases.get(i).getPurchaseDate().toLocalDate();
                    LocalDate d2 = purchases.get(i + 1).getPurchaseDate().toLocalDate();
                    totalDays += ChronoUnit.DAYS.between(d1, d2);
                }
                double avg = (double) totalDays / (purchases.size() - 1);
                cycleDays = Math.max(1, Math.round(avg));
            } else {
                cycleDays = getDefaultCycleDays(product);
            }

            LocalDate nextDate = lastPurchaseDate.plusDays(cycleDays);

            predictions.add(AiPrediction.builder()
                    .user(user)
                    .product(product)
                    .predictedNextDate(nextDate)
                    .confidence(BigDecimal.valueOf(0.85))
                    .type(AiPrediction.PredictionType.REPLENISHMENT)
                    .build());
        }

        aiPredictionRepository.deleteAllByUserId(user.getId());
        aiPredictionRepository.saveAll(predictions);
        return predictions.stream().map(this::toDto).toList();
    }

    private long getDefaultCycleDays(Product product) {
        if (product == null || product.getName() == null) return 7;
        String name = product.getName().toLowerCase();
        if (name.contains("rau") || name.contains("cải") || name.contains("cà chua") || name.contains("hành")) {
            return 3;
        }
        if (name.contains("thịt") || name.contains("cá") || name.contains("trứng")) {
            return 5;
        }
        if (name.contains("sữa") || name.contains("nước")) {
            return 7;
        }
        if (name.contains("gạo") || name.contains("dầu") || name.contains("mắm") || name.contains("muối") || name.contains("đường")) {
            return 14;
        }
        return 7;
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
