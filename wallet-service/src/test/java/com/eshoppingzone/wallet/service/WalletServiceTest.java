package com.eshoppingzone.wallet.service;

import com.eshoppingzone.common.dto.wallet.InternalWalletTransferRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferResponse;
import com.eshoppingzone.common.dto.wallet.WalletDto;
import com.eshoppingzone.common.dto.wallet.WalletTopUpRequest;
import com.eshoppingzone.common.enums.TransactionStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.enums.WalletStatus;
import com.eshoppingzone.common.exception.InsufficientBalanceException;
import com.eshoppingzone.wallet.entity.Wallet;
import com.eshoppingzone.wallet.entity.WalletTransaction;
import com.eshoppingzone.wallet.repository.WalletRepository;
import com.eshoppingzone.wallet.repository.WalletTransactionRepository;
import com.eshoppingzone.wallet.service.impl.WalletServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    private WalletServiceImpl walletService;

    @BeforeEach
    void setUp() {
        walletService = new WalletServiceImpl(walletRepository, transactionRepository);
    }

    @Test
    @DisplayName("Financial Rule: Customer (₹5000) & Admin (₹10000) with Order (₹2500) -> Customer ₹2500, Admin ₹12500")
    void transferCustomerToAdmin_Success() {
        Long customerId = 100L;
        BigDecimal orderAmount = new BigDecimal("2500.00");
        String txRef = "ORDER-10001";

        InternalWalletTransferRequest request = InternalWalletTransferRequest.builder()
                .customerUserId(customerId)
                .amount(orderAmount)
                .transactionReference(txRef)
                .orderId(10001L)
                .build();

        Wallet customerWallet = Wallet.builder()
                .id(1L)
                .userId(customerId)
                .role(UserRole.CUSTOMER)
                .balance(new BigDecimal("5000.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        Wallet adminWallet = Wallet.builder()
                .id(2L)
                .userId(1L)
                .role(UserRole.ADMIN)
                .balance(new BigDecimal("10000.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        when(transactionRepository.findByTransactionReference(txRef + "-CUST-DEBIT")).thenReturn(Optional.empty());
        when(walletRepository.findByUserId(customerId)).thenReturn(Optional.of(customerWallet));
        when(walletRepository.findAdminWallets()).thenReturn(List.of(adminWallet));
        when(walletRepository.save(customerWallet)).thenReturn(customerWallet);
        when(walletRepository.save(adminWallet)).thenReturn(adminWallet);

        InternalWalletTransferResponse response = walletService.transferCustomerToAdmin(request);

        assertNotNull(response);
        assertTrue(response.isSuccessful());
        assertEquals(TransactionStatus.SUCCESS, response.getStatus());
        assertEquals(new BigDecimal("2500.00"), customerWallet.getBalance());
        assertEquals(new BigDecimal("12500.00"), adminWallet.getBalance());
        verify(transactionRepository, times(2)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Financial Rule: Refund (₹2500) -> Admin ₹12500 becomes ₹10000, Customer ₹2500 becomes ₹5000")
    void transferAdminToCustomer_Refund_Success() {
        Long customerId = 100L;
        BigDecimal refundAmount = new BigDecimal("2500.00");
        String refundRef = "REFUND-10001";

        InternalWalletTransferRequest request = InternalWalletTransferRequest.builder()
                .customerUserId(customerId)
                .amount(refundAmount)
                .transactionReference(refundRef)
                .orderId(10001L)
                .build();

        Wallet adminWallet = Wallet.builder()
                .id(2L)
                .userId(1L)
                .role(UserRole.ADMIN)
                .balance(new BigDecimal("12500.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        Wallet customerWallet = Wallet.builder()
                .id(1L)
                .userId(customerId)
                .role(UserRole.CUSTOMER)
                .balance(new BigDecimal("2500.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        when(transactionRepository.findByTransactionReference(refundRef + "-ADMIN-DEBIT")).thenReturn(Optional.empty());
        when(walletRepository.findAdminWallets()).thenReturn(List.of(adminWallet));
        when(walletRepository.findByUserId(customerId)).thenReturn(Optional.of(customerWallet));
        when(walletRepository.save(adminWallet)).thenReturn(adminWallet);
        when(walletRepository.save(customerWallet)).thenReturn(customerWallet);

        InternalWalletTransferResponse response = walletService.transferAdminToCustomer(request);

        assertNotNull(response);
        assertTrue(response.isSuccessful());
        assertEquals(new BigDecimal("10000.00"), adminWallet.getBalance());
        assertEquals(new BigDecimal("5000.00"), customerWallet.getBalance());
        verify(transactionRepository, times(2)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Financial Rule: Insufficient balance (Customer ₹1000, Purchase ₹2500) -> Throws exception, Balances unchanged")
    void transferCustomerToAdmin_InsufficientBalance_ThrowsException() {
        Long customerId = 100L;
        BigDecimal orderAmount = new BigDecimal("2500.00");
        String txRef = "ORDER-10002";

        InternalWalletTransferRequest request = InternalWalletTransferRequest.builder()
                .customerUserId(customerId)
                .amount(orderAmount)
                .transactionReference(txRef)
                .orderId(10002L)
                .build();

        Wallet customerWallet = Wallet.builder()
                .id(1L)
                .userId(customerId)
                .role(UserRole.CUSTOMER)
                .balance(new BigDecimal("1000.00")) // Only ₹1000
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        when(transactionRepository.findByTransactionReference(txRef + "-CUST-DEBIT")).thenReturn(Optional.empty());
        when(walletRepository.findByUserId(customerId)).thenReturn(Optional.of(customerWallet));

        assertThrows(InsufficientBalanceException.class, () ->
                walletService.transferCustomerToAdmin(request)
        );

        // Verify customer balance stayed ₹1000 and save was never invoked
        assertEquals(new BigDecimal("1000.00"), customerWallet.getBalance());
        verify(walletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Idempotency: Replaying duplicate transaction returns existing success without double deduction")
    void transferCustomerToAdmin_DuplicateReference_Idempotent() {
        Long customerId = 100L;
        BigDecimal orderAmount = new BigDecimal("2500.00");
        String txRef = "ORDER-10001";

        InternalWalletTransferRequest request = InternalWalletTransferRequest.builder()
                .customerUserId(customerId)
                .amount(orderAmount)
                .transactionReference(txRef)
                .orderId(10001L)
                .build();

        WalletTransaction existingTx = WalletTransaction.builder()
                .id(10L)
                .transactionReference(txRef + "-CUST-DEBIT")
                .amount(orderAmount)
                .status(TransactionStatus.SUCCESS)
                .createdAt(Instant.now())
                .build();

        Wallet customerWallet = Wallet.builder()
                .id(1L)
                .userId(customerId)
                .balance(new BigDecimal("2500.00"))
                .build();

        when(transactionRepository.findByTransactionReference(txRef + "-CUST-DEBIT")).thenReturn(Optional.of(existingTx));
        when(walletRepository.findByUserId(customerId)).thenReturn(Optional.of(customerWallet));

        InternalWalletTransferResponse response = walletService.transferCustomerToAdmin(request);

        assertNotNull(response);
        assertTrue(response.isSuccessful());
        assertEquals("Transaction already processed successfully", response.getMessage());
        // Verify balance was NOT mutated again
        assertEquals(new BigDecimal("2500.00"), customerWallet.getBalance());
        verify(walletRepository, never()).save(any());
    }

    @Test
    @DisplayName("Top-up wallet adds funds and records transaction")
    void topUp_Success() {
        Long userId = 100L;
        WalletTopUpRequest request = WalletTopUpRequest.builder()
                .amount(new BigDecimal("500.00"))
                .referenceId("TXN-12345")
                .build();

        Wallet wallet = Wallet.builder()
                .id(1L)
                .userId(userId)
                .balance(new BigDecimal("1000.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        when(transactionRepository.findByTransactionReference("TOPUP-TXN-12345")).thenReturn(Optional.empty());
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(wallet);

        WalletDto result = walletService.topUp(userId, request);

        assertNotNull(result);
        assertEquals(new BigDecimal("1500.00"), wallet.getBalance());
        verify(transactionRepository, times(1)).save(any(WalletTransaction.class));
    }
}
