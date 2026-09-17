package com.eshoppingzone.payment.controller;

import com.eshoppingzone.common.dto.payment.*;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments & Refunds", description = "Endpoints for payment initiation, wallet debits, COD collection, and refunds")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(summary = "Initiate and process a payment (WALLET or COD)")
    public ResponseEntity<PaymentDto> createPayment(@Valid @RequestBody PaymentInitiateRequest request) {
        PaymentDto payment = paymentService.createPayment(request);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    @PostMapping("/{paymentId}/initiate")
    @Operation(summary = "Initiate payment attempt")
    public ResponseEntity<PaymentDto> initiatePayment(@PathVariable Long paymentId) {
        PaymentDto payment = paymentService.initiatePayment(paymentId);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{paymentId}/confirm")
    @Operation(summary = "Confirm payment transaction")
    public ResponseEntity<PaymentDto> confirmPayment(@PathVariable Long paymentId,
                                                      @RequestBody PaymentConfirmRequest request) {
        PaymentDto payment = paymentService.confirmPayment(paymentId, request);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{paymentId}/cod/collect")
    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Confirm Cash On Delivery collection upon shipment delivery (DELIVERY_AGENT / ADMIN)")
    public ResponseEntity<PaymentDto> collectCodPayment(@PathVariable Long paymentId,
                                                         @Valid @RequestBody CodCollectRequest request) {
        PaymentDto payment = paymentService.collectCodPayment(paymentId, request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment details by payment ID")
    public ResponseEntity<PaymentDto> getPaymentById(@PathVariable Long paymentId) {
        PaymentDto payment = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment details by order ID")
    public ResponseEntity<PaymentDto> getPaymentByOrderId(@PathVariable Long orderId) {
        PaymentDto payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get current customer's payment history")
    public ResponseEntity<Page<PaymentDto>> getMyPayments(@PageableDefault(size = 20) Pageable pageable) {
        Long customerId = SecurityUtils.getCurrentUserId();
        Page<PaymentDto> payments = paymentService.getMyPayments(customerId, pageable);
        return ResponseEntity.ok(payments);
    }

    @PostMapping("/{paymentId}/cancel")
    @Operation(summary = "Cancel a pending payment")
    public ResponseEntity<PaymentDto> cancelPayment(@PathVariable Long paymentId) {
        PaymentDto payment = paymentService.cancelPayment(paymentId);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Refund a successful payment (Admin-to-Customer atomic wallet transfer / Saga Compensation)")
    public ResponseEntity<RefundDto> refundPayment(@PathVariable Long paymentId,
                                                   @Valid @RequestBody RefundRequest request) {
        RefundDto refund = paymentService.refundPayment(paymentId, request);
        return ResponseEntity.ok(refund);
    }
}
