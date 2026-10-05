package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.dto.UpdateProfileRequest;
import com.grocery.grocery_backend.model.dto.UpdateUserStatusRequest;
import com.grocery.grocery_backend.model.dto.UserProfileDto;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(UserProfileDto.from(getCurrentUser(authentication)));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest updateProfileRequest) {
        User user = getCurrentUser(authentication);
        user.setFullName(updateProfileRequest.getFullName());
        user.setPhone(normalizeBlank(updateProfileRequest.getPhone()));
        user.setAddress(normalizeBlank(updateProfileRequest.getAddress()));

        return ResponseEntity.ok(UserProfileDto.from(userRepository.save(user)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileDto>> getAllUsers() {
        List<UserProfileDto> users = userRepository.findAll().stream()
                .map(UserProfileDto::from)
                .toList();

        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDto> disableUser(
            Authentication authentication,
            @PathVariable Long id) {
        User user = setEnabled(authentication, id, false);
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDto> updateUserStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        User user = setEnabled(authentication, id, request.getEnabled());
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    private User setEnabled(Authentication authentication, Long id, boolean enabled) {
        User currentAdmin = getCurrentUser(authentication);
        if (currentAdmin.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change your own account status");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(enabled);
        return userRepository.save(user);
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
