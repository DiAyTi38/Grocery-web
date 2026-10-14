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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AiService {

    private static final BigDecimal EMBEDDED_CONFIDENCE = BigDecimal.valueOf(0.85);

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
    @Transactional
    public List<AiPredictionDto> refreshPredictions(Authentication authentication) {
        User user = getUser(authentication.getName());

        // Get user's purchase history grouped by product
        List<PurchaseHistory> allHistory = purchaseHistoryRepository.findAllByUserIdOrderByPurchaseDateAsc(user.getId());

        if (allHistory.isEmpty()) {
            log.info("User {} has no purchase history, returning fallback", user.getUsername());
            return getFallbackTopSelling();
        }

        // Group purchases by productId (only for currently active products)
        Map<Long, List<PurchaseHistory>> byProduct = allHistory.stream()
                .filter(ph -> ph.getProduct() != null && ph.getProduct().isActive())
                .collect(Collectors.groupingBy(ph -> ph.getProduct().getId()));

        if (byProduct.isEmpty()) {
            log.info("User {} has no active product purchase history, returning fallback", user.getUsername());
            return getFallbackTopSelling();
        }

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

                        Product product = entry.getValue().get(0).getProduct();

                        return AiSchemas.PredictionRequest.builder()
                                .userId(user.getId())
                                .productId(entry.getKey())
                                .purchases(purchases)
                                .categoryType(resolveCategoryType(product))
                                .reminderIntervalDays(resolveReminderIntervalDays(product))
                                .build();
                    })
                    .toList();

            if (!requests.isEmpty()) {
                List<AiSchemas.PredictionResponse> aiResults = aiServiceClient.predictParallel(requests);
                if (!aiResults.isEmpty()) {
                    Map<Long, AiSchemas.PredictionResponse> aiResultMap = aiResults.stream()
                            .collect(Collectors.toMap(AiSchemas.PredictionResponse::getProductId, r -> r, (a, b) -> a));

                    List<AiPrediction> predictions = new ArrayList<>();
                    for (Map.Entry<Long, List<PurchaseHistory>> entry : byProduct.entrySet()) {
                        List<PurchaseHistory> purchases = entry.getValue();
                        if (purchases.isEmpty()) continue;
                        Product product = purchases.get(0).getProduct();
                        AiSchemas.PredictionResponse aiRes = aiResultMap.get(entry.getKey());

                        if (aiRes != null) {
                            predictions.add(AiPrediction.builder()
                                    .user(user)
                                    .product(product)
                                    .predictedNextDate(aiRes.getPredictedNextDate())
                                    .confidence(BigDecimal.valueOf(aiRes.getConfidence()))
                                    .type(AiPrediction.PredictionType.REPLENISHMENT)
                                    .build());
                        } else {
                            // Product with < 2 purchases or AI failed for it -> use embedded fallback
                            LocalDate nextDate = calculateNextReplenishmentDate(product, purchases);
                            predictions.add(AiPrediction.builder()
                                    .user(user)
                                    .product(product)
                                    .predictedNextDate(nextDate)
                                    .confidence(EMBEDDED_CONFIDENCE)
                                    .type(AiPrediction.PredictionType.REPLENISHMENT)
                                    .build());
                        }
                    }

                    aiPredictionRepository.deleteAllByUserId(user.getId());
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
        List<PurchaseHistory> history = purchaseHistoryRepository
                .findAllByUserIdAndProductIdOrderByPurchaseDateAsc(user.getId(), product.getId());

        if (history.isEmpty()) return;

        // 1. Nếu Python AI đang chạy và có >= 2 lần mua, gọi Python AI để nhất quán 100% với refreshPredictions
        if (history.size() >= 2 && aiServiceClient.isHealthy()) {
            List<AiSchemas.Purchase> purchases = history.stream()
                    .map(ph -> AiSchemas.Purchase.builder()
                            .productId(ph.getProduct().getId())
                            .purchaseDate(ph.getPurchaseDate().toLocalDate())
                            .quantity(ph.getQuantity())
                            .build())
                    .toList();

            AiSchemas.PredictionRequest request = AiSchemas.PredictionRequest.builder()
                    .userId(user.getId())
                    .productId(product.getId())
                    .purchases(purchases)
                    .categoryType(resolveCategoryType(product))
                    .reminderIntervalDays(resolveReminderIntervalDays(product))
                    .build();

            Optional<AiSchemas.PredictionResponse> response = aiServiceClient.predict(request);
            if (response.isPresent()) {
                AiSchemas.PredictionResponse aiResult = response.get();
                saveOrUpdatePrediction(user, product, aiResult.getPredictedNextDate(), BigDecimal.valueOf(aiResult.getConfidence()));
                return;
            }
        }

        // 2. Fallback: Dùng Embedded Intelligent Engine chung (calculateNextReplenishmentDate)
        LocalDate nextDate = calculateNextReplenishmentDate(product, history);
        saveOrUpdatePrediction(user, product, nextDate, EMBEDDED_CONFIDENCE);
    }

    private void saveOrUpdatePrediction(User user, Product product, LocalDate nextDate, BigDecimal confidence) {
        AiPrediction prediction = aiPredictionRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElse(AiPrediction.builder()
                        .user(user)
                        .product(product)
                        .type(AiPrediction.PredictionType.REPLENISHMENT)
                        .build());

        prediction.setPredictedNextDate(nextDate);
        prediction.setConfidence(confidence);
        try {
            aiPredictionRepository.save(prediction);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn("Concurrent duplicate prediction detected for user {} and product {}, reloading to update", user.getId(), product.getId());
            AiPrediction existing = aiPredictionRepository.findByUserIdAndProductId(user.getId(), product.getId()).orElse(prediction);
            existing.setPredictedNextDate(nextDate);
            existing.setConfidence(confidence);
            aiPredictionRepository.save(existing);
        }
    }

    private List<AiPredictionDto> calculateAndSaveEmbeddedPredictions(User user, Map<Long, List<PurchaseHistory>> byProduct) {
        List<AiPrediction> predictions = new ArrayList<>();

        for (Map.Entry<Long, List<PurchaseHistory>> entry : byProduct.entrySet()) {
            List<PurchaseHistory> purchases = entry.getValue();
            if (purchases.isEmpty()) continue;

            Product product = purchases.get(0).getProduct();
            LocalDate nextDate = calculateNextReplenishmentDate(product, purchases);

            predictions.add(AiPrediction.builder()
                    .user(user)
                    .product(product)
                    .predictedNextDate(nextDate)
                    .confidence(EMBEDDED_CONFIDENCE)
                    .type(AiPrediction.PredictionType.REPLENISHMENT)
                    .build());
        }

        aiPredictionRepository.deleteAllByUserId(user.getId());
        aiPredictionRepository.saveAll(predictions);
        return predictions.stream().map(this::toDto).toList();
    }

    private LocalDate calculateNextReplenishmentDate(Product product, List<PurchaseHistory> purchases) {
        if (purchases == null || purchases.isEmpty()) {
            return LocalDate.now().plusDays(getDefaultCycleDays(product));
        }

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

        return lastPurchaseDate.plusDays(cycleDays);
    }

    private long getDefaultCycleDays(Product product) {
        return Math.round(resolveReminderIntervalDays(product));
    }

    /**
     * Resolve real categoryType and reminderIntervalDays from product's category.
     * Maps category name → (categoryType for Python AI, reminderIntervalDays).
     * Replaces hardcoded "FOOD" / 7.0 to match the training data distribution.
     */
    String resolveCategoryType(Product product) {
        if (product == null || product.getCategory() == null) return "FOOD";
        String categoryName = product.getCategory().getName().toLowerCase();
        if (categoryName.contains("sắc đẹp") || categoryName.contains("mỹ phẩm") || categoryName.contains("cosmetic") || categoryName.contains("beauty")) {
            return "COSMETIC";
        }
        if (categoryName.contains("gia dụng") || categoryName.contains("consumer")) {
            return "CONSUMER";
        }
        return "FOOD";
    }

    double resolveReminderIntervalDays(Product product) {
        if (product == null) return 7.0;
        String categoryName = product.getCategory() != null ? product.getCategory().getName().toLowerCase() : "";
        String productName = product.getName() != null ? product.getName().toLowerCase() : "";

        // 1. Sắc đẹp / Mỹ phẩm: 30 ngày (Ưu tiên kiểm tra trước để tránh "sữa rửa mặt", "sữa tắm" bị nhận nhầm thành sữa uống)
        if (categoryName.contains("sắc đẹp") || categoryName.contains("mỹ phẩm") || categoryName.contains("cosmetic") || categoryName.contains("beauty") ||
                productName.contains("kem") || productName.contains("son") || productName.contains("serum") ||
                productName.contains("rửa mặt") || productName.contains("sữa tắm") || productName.contains("dầu gội") ||
                productName.contains("tẩy trang") || productName.contains("chống nắng")) {
            return 30.0;
        }

        // 2. Rau củ quả: 3 ngày
        if (categoryName.contains("rau") || categoryName.contains("quả") ||
                productName.contains("rau") || productName.contains("cải") || productName.contains("cà chua") || productName.contains("hành")) {
            return 3.0;
        }

        // 3. Thịt - hải sản: 5 ngày
        if (categoryName.contains("thịt") || categoryName.contains("hải sản") ||
                productName.contains("thịt") || productName.contains("cá")) {
            return 5.0;
        }

        // 4. Đồ khô / Gia vị: 14 ngày
        if (categoryName.contains("đồ khô") || categoryName.contains("gia vị") ||
                productName.contains("gạo") || productName.contains("dầu") || productName.contains("mắm") ||
                productName.contains("muối") || productName.contains("đường") || productName.contains("mì") ||
                productName.contains("miến") || productName.contains("nêm") || productName.contains("nấm")) {
            return 14.0;
        }

        // 5. Sữa & trứng: 7 ngày
        if (categoryName.contains("sữa") || categoryName.contains("trứng") ||
                productName.contains("sữa") || productName.contains("trứng") || productName.contains("nước")) {
            return 7.0;
        }

        // 6. Hàng tiêu dùng / gia dụng: 21 ngày
        if (categoryName.contains("gia dụng") || categoryName.contains("consumer")) {
            return 21.0;
        }

        return 7.0;
    }

    /**
     * Fallback: Return top 5 best-selling ACTIVE products when AI is unavailable.
     * (Solution A - Problem 2: Cold Start & Inactive Product Protection)
     * Tier 1: Query top sold products that are active.
     * Tier 2 (Cold Start): Supplement with latest active products if purchase history yields < 5 products.
     */
    @Transactional(readOnly = true)
    public List<AiPredictionDto> getFallbackTopSelling() {
        List<Object[]> topProducts = purchaseHistoryRepository.findTopSellingProducts(5);
        List<AiPredictionDto> results = new ArrayList<>();
        Set<Long> productIds = new HashSet<>();

        // Tier 1: Best-selling active products from purchase history
        for (Object[] row : topProducts) {
            Long productId = (Long) row[0];
            Product product = productRepository.findById(productId).orElse(null);
            if (product != null && product.isActive()) {
                results.add(buildFallbackDto(product));
                productIds.add(product.getId());
            }
        }

        // Tier 2: Cold start fallback - if fewer than 5 products, supplement with latest active products
        if (results.size() < 5) {
            List<Product> latestActive = productRepository.findTop5ByActiveTrueOrderByIdDesc();
            for (Product product : latestActive) {
                if (results.size() >= 5) break;
                if (!productIds.contains(product.getId())) {
                    results.add(buildFallbackDto(product));
                    productIds.add(product.getId());
                }
            }
        }

        return results;
    }

    private AiPredictionDto buildFallbackDto(Product product) {
        AiPredictionDto dto = new AiPredictionDto();
        dto.setProductId(product.getId());
        dto.setProductName(product.getName());
        dto.setProductImageUrl(product.getImageUrl());
        dto.setPredictedNextDate(LocalDate.now().plusDays(7));
        dto.setPredictedDays(7.0);
        dto.setConfidence(0.5); // Medium confidence for fallback
        dto.setType("RECOMMENDATION");
        return dto;
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
