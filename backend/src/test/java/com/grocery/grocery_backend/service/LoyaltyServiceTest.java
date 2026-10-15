package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.AdminLoyaltyAccountDto;
import com.grocery.grocery_backend.model.dto.AdjustPointsRequest;
import com.grocery.grocery_backend.model.dto.LoyaltyTransactionDto;
import com.grocery.grocery_backend.model.entity.LoyaltyAccount;
import com.grocery.grocery_backend.model.entity.LoyaltyTransaction;
import com.grocery.grocery_backend.model.entity.Role;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.LoyaltyAccountRepository;
import com.grocery.grocery_backend.repository.LoyaltyTransactionRepository;
import com.grocery.grocery_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoyaltyServiceTest {

    @Mock
    private LoyaltyAccountRepository loyaltyAccountRepository;

    @Mock
    private LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LoyaltyService loyaltyService;

    private User sampleUser;
    private LoyaltyAccount sampleAccount;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("dattran")
                .fullName("Trần Tiến Đạt")
                .email("dat@example.com")
                .phone("0987654321")
                .role(Role.ROLE_USER)
                .build();

        sampleAccount = LoyaltyAccount.builder()
                .id(10L)
                .user(sampleUser)
                .tier(LoyaltyAccount.Tier.SILVER)
                .points(150)
                .totalSpend(BigDecimal.valueOf(6500000))
                .build();
    }

    @Test
    @DisplayName("Admin: getAllLoyaltyAccountsForAdmin returns all accounts and creates default for user without account")
    void shouldReturnAllAccountsForAdmin() {
        User newUser = User.builder()
                .id(2L)
                .username("newcustomer")
                .fullName("Khách Hàng Mới")
                .email("new@example.com")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findAll()).thenReturn(List.of(sampleUser, newUser));
        when(loyaltyAccountRepository.findByUserId(1L)).thenReturn(Optional.of(sampleAccount));
        when(loyaltyAccountRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(loyaltyAccountRepository.save(any(LoyaltyAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        List<AdminLoyaltyAccountDto> result = loyaltyService.getAllLoyaltyAccountsForAdmin();

        assertThat(result).hasSize(2);

        AdminLoyaltyAccountDto dto1 = result.get(0);
        assertThat(dto1.getUsername()).isEqualTo("dattran");
        assertThat(dto1.getTier()).isEqualTo("SILVER");
        assertThat(dto1.getPoints()).isEqualTo(150);
        assertThat(dto1.getTotalSpend()).isEqualByComparingTo(BigDecimal.valueOf(6500000));

        AdminLoyaltyAccountDto dto2 = result.get(1);
        assertThat(dto2.getUsername()).isEqualTo("newcustomer");
        assertThat(dto2.getTier()).isEqualTo("MEMBER");
        assertThat(dto2.getPoints()).isEqualTo(0);
        assertThat(dto2.getTotalSpend()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Admin: adjustPoints successfully adds points and logs ADJUSTMENT transaction")
    void shouldAddPointsSuccessfully() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(loyaltyAccountRepository.findByUserId(1L)).thenReturn(Optional.of(sampleAccount));
        when(loyaltyAccountRepository.save(any(LoyaltyAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        AdjustPointsRequest request = AdjustPointsRequest.builder()
                .userId(1L)
                .points(50)
                .reason("Bồi thường CSKH do giao trễ")
                .build();

        AdminLoyaltyAccountDto result = loyaltyService.adjustPoints(request, "admin");

        assertThat(result.getPoints()).isEqualTo(200); // 150 + 50

        ArgumentCaptor<LoyaltyTransaction> captor = ArgumentCaptor.forClass(LoyaltyTransaction.class);
        verify(loyaltyTransactionRepository).save(captor.capture());
        LoyaltyTransaction tx = captor.getValue();
        assertThat(tx.getType()).isEqualTo(LoyaltyTransaction.TransactionType.ADJUSTMENT);
        assertThat(tx.getPoints()).isEqualTo(50);
        assertThat(tx.getDescription()).contains("Điều chỉnh bởi admin [admin]: Bồi thường CSKH do giao trễ");
    }

    @Test
    @DisplayName("Admin: adjustPoints with negative points does not drop below 0")
    void shouldNotDropBelowZeroPoints() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(loyaltyAccountRepository.findByUserId(1L)).thenReturn(Optional.of(sampleAccount));
        when(loyaltyAccountRepository.save(any(LoyaltyAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        AdjustPointsRequest request = AdjustPointsRequest.builder()
                .userId(1L)
                .points(-300) // Deduct 300 while current is 150
                .reason("Trừ điểm hoàn đơn")
                .build();

        AdminLoyaltyAccountDto result = loyaltyService.adjustPoints(request, "admin");

        assertThat(result.getPoints()).isEqualTo(0); // Clamped at 0
    }

    @Test
    @DisplayName("Admin: getUserTransactionsForAdmin returns transaction list for user")
    void shouldReturnUserTransactions() {
        LoyaltyTransaction tx1 = LoyaltyTransaction.builder()
                .id(101L)
                .user(sampleUser)
                .points(650)
                .type(LoyaltyTransaction.TransactionType.EARN)
                .description("Tích điểm từ đơn hàng #1")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(loyaltyTransactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(tx1));

        List<LoyaltyTransactionDto> result = loyaltyService.getUserTransactionsForAdmin(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPoints()).isEqualTo(650);
        assertThat(result.get(0).getType()).isEqualTo("EARN");
    }
}
