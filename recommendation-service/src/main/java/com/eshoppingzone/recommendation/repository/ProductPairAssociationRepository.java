package com.eshoppingzone.recommendation.repository;

import com.eshoppingzone.recommendation.entity.ProductPairAssociation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductPairAssociationRepository extends JpaRepository<ProductPairAssociation, Long> {

    Optional<ProductPairAssociation> findByProductIdAAndProductIdB(Long productIdA, Long productIdB);

    @Query("SELECT CASE WHEN ppa.productIdA = :productId THEN ppa.productIdB ELSE ppa.productIdA END as associatedId, " +
           "ppa.coPurchaseCount FROM ProductPairAssociation ppa " +
           "WHERE ppa.productIdA = :productId OR ppa.productIdB = :productId " +
           "ORDER BY ppa.coPurchaseCount DESC")
    List<Object[]> findFrequentlyPurchasedTogether(@Param("productId") Long productId, Pageable pageable);
}
