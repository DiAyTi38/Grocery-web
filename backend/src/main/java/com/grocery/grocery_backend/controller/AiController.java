package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.dto.AiPredictionDto;
import com.grocery.grocery_backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class AiController {

    private final AiService aiService;

    /**
     * Get AI recommendations for current user.
     * Returns cached predictions from DB, or fallback top-selling products.
     */
    @GetMapping("/recommendations")
    public ResponseEntity<List<AiPredictionDto>> getRecommendations(Authentication authentication) {
        return ResponseEntity.ok(aiService.getRecommendations(authentication));
    }

    /**
     * Trigger a fresh prediction from Python AI service.
     * Calls Python in parallel for all products user has purchased.
     * Falls back to top-selling if AI is unavailable.
     */
    @PostMapping("/refresh")
    public ResponseEntity<List<AiPredictionDto>> refreshPredictions(Authentication authentication) {
        return ResponseEntity.ok(aiService.refreshPredictions(authentication));
    }

    /**
     * Check if Python AI service is alive.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> aiHealth() {
        boolean healthy = aiService.healthCheck();
        return ResponseEntity.ok(Map.of(
                "aiServiceStatus", healthy ? "UP" : "DOWN",
                "fallbackAvailable", true
        ));
    }
}
