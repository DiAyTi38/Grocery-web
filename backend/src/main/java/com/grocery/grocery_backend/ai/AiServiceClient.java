package com.grocery.grocery_backend.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * HTTP Client that calls the Python FastAPI AI service.
 * Supports parallel calls via Reactive WebClient Flux.
 */
@Component
@Slf4j
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(
            @Value("${grocery.ai.service-url:http://localhost:8000}") String aiServiceUrl) {
        this(WebClient.builder().baseUrl(aiServiceUrl).build());
    }

    public AiServiceClient(WebClient webClient) {
        this.webClient = webClient;
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
     * Call Python AI predict for MULTIPLE products in PARALLEL via Non-blocking Reactive Flux.
     * Replaces ForkJoinPool.commonPool() to prevent Thread Starvation across the JVM.
     * Utilizes Netty's event-loop I/O multiplexing with a concurrency throttle (max 8 concurrent requests).
     * If an individual product prediction fails or times out, it is gracefully logged and omitted,
     * allowing remaining successful product predictions to be returned.
     */
    public List<AiSchemas.PredictionResponse> predictParallel(List<AiSchemas.PredictionRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        return Flux.fromIterable(requests)
                .flatMap(req -> webClient.post()
                                .uri("/api/ai/predict")
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(req)
                                .retrieve()
                                .bodyToMono(AiSchemas.PredictionResponse.class)
                                .timeout(Duration.ofSeconds(5))
                                .onErrorResume(WebClientResponseException.class, e -> {
                                    log.warn("AI service returned error for product {}: {} - {}",
                                            req.getProductId(), e.getStatusCode(), e.getResponseBodyAsString());
                                    return Mono.empty();
                                })
                                .onErrorResume(Exception.class, e -> {
                                    log.warn("AI service unreachable for product {}: {}", req.getProductId(), e.getMessage());
                                    return Mono.empty();
                                }),
                        8 // Concurrency limit: max 8 concurrent requests to avoid overwhelming Python AI
                )
                .collectList()
                .blockOptional(Duration.ofSeconds(10))
                .orElseGet(List::of);
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
