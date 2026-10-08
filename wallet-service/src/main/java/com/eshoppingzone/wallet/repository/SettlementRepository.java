package com.eshoppingzone.wallet.repository;

import com.eshoppingzone.wallet.entity.Settlement;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByOrderId(Long orderId);

    Optional<Settlement> findByOrderIdAndMerchantId(Long orderId, Long merchantId);

    Page<Settlement> findByMerchantIdOrderByCreatedAtDesc(Long merchantId, Pageable pageable);

    Page<Settlement> findByMerchantIdAndStatusOrderByCreatedAtDesc(Long merchantId, SettlementStatus status, Pageable pageable);

    Page<Settlement> findByStatusOrderByCreatedAtDesc(SettlementStatus status, Pageable pageable);

    Page<Settlement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.merchantAmount), 0) FROM Settlement s WHERE s.merchantId = :merchantId AND s.status IN ('AVAILABLE', 'COMPLETED')")
    BigDecimal sumTotalEarningsByMerchantId(@Param("merchantId") Long merchantId);

    @Query("SELECT COALESCE(SUM(s.merchantAmount), 0) FROM Settlement s WHERE s.merchantId = :merchantId AND s.status = 'PENDING'")
    BigDecimal sumPendingEarningsByMerchantId(@Param("merchantId") Long merchantId);

    @Query("SELECT COALESCE(SUM(s.grossAmount), 0) FROM Settlement s WHERE s.status != 'CANCELLED'")
    BigDecimal sumTotalGrossMerchandiseValue();

    @Query("SELECT COALESCE(SUM(s.platformCommission), 0) FROM Settlement s WHERE s.status != 'CANCELLED'")
    BigDecimal sumTotalPlatformCommission();

    @Query("SELECT COALESCE(SUM(s.platformCommission), 0) FROM Settlement s WHERE s.status = 'PENDING'")
    BigDecimal sumPendingPlatformCommission();

    @Query("SELECT COALESCE(SUM(s.platformCommission), 0) FROM Settlement s WHERE s.status IN ('AVAILABLE', 'COMPLETED')")
    BigDecimal sumSettledPlatformCommission();

    long countByStatus(SettlementStatus status);
}
