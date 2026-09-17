package com.eshoppingzone.payment.service;

import com.eshoppingzone.common.dto.payment.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

    PaymentDto createPayment(PaymentInitiateRequest request);

    PaymentDto initiatePayment(Long paymentId);

    PaymentDto confirmPayment(Long paymentId, PaymentConfirmRequest request);

    PaymentDto collectCodPayment(Long paymentId, CodCollectRequest request);

    PaymentDto getPaymentById(Long paymentId);

    PaymentDto getPaymentByOrderId(Long orderId);

    Page<PaymentDto> getMyPayments(Long customerId, Pageable pageable);

    PaymentDto cancelPayment(Long paymentId);

    RefundDto refundPayment(Long paymentId, RefundRequest request);
}
