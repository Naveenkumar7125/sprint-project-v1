package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.payment.PaymentDto;
import com.eshoppingzone.common.dto.payment.PaymentInitiateRequest;
import com.eshoppingzone.common.dto.payment.RefundDto;
import com.eshoppingzone.common.dto.payment.RefundRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service", fallback = PaymentClientFallback.class)
public interface PaymentClient {

    @PostMapping("/api/v1/payments")
    PaymentDto initiatePayment(@RequestBody PaymentInitiateRequest request);

    @GetMapping("/api/v1/payments/order/{orderId}")
    PaymentDto getPaymentByOrderId(@PathVariable("orderId") Long orderId);

    @PostMapping("/api/v1/payments/{paymentId}/refund")
    RefundDto refundPayment(@PathVariable("paymentId") Long paymentId, @RequestBody RefundRequest request);
}
