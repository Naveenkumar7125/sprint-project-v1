package com.eshoppingzone.payment.repository;

import com.eshoppingzone.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    Optional<Payment> findByOrderId(Long orderId);

    Page<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
}
