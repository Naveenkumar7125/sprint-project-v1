package com.eshoppingzone.shipping.repository;

import com.eshoppingzone.shipping.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByShipmentReference(String shipmentReference);

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    List<Shipment> findByOrderId(Long orderId);

    List<Shipment> findByOrderNumber(String orderNumber);

    Page<Shipment> findByMerchantId(Long merchantId, Pageable pageable);
}
