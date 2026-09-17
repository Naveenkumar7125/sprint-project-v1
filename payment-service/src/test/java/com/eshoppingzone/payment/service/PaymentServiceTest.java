package com.eshoppingzone.payment.service;

import com.eshoppingzone.common.dto.payment.CodCollectRequest;
import com.eshoppingzone.common.dto.payment.PaymentDto;
import com.eshoppingzone.common.dto.payment.PaymentInitiateRequest;
import com.eshoppingzone.common.dto.payment.RefundDto;
import com.eshoppingzone.common.dto.payment.RefundRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferResponse;
import com.eshoppingzone.common.enums.PaymentMethod;
import com.eshoppingzone.common.enums.PaymentStatus;
import com.eshoppingzone.common.enums.RefundStatus;
import com.eshoppingzone.common.enums.TransactionStatus;
import com.eshoppingzone.common.exception.PaymentFailedException;
import com.eshoppingzone.payment.client.WalletClient;
import com.eshoppingzone.payment.entity.Payment;
import com.eshoppingzone.payment.entity.Refund;
import com.eshoppingzone.payment.event.PaymentEventPublisher;
import com.eshoppingzone.payment.repository.PaymentRepository;
import com.eshoppingzone.payment.repository.RefundRepository;
import com.eshoppingzone.payment.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private WalletClient walletClient;

    @Mock
    private PaymentEventPublisher eventPublisher;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentServiceImpl(paymentRepository, refundRepository, walletClient, eventPublisher);
    }

    @Test
    @DisplayName("Create Wallet payment succeeds and marks payment SUCCESS")
    void createPayment_Wallet_Success() {
        PaymentInitiateRequest request = PaymentInitiateRequest.builder()
                .orderId(1001L)
                .customerId(100L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod(PaymentMethod.WALLET)
                .build();

        Payment payment = Payment.builder()
                .id(1L)
                .paymentReference("PAY-1001-12345")
                .orderId(1001L)
                .customerId(100L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod(PaymentMethod.WALLET)
                .status(PaymentStatus.INITIATED)
                .build();

        InternalWalletTransferResponse transferResponse = InternalWalletTransferResponse.builder()
                .successful(true)
                .status(TransactionStatus.SUCCESS)
                .build();

        when(paymentRepository.findByOrderId(1001L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(walletClient.transferCustomerToAdmin(any(InternalWalletTransferRequest.class))).thenReturn(transferResponse);

        PaymentDto result = paymentService.createPayment(request);

        assertNotNull(result);
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(eventPublisher, times(1)).publishPaymentSuccess(any());
    }

    @Test
    @DisplayName("Create Wallet payment with insufficient balance fails and publishes PaymentFailedEvent")
    void createPayment_Wallet_InsufficientBalance_ThrowsException() {
        PaymentInitiateRequest request = PaymentInitiateRequest.builder()
                .orderId(1002L)
                .customerId(100L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod(PaymentMethod.WALLET)
                .build();

        Payment payment = Payment.builder()
                .id(2L)
                .paymentReference("PAY-1002-12345")
                .orderId(1002L)
                .customerId(100L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod(PaymentMethod.WALLET)
                .status(PaymentStatus.INITIATED)
                .build();

        when(paymentRepository.findByOrderId(1002L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(walletClient.transferCustomerToAdmin(any())).thenThrow(new PaymentFailedException("Insufficient funds"));

        assertThrows(PaymentFailedException.class, () -> paymentService.createPayment(request));

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(eventPublisher, times(1)).publishPaymentFailed(any());
    }

    @Test
    @DisplayName("Create COD payment marks status PENDING without debiting wallet")
    void createPayment_COD_Success() {
        PaymentInitiateRequest request = PaymentInitiateRequest.builder()
                .orderId(1003L)
                .customerId(100L)
                .amount(new BigDecimal("1500.00"))
                .paymentMethod(PaymentMethod.COD)
                .build();

        Payment payment = Payment.builder()
                .id(3L)
                .paymentReference("PAY-1003-12345")
                .orderId(1003L)
                .customerId(100L)
                .amount(new BigDecimal("1500.00"))
                .paymentMethod(PaymentMethod.COD)
                .status(PaymentStatus.PENDING)
                .build();

        when(paymentRepository.findByOrderId(1003L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        PaymentDto result = paymentService.createPayment(request);

        assertNotNull(result);
        assertEquals(PaymentStatus.PENDING, result.getStatus());
        verify(walletClient, never()).transferCustomerToAdmin(any());
        verify(eventPublisher, times(1)).publishPaymentInitiated(any());
    }

    @Test
    @DisplayName("COD cash collection confirms payment to SUCCESS and publishes event")
    void collectCodPayment_Success() {
        Payment payment = Payment.builder()
                .id(3L)
                .paymentReference("PAY-1003-12345")
                .orderId(1003L)
                .customerId(100L)
                .amount(new BigDecimal("1500.00"))
                .paymentMethod(PaymentMethod.COD)
                .status(PaymentStatus.PENDING)
                .build();

        CodCollectRequest request = CodCollectRequest.builder()
                .collectedAmount(new BigDecimal("1500.00"))
                .receiptNumber("REC-98765")
                .build();

        when(paymentRepository.findById(3L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        PaymentDto result = paymentService.collectCodPayment(3L, request);

        assertNotNull(result);
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(eventPublisher, times(1)).publishPaymentSuccess(any());
    }

    @Test
    @DisplayName("Refund payment triggers wallet refund and marks payment REFUNDED")
    void refundPayment_Success() {
        Payment payment = Payment.builder()
                .id(1L)
                .paymentReference("PAY-1001-12345")
                .orderId(1001L)
                .customerId(100L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod(PaymentMethod.WALLET)
                .status(PaymentStatus.SUCCESS)
                .build();

        RefundRequest request = RefundRequest.builder()
                .amount(new BigDecimal("2500.00"))
                .reason("Customer cancelled order")
                .build();

        InternalWalletTransferResponse refundResponse = InternalWalletTransferResponse.builder()
                .successful(true)
                .status(TransactionStatus.SUCCESS)
                .build();

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));
        when(refundRepository.findByRefundReference(any())).thenReturn(Optional.empty());
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
        when(walletClient.transferAdminToCustomer(any())).thenReturn(refundResponse);

        RefundDto result = paymentService.refundPayment(1L, request);

        assertNotNull(result);
        assertEquals(RefundStatus.SUCCESS, result.getStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(eventPublisher, times(1)).publishRefundCompleted(any());
    }
}
