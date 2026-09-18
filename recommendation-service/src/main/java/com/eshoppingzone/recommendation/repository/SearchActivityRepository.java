package com.eshoppingzone.recommendation.repository;

import com.eshoppingzone.recommendation.entity.SearchActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SearchActivityRepository extends JpaRepository<SearchActivity, Long> {

    @Query("SELECT sa.productId, COUNT(sa.id) as cnt FROM SearchActivity sa " +
           "WHERE sa.productId IS NOT NULL AND sa.searchedAt >= :since " +
           "GROUP BY sa.productId HAVING COUNT(sa.id) >= :minCount ORDER BY cnt DESC")
    List<Object[]> findMostSearchedSince(@Param("since") Instant since, @Param("minCount") Long minCount, Pageable pageable);

    @Query("SELECT sa.keyword, COUNT(sa.id) FROM SearchActivity sa " +
           "WHERE sa.searchedAt >= :since GROUP BY sa.keyword ORDER BY COUNT(sa.id) DESC")
    List<Object[]> findTopKeywordsSince(@Param("since") Instant since, Pageable pageable);
}
