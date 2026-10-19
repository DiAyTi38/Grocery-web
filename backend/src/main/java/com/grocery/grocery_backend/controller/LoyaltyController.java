package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.dto.AdminLoyaltyAccountDto;
import com.grocery.grocery_backend.model.dto.AdjustPointsRequest;
import com.grocery.grocery_backend.model.dto.LoyaltyAccountDto;
import com.grocery.grocery_backend.model.dto.LoyaltyTransactionDto;
import com.grocery.grocery_backend.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    /**
     * Admin: Get all users' loyalty accounts
     */
    @GetMapping("/admin/accounts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminLoyaltyAccountDto>> getAllAccountsForAdmin() {
        return ResponseEntity.ok(loyaltyService.getAllLoyaltyAccountsForAdmin());
    }

    /**
     * Admin: Adjust loyalty points for a user
     */
    @PostMapping("/admin/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminLoyaltyAccountDto> adjustPoints(
            @Valid @RequestBody AdjustPointsRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(loyaltyService.adjustPoints(request, authentication.getName()));
    }

    /**
     * Admin: Get transaction history for a specific user
     */
    @GetMapping("/admin/transactions/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoyaltyTransactionDto>> getUserTransactionsForAdmin(@PathVariable Long userId) {
        return ResponseEntity.ok(loyaltyService.getUserTransactionsForAdmin(userId));
    }
}
