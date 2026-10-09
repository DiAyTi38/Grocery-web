package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.dto.LoyaltyAccountDto;
import com.grocery.grocery_backend.model.dto.LoyaltyTransactionDto;
import com.grocery.grocery_backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    /**
     * Get current user's loyalty account info (points, tier)
     * Auto-provisions an account if one doesn't exist.
     */
    @GetMapping("/me")
    public ResponseEntity<LoyaltyAccountDto> getMyLoyaltyInfo(Authentication authentication) {
        return ResponseEntity.ok(loyaltyService.getMyLoyaltyInfo(authentication));
    }

    /**
     * Get current user's loyalty transaction history
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<LoyaltyTransactionDto>> getLoyaltyTransactions(Authentication authentication) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyTransactions(authentication));
    }
}
