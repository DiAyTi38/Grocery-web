package com.grocery.grocery_backend.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * HTTP Client that calls the Python FastAPI AI service.
 * Supports parallel calls via CompletableFuture.
 */
@Component
@Slf4j
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(
            @Value("${grocery.ai.service-url:http://localhost:8000}") String aiServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    /**
     * Call Python AI predict endpoint for a single product.
     * Returns Optional.empty() if AI service is down or returns error.
     */
    public Optional<AiSchemas.PredictionResponse> predict(AiSchemas.PredictionRequest request) {
        try {
            AiSchemas.PredictionResponse response = webClient.post()
                    .uri("/api/ai/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiSchemas.PredictionResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            return Optional.ofNullable(response);
        } catch (WebClientResponseException e) {
            log.warn("AI service returned error for product {}: {} - {}",
                    request.getProductId(), e.getStatusCode(), e.getResponseBodyAsString());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("AI service unreachable for product {}: {}", request.getProductId(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Call Python AI predict for MULTIPLE products in PARALLEL (CompletableFuture).
     * Each call is independent — if one fails, others still return results.
     */
    public List<AiSchemas.PredictionResponse> predictParallel(List<AiSchemas.PredictionRequest> requests) {
        List<CompletableFuture<Optional<AiSchemas.PredictionResponse>>> futures = requests.stream()
                .map(req -> CompletableFuture.supplyAsync(() -> predict(req)))
                .toList();

        // Wait for all futures to complete and collect successful results
        return futures.stream()
                .map(CompletableFuture::join)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    /**
     * Health check — returns true if Python AI service is alive.
     */
    public boolean isHealthy() {
        try {
            webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(2))
                    .block();
            return true;
        } catch (Exception e) {
            log.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
