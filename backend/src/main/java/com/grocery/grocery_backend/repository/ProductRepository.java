package com.grocery.grocery_backend.repository;

import com.grocery.grocery_backend.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    boolean existsByCategoryId(Long categoryId);

    @Query("""
            SELECT p FROM Product p
            JOIN FETCH p.category
            LEFT JOIN FETCH p.inventory
            WHERE p.id = :id
            """)
    Optional<Product> findDetailedById(@Param("id") Long id);

    @Query("""
            SELECT p FROM Product p
            JOIN FETCH p.category
            LEFT JOIN FETCH p.inventory
            WHERE (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:q IS NULL OR :q = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:activeOnly = FALSE OR p.active = TRUE)
            ORDER BY p.name
            """)
    List<Product> search(
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            @Param("activeOnly") boolean activeOnly);
}
