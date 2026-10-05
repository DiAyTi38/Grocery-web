package com.grocery.grocery_backend.model.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Pattern(regexp = "^$|^[+0-9()\\-\\s]{8,20}$", message = "Phone is invalid")
    private String phone;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
}
