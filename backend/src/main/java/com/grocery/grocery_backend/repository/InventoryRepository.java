package com.grocery.grocery_backend.repository;

import com.grocery.grocery_backend.model.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);

    @Query("""
            SELECT i FROM Inventory i
            JOIN FETCH i.product p
            JOIN FETCH p.category
            ORDER BY p.name
            """)
    List<Inventory> findAllDetailed();
}
