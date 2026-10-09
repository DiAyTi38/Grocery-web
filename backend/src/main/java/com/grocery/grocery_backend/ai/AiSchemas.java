package com.grocery.grocery_backend.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTOs that mirror the Python AI FastAPI schemas exactly.
 */
public class AiSchemas {

    @Data
    @Builder
    public static class Purchase {
        @JsonProperty("product_id")
        private Long productId;

        @JsonProperty("purchase_date")
        private LocalDate purchaseDate;

        private Integer quantity;
    }

    @Data
    @Builder
    public static class PredictionRequest {
        @JsonProperty("user_id")
        private Long userId;

        @JsonProperty("product_id")
        private Long productId;

        private List<Purchase> purchases;

        @JsonProperty("category_type")
        @Builder.Default
        private String categoryType = "FOOD";

        @JsonProperty("reminder_interval_days")
        @Builder.Default
        private Double reminderIntervalDays = 7.0;
    }

    @Data
    public static class PredictionResponse {
        @JsonProperty("user_id")
        private Long userId;

        @JsonProperty("product_id")
        private Long productId;

        @JsonProperty("predicted_next_date")
        private LocalDate predictedNextDate;

        @JsonProperty("predicted_days")
        private Double predictedDays;

        private Double confidence;
        private String type;
    }
}
