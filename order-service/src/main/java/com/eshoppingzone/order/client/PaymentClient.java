package com.eshoppingzone.order.client;

import com.eshoppingzone.order.dto.PaymentDto;
import com.eshoppingzone.order.dto.PaymentInitiateRequest;
import com.eshoppingzone.order.dto.RefundDto;
import com.eshoppingzone.order.dto.RefundRequest;
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
