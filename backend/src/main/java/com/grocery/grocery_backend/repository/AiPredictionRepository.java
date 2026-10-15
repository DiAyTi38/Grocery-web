package com.grocery.grocery_backend.repository;

import com.grocery.grocery_backend.model.entity.AiPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiPredictionRepository extends JpaRepository<AiPrediction, Long> {

    @Query("""
            SELECT ap FROM AiPrediction ap
            JOIN FETCH ap.product p
            WHERE ap.user.id = :userId AND p.active = TRUE
            ORDER BY ap.confidence DESC
            """)
    List<AiPrediction> findAllByUserIdOrderByConfidenceDesc(Long userId);

    Optional<AiPrediction> findByUserIdAndProductId(Long userId, Long productId);

    @Modifying
    @Query("DELETE FROM AiPrediction ap WHERE ap.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
