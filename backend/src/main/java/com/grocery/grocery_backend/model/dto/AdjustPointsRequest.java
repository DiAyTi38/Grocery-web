package com.grocery.grocery_backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustPointsRequest {

    @NotNull(message = "userId không được để trống")
    private Long userId;

    @NotNull(message = "Số điểm điều chỉnh không được để trống")
    private Integer points;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    private String reason;
}
