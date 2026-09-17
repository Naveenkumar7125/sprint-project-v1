package com.eshoppingzone.payment.repository;

import com.eshoppingzone.payment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    Optional<Refund> findByRefundReference(String refundReference);

    List<Refund> findByOrderId(Long orderId);

    List<Refund> findByPaymentId(Long paymentId);
}
