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
            JOIN FETCH ph.product
            WHERE ph.user.id = :userId
            ORDER BY ph.purchaseDate ASC
            """)
    List<PurchaseHistory> findAllByUserIdOrderByPurchaseDateAsc(Long userId);

    /**
     * Fallback query: Get top N best-selling products by total quantity sold.
     */
    @Query(value = """
            SELECT ph.product_id, SUM(ph.quantity) AS total_qty
            FROM purchase_history ph
            GROUP BY ph.product_id
            ORDER BY total_qty DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopSellingProducts(int limit);
}
