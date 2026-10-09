package com.grocery.grocery_backend.model.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AiPredictionDto {
    private Long productId;
    private String productName;
    private String productImageUrl;
    private LocalDate predictedNextDate;
    private Double predictedDays;
    private Double confidence;
    private String type;
}
