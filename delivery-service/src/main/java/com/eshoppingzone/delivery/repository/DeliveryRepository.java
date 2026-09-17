package com.eshoppingzone.delivery.repository;

import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.delivery.entity.Delivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByOrderId(Long orderId);

    Optional<Delivery> findByTrackingNumber(String trackingNumber);

    Page<Delivery> findByDeliveryAgentId(Long deliveryAgentId, Pageable pageable);

    Page<Delivery> findByStatus(DeliveryStatus status, Pageable pageable);
}
