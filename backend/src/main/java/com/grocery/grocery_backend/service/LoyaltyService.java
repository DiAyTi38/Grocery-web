package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.LoyaltyAccountDto;
import com.grocery.grocery_backend.model.dto.LoyaltyTransactionDto;
import com.grocery.grocery_backend.model.entity.LoyaltyAccount;
import com.grocery.grocery_backend.model.entity.LoyaltyTransaction;
import com.grocery.grocery_backend.model.entity.Order;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.LoyaltyAccountRepository;
import com.grocery.grocery_backend.repository.LoyaltyTransactionRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final UserRepository userRepository;

    private static final BigDecimal SILVER_THRESHOLD = new BigDecimal("5000000"); // 5 triệu
    private static final BigDecimal GOLD_THRESHOLD = new BigDecimal("20000000"); // 20 triệu
    private static final BigDecimal POINTS_RATIO = new BigDecimal("10000"); // 10k = 1 điểm

    private static final int SILVER_BONUS = 50;
    private static final int GOLD_BONUS = 200;

    /**
     * Get or create loyalty account for current user
     */
    @Transactional
    public LoyaltyAccountDto getMyLoyaltyInfo(Authentication authentication) {
        User user = getUser(authentication.getName());
        LoyaltyAccount account = getOrCreateAccount(user);
        return toDto(account);
    }

    /**
     * Get transaction history for current user
     */
    @Transactional(readOnly = true)
    public List<LoyaltyTransactionDto> getLoyaltyTransactions(Authentication authentication) {
        User user = getUser(authentication.getName());
        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có ví điểm"));

        List<LoyaltyTransaction> transactions = loyaltyTransactionRepository.findByLoyaltyAccountIdOrderByCreatedAtDesc(account.getId());
        return transactions.stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Core logic: Calculate and add points when order is completed.
     * Triggers tier upgrade if thresholds are met.
     */
    @Transactional
    public void earnPointsFromOrder(Order order) {
        User user = order.getUser();
        LoyaltyAccount account = getOrCreateAccount(user);

        // 1. Calculate points earned (10,000 VND = 1 point)
        int earnedPoints = order.getTotalAmount().divideToIntegralValue(POINTS_RATIO).intValue();

        if (earnedPoints > 0) {
            account.setPoints(account.getPoints() + earnedPoints);
            createTransaction(account, order, earnedPoints, LoyaltyTransaction.TransactionType.EARN, 
                    "Tích điểm từ đơn hàng #" + order.getId());
        }

        // 2. Update total spend
        account.setTotalSpend(account.getTotalSpend().add(order.getTotalAmount()));

        // 3. Check for tier upgrade
        checkAndUpgradeTier(account);

        loyaltyAccountRepository.save(account);
        log.info("User {} earned {} points from order {}. New Total Spend: {}", 
                user.getUsername(), earnedPoints, order.getId(), account.getTotalSpend());
    }

    private void checkAndUpgradeTier(LoyaltyAccount account) {
        LoyaltyAccount.Tier currentTier = account.getTier();
        BigDecimal totalSpend = account.getTotalSpend();

        if (currentTier == LoyaltyAccount.Tier.MEMBER && totalSpend.compareTo(SILVER_THRESHOLD) >= 0) {
            account.setTier(LoyaltyAccount.Tier.SILVER);
            account.setPoints(account.getPoints() + SILVER_BONUS);
            createTransaction(account, null, SILVER_BONUS, LoyaltyTransaction.TransactionType.UPGRADE, 
                    "Thưởng thăng hạng Hạng Bạc (SILVER)");
            log.info("User {} upgraded to SILVER", account.getUser().getUsername());
        } 
        else if (currentTier == LoyaltyAccount.Tier.SILVER && totalSpend.compareTo(GOLD_THRESHOLD) >= 0) {
            account.setTier(LoyaltyAccount.Tier.GOLD);
            account.setPoints(account.getPoints() + GOLD_BONUS);
            createTransaction(account, null, GOLD_BONUS, LoyaltyTransaction.TransactionType.UPGRADE, 
                    "Thưởng thăng hạng Hạng Vàng (GOLD)");
            log.info("User {} upgraded to GOLD", account.getUser().getUsername());
        }
    }

    private LoyaltyAccount getOrCreateAccount(User user) {
        return loyaltyAccountRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    LoyaltyAccount newAccount = LoyaltyAccount.builder()
                            .user(user)
                            .tier(LoyaltyAccount.Tier.MEMBER)
                            .points(0)
                            .totalSpend(BigDecimal.ZERO)
                            .build();
                    return loyaltyAccountRepository.save(newAccount);
                });
    }

    private void createTransaction(LoyaltyAccount account, Order order, int points, 
                                   LoyaltyTransaction.TransactionType type, String description) {
        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
                .loyaltyAccount(account)
                .order(order)
                .points(points)
                .type(type)
                .description(description)
                .build();
        loyaltyTransactionRepository.save(transaction);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private LoyaltyAccountDto toDto(LoyaltyAccount account) {
        LoyaltyAccountDto dto = new LoyaltyAccountDto();
        dto.setTier(account.getTier().name());
        dto.setPoints(account.getPoints());
        dto.setTotalSpend(account.getTotalSpend());
        dto.setUpdatedAt(account.getUpdatedAt());
        return dto;
    }

    private LoyaltyTransactionDto toDto(LoyaltyTransaction transaction) {
        LoyaltyTransactionDto dto = new LoyaltyTransactionDto();
        dto.setId(transaction.getId());
        dto.setOrderId(transaction.getOrder() != null ? transaction.getOrder().getId() : null);
        dto.setPoints(transaction.getPoints());
        dto.setType(transaction.getType().name());
        dto.setDescription(transaction.getDescription());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}
