package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.payment.PaymentDto;
import com.eshoppingzone.common.dto.payment.PaymentInitiateRequest;
import com.eshoppingzone.common.dto.payment.RefundDto;
import com.eshoppingzone.common.dto.payment.RefundRequest;
import org.springframework.stereotype.Component;

@Component
public class PaymentClientFallback implements PaymentClient {
    @Override
    public PaymentDto initiatePayment(PaymentInitiateRequest request) {
        return null;
    }

    @Override
    public PaymentDto getPaymentByOrderId(Long orderId) {
        return null;
    }

    @Override
    public RefundDto refundPayment(Long paymentId, RefundRequest request) {
        return null;
    }
}
