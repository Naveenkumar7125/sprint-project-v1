package com.eshoppingzone.recommendation.repository;

import com.eshoppingzone.recommendation.entity.ProductStatistics;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductStatisticsRepository extends JpaRepository<ProductStatistics, Long> {

    Optional<ProductStatistics> findByProductId(Long productId);

    List<ProductStatistics> findByProductIdIn(List<Long> productIds);

    @Query("SELECT ps FROM ProductStatistics ps WHERE ps.searchCount >= :minSearch ORDER BY ps.searchCount DESC")
    List<ProductStatistics> findMostSearched(@Param("minSearch") Long minSearch, Pageable pageable);

    @Query("SELECT ps FROM ProductStatistics ps WHERE ps.purchaseCount > 0 ORDER BY ps.purchaseCount DESC")
    List<ProductStatistics> findMostPurchased(Pageable pageable);

    @Query("SELECT ps FROM ProductStatistics ps WHERE ps.ratingCount >= :minRatingCount ORDER BY ps.averageRating DESC, ps.ratingCount DESC")
    List<ProductStatistics> findTopRated(@Param("minRatingCount") Long minRatingCount, Pageable pageable);

    @Query("SELECT ps FROM ProductStatistics ps ORDER BY ps.popularityScore DESC")
    List<ProductStatistics> findTrending(Pageable pageable);
}
