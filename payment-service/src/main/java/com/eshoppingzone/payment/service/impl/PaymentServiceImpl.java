package com.eshoppingzone.payment.service.impl;

import com.eshoppingzone.common.dto.payment.*;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferResponse;
import com.eshoppingzone.common.enums.PaymentMethod;
import com.eshoppingzone.common.enums.PaymentStatus;
import com.eshoppingzone.common.enums.RefundStatus;
import com.eshoppingzone.common.event.PaymentFailedEvent;
import com.eshoppingzone.common.event.PaymentInitiatedEvent;
import com.eshoppingzone.common.event.PaymentSuccessEvent;
import com.eshoppingzone.common.event.RefundCompletedEvent;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ConflictException;
import com.eshoppingzone.common.exception.PaymentFailedException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.payment.client.WalletClient;
import com.eshoppingzone.payment.entity.Payment;
import com.eshoppingzone.payment.entity.Refund;
import com.eshoppingzone.payment.event.PaymentEventPublisher;
import com.eshoppingzone.payment.repository.PaymentRepository;
import com.eshoppingzone.payment.repository.RefundRepository;
import com.eshoppingzone.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final WalletClient walletClient;
    private final PaymentEventPublisher eventPublisher;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              RefundRepository refundRepository,
                              WalletClient walletClient,
                              PaymentEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.walletClient = walletClient;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public PaymentDto createPayment(PaymentInitiateRequest request) {
        log.info("Creating payment for orderId: {}, method: {}, amount: {}", request.getOrderId(), request.getPaymentMethod(), request.getAmount());

        Optional<Payment> existingOpt = paymentRepository.findByOrderId(request.getOrderId());
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() == PaymentStatus.SUCCESS) {
                return mapToDto(existing);
            }
        }

        String paymentRef = "PAY-" + request.getOrderId() + "-" + System.currentTimeMillis();
        Payment payment = Payment.builder()
                .paymentReference(paymentRef)
                .orderId(request.getOrderId())
                .customerId(request.getCustomerId())
                .amount(request.getAmount())
                .currency("INR")
                .paymentMethod(request.getPaymentMethod())
                .status(request.getPaymentMethod() == PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.INITIATED)
                .build();

        Payment saved = paymentRepository.save(payment);

        if (request.getPaymentMethod() == PaymentMethod.WALLET) {
            try {
                InternalWalletTransferRequest transferRequest = InternalWalletTransferRequest.builder()
                        .customerUserId(request.getCustomerId())
                        .amount(request.getAmount())
                        .transactionReference("ORDER-" + request.getOrderId())
                        .orderId(request.getOrderId())
                        .description("Payment for order #" + request.getOrderId())
                        .build();

                InternalWalletTransferResponse transferResponse = walletClient.transferCustomerToAdmin(transferRequest);

                if (transferResponse != null && transferResponse.isSuccessful()) {
                    saved.setStatus(PaymentStatus.SUCCESS);
                    Payment finalPayment = paymentRepository.save(saved);

                    eventPublisher.publishPaymentSuccess(PaymentSuccessEvent.builder()
                            .paymentId(finalPayment.getId())
                            .paymentReference(finalPayment.getPaymentReference())
                            .orderId(finalPayment.getOrderId())
                            .customerId(finalPayment.getCustomerId())
                            .amount(finalPayment.getAmount())
                            .paymentMethod(PaymentMethod.WALLET)
                            .build());

                    return mapToDto(finalPayment);
                } else {
                    saved.setStatus(PaymentStatus.FAILED);
                    saved.setFailureReason("Wallet transfer failed");
                    paymentRepository.save(saved);

                    eventPublisher.publishPaymentFailed(PaymentFailedEvent.builder()
                            .paymentId(saved.getId())
                            .paymentReference(saved.getPaymentReference())
                            .orderId(saved.getOrderId())
                            .customerId(saved.getCustomerId())
                            .amount(saved.getAmount())
                            .paymentMethod(PaymentMethod.WALLET)
                            .failureReason("Wallet transfer failed")
                            .build());

                    throw new PaymentFailedException("Wallet transfer failed");
                }
            } catch (Exception ex) {
                saved.setStatus(PaymentStatus.FAILED);
                saved.setFailureReason(ex.getMessage());
                paymentRepository.save(saved);

                eventPublisher.publishPaymentFailed(PaymentFailedEvent.builder()
                        .paymentId(saved.getId())
                        .paymentReference(saved.getPaymentReference())
                        .orderId(saved.getOrderId())
                        .customerId(saved.getCustomerId())
                        .amount(saved.getAmount())
                        .paymentMethod(PaymentMethod.WALLET)
                        .failureReason(ex.getMessage())
                        .build());

                throw new PaymentFailedException("Payment failed: " + ex.getMessage());
            }
        } else {
            // COD: Payment is PENDING until delivery cash collection
            eventPublisher.publishPaymentInitiated(PaymentInitiatedEvent.builder()
                    .paymentId(saved.getId())
                    .paymentReference(saved.getPaymentReference())
                    .orderId(saved.getOrderId())
                    .customerId(saved.getCustomerId())
                    .amount(saved.getAmount())
                    .paymentMethod(PaymentMethod.COD)
                    .build());

            return mapToDto(saved);
        }
    }

    @Override
    public PaymentDto initiatePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        return mapToDto(payment);
    }

    @Override
    public PaymentDto confirmPayment(Long paymentId, PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return mapToDto(payment);
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        Payment saved = paymentRepository.save(payment);

        eventPublisher.publishPaymentSuccess(PaymentSuccessEvent.builder()
                .paymentId(saved.getId())
                .paymentReference(saved.getPaymentReference())
                .orderId(saved.getOrderId())
                .customerId(saved.getCustomerId())
                .amount(saved.getAmount())
                .paymentMethod(saved.getPaymentMethod())
                .build());

        return mapToDto(saved);
    }

    @Override
    public PaymentDto collectCodPayment(Long paymentId, CodCollectRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getPaymentMethod() != PaymentMethod.COD) {
            throw new BadRequestException("Only Cash on Delivery payments can be collected via COD endpoint");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("COD payment {} already marked as collected/SUCCESS", paymentId);
            return mapToDto(payment);
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        Payment saved = paymentRepository.save(payment);
        log.info("COD collection confirmed for paymentId: {}, orderId: {}, amount: {}", paymentId, saved.getOrderId(), request.getCollectedAmount());

        eventPublisher.publishPaymentSuccess(PaymentSuccessEvent.builder()
                .paymentId(saved.getId())
                .paymentReference(saved.getPaymentReference())
                .orderId(saved.getOrderId())
                .customerId(saved.getCustomerId())
                .amount(saved.getAmount())
                .paymentMethod(PaymentMethod.COD)
                .build());

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        return mapToDto(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDto getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for orderId: " + orderId));
        return mapToDto(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDto> getMyPayments(Long customerId, Pageable pageable) {
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable).map(this::mapToDto);
    }

    @Override
    public PaymentDto cancelPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Cannot directly cancel a successful payment. Use refund instead.");
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        Payment saved = paymentRepository.save(payment);
        return mapToDto(saved);
    }

    @Override
    public RefundDto refundPayment(Long paymentId, RefundRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS && payment.getStatus() != PaymentStatus.REFUND_PENDING) {
            throw new BadRequestException("Only successful payments can be refunded. Current status: " + payment.getStatus());
        }

        String refundRef = "REFUND-" + payment.getId() + "-" + payment.getOrderId();
        Optional<Refund> existingRefund = refundRepository.findByRefundReference(refundRef);
        if (existingRefund.isPresent() && existingRefund.get().getStatus() == RefundStatus.SUCCESS) {
            log.info("Duplicate refund request detected for reference: {}. Returning existing record.", refundRef);
            return mapToRefundDto(existingRefund.get());
        }

        Refund refund = existingRefund.orElseGet(() -> Refund.builder()
                .refundReference(refundRef)
                .payment(payment)
                .orderId(payment.getOrderId())
                .customerId(payment.getCustomerId())
                .amount(request.getAmount())
                .status(RefundStatus.INITIATED)
                .reason(request.getReason())
                .build());

        refund = refundRepository.save(refund);

        if (payment.getPaymentMethod() == PaymentMethod.WALLET) {
            // Orchestrate Admin-to-Customer transfer
            InternalWalletTransferRequest transferRequest = InternalWalletTransferRequest.builder()
                    .customerUserId(payment.getCustomerId())
                    .amount(request.getAmount())
                    .transactionReference("REFUND-" + payment.getOrderId())
                    .orderId(payment.getOrderId())
                    .description("Refund for order #" + payment.getOrderId())
                    .build();

            InternalWalletTransferResponse transferResponse = walletClient.transferAdminToCustomer(transferRequest);

            if (transferResponse != null && transferResponse.isSuccessful()) {
                refund.setStatus(RefundStatus.SUCCESS);
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
                Refund savedRefund = refundRepository.save(refund);

                eventPublisher.publishRefundCompleted(RefundCompletedEvent.builder()
                        .refundId(savedRefund.getId())
                        .refundReference(savedRefund.getRefundReference())
                        .paymentId(payment.getId())
                        .orderId(payment.getOrderId())
                        .customerId(payment.getCustomerId())
                        .amount(savedRefund.getAmount())
                        .build());

                log.info("Refund SUCCESS for paymentId: {}, orderId: {}, amount: {}", paymentId, payment.getOrderId(), request.getAmount());
                return mapToRefundDto(savedRefund);
            } else {
                refund.setStatus(RefundStatus.FAILED);
                refundRepository.save(refund);
                throw new PaymentFailedException("Wallet refund transfer failed");
            }
        } else {
            // COD Refund: marked as SUCCESS for manual delivery cash return/credit
            refund.setStatus(RefundStatus.SUCCESS);
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            Refund savedRefund = refundRepository.save(refund);

            eventPublisher.publishRefundCompleted(RefundCompletedEvent.builder()
                    .refundId(savedRefund.getId())
                    .refundReference(savedRefund.getRefundReference())
                    .paymentId(payment.getId())
                    .orderId(payment.getOrderId())
                    .customerId(payment.getCustomerId())
                    .amount(savedRefund.getAmount())
                    .build());

            return mapToRefundDto(savedRefund);
        }
    }

    private PaymentDto mapToDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .paymentReference(payment.getPaymentReference())
                .orderId(payment.getOrderId())
                .customerId(payment.getCustomerId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .failureReason(payment.getFailureReason())
                .version(payment.getVersion())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private RefundDto mapToRefundDto(Refund refund) {
        return RefundDto.builder()
                .id(refund.getId())
                .refundReference(refund.getRefundReference())
                .paymentId(refund.getPayment() != null ? refund.getPayment().getId() : null)
                .orderId(refund.getOrderId())
                .customerId(refund.getCustomerId())
                .amount(refund.getAmount())
                .status(refund.getStatus())
                .reason(refund.getReason())
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt())
                .build();
    }
}
