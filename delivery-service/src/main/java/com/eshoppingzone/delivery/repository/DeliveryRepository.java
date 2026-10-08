package com.eshoppingzone.delivery.repository;

import com.eshoppingzone.delivery.enums.DeliveryStatus;
import com.eshoppingzone.delivery.entity.Delivery;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByOrderId(Long orderId);

    Optional<Delivery> findByTrackingNumber(String trackingNumber);

    Page<Delivery> findByDeliveryAgentId(Long deliveryAgentId, Pageable pageable);

    Page<Delivery> findByStatus(DeliveryStatus status, Pageable pageable);

    Page<Delivery> findByMerchantId(Long merchantId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Delivery d WHERE d.id = :id")
    Optional<Delivery> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT d FROM Delivery d WHERE d.status = 'AVAILABLE' AND d.deliveryAgentId IS NULL")
    Page<Delivery> findAvailableDeliveries(Pageable pageable);

    long countByStatus(DeliveryStatus status);

    long countByStatusIn(Collection<DeliveryStatus> statuses);
}

