package com.grocery.grocery_backend.model.dto;

import com.grocery.grocery_backend.model.entity.Role;
import com.grocery.grocery_backend.model.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserProfileDto {

    private final Long id;
    private final String username;
    private final String email;
    private final String fullName;
    private final String phone;
    private final String address;
    private final Role role;
    private final boolean enabled;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static UserProfileDto from(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
