package com.grocery.grocery_backend.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private AiServiceClient client;

    @BeforeEach
    void setUp() {
        client = new AiServiceClient(webClient);
    }

    @Test
    @DisplayName("predictParallel returns empty list for null or empty requests")
    void testEmptyRequests() {
        assertTrue(client.predictParallel(null).isEmpty());
        assertTrue(client.predictParallel(List.of()).isEmpty());
        verifyNoInteractions(webClient);
    }

    @Test
    @DisplayName("predictParallel successfully processes multiple requests via Flux without ForkJoinPool")
    void testPredictParallelSuccess() {
        AiSchemas.PredictionResponse res1 = new AiSchemas.PredictionResponse();
        res1.setProductId(1L);
        res1.setConfidence(0.85);
        res1.setPredictedNextDate(LocalDate.now().plusDays(3));

        when(webClient.post()
                .uri("/api/ai/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(any())
                .retrieve()
                .bodyToMono(AiSchemas.PredictionResponse.class))
                .thenReturn(Mono.just(res1));

        AiSchemas.PredictionRequest req1 = AiSchemas.PredictionRequest.builder().productId(1L).build();
        AiSchemas.PredictionRequest req2 = AiSchemas.PredictionRequest.builder().productId(2L).build();

        List<AiSchemas.PredictionResponse> results = client.predictParallel(List.of(req1, req2));

        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).getProductId());
    }

    @Test
    @DisplayName("predictParallel tolerates individual failure and returns remaining successful results")
    void testPredictParallelPartialFailure() {
        AiSchemas.PredictionResponse resSuccess = new AiSchemas.PredictionResponse();
        resSuccess.setProductId(1L);
        resSuccess.setConfidence(0.9);

        AiSchemas.PredictionRequest reqFail = AiSchemas.PredictionRequest.builder().productId(99L).build();
        AiSchemas.PredictionRequest reqSuccess = AiSchemas.PredictionRequest.builder().productId(1L).build();

        when(webClient.post()
                .uri("/api/ai/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(reqFail)
                .retrieve()
                .bodyToMono(AiSchemas.PredictionResponse.class))
                .thenReturn(Mono.error(new RuntimeException("Connection refused")));

        when(webClient.post()
                .uri("/api/ai/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(reqSuccess)
                .retrieve()
                .bodyToMono(AiSchemas.PredictionResponse.class))
                .thenReturn(Mono.just(resSuccess));

        List<AiSchemas.PredictionResponse> results = client.predictParallel(List.of(reqFail, reqSuccess));

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getProductId());
        assertEquals(0.9, results.get(0).getConfidence());
    }
}
