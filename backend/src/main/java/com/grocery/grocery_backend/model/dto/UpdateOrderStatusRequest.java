package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái đơn hàng là bắt buộc")
    private Order.OrderStatus status;
}
