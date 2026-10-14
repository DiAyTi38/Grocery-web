package com.grocery.grocery_backend.repository;

import com.grocery.grocery_backend.model.entity.PurchaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseHistoryRepository extends JpaRepository<PurchaseHistory, Long> {

    @Query("""
            SELECT ph FROM PurchaseHistory ph
            JOIN FETCH ph.product p
            JOIN FETCH p.category
            WHERE ph.user.id = :userId
            ORDER BY ph.purchaseDate ASC
            """)
    List<PurchaseHistory> findAllByUserIdOrderByPurchaseDateAsc(Long userId);

    /**
     * Optimised query: load purchase history for a SINGLE product of a user.
     * Avoids loading all products then filtering in-memory (N+1 problem).
     */
    @Query("""
            SELECT ph FROM PurchaseHistory ph
            JOIN FETCH ph.product p
            JOIN FETCH p.category
            WHERE ph.user.id = :userId AND ph.product.id = :productId
            ORDER BY ph.purchaseDate ASC
            """)
    List<PurchaseHistory> findAllByUserIdAndProductIdOrderByPurchaseDateAsc(Long userId, Long productId);

    /**
     * Fallback query: Get top N best-selling ACTIVE products by total quantity sold.
     */
    @Query(value = """
            SELECT ph.product_id, SUM(ph.quantity) AS total_qty
            FROM purchase_history ph
            INNER JOIN products p ON ph.product_id = p.id
            WHERE p.active = 1
            GROUP BY ph.product_id
            ORDER BY total_qty DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopSellingProducts(int limit);
}
