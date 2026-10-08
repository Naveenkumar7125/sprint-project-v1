package com.eshoppingzone.order.client;

import com.eshoppingzone.order.dto.PaymentDto;
import com.eshoppingzone.order.dto.PaymentInitiateRequest;
import com.eshoppingzone.order.dto.RefundDto;
import com.eshoppingzone.order.dto.RefundRequest;
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
