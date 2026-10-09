package com.grocery.grocery_backend.repository;

import com.grocery.grocery_backend.model.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByLoyaltyAccountIdOrderByCreatedAtDesc(Long accountId);
}
