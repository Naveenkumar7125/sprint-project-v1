package com.eshoppingzone.review.repository;

import com.eshoppingzone.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByProductIdAndCustomerId(Long productId, Long customerId);

    Page<Review> findByProductId(Long productId, Pageable pageable);

    Page<Review> findByCustomerId(Long customerId, Pageable pageable);

    List<Review> findTop5ByProductIdOrderByCreatedAtDesc(Long productId);

    Long countByProductId(Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double calculateAverageRatingByProductId(@Param("productId") Long productId);
}
