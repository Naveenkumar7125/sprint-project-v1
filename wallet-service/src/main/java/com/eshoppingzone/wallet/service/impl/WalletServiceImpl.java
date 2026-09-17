package com.eshoppingzone.wallet.service.impl;

import com.eshoppingzone.common.dto.wallet.*;
import com.eshoppingzone.common.enums.TransactionStatus;
import com.eshoppingzone.common.enums.TransactionType;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.enums.WalletStatus;
import com.eshoppingzone.common.exception.ConflictException;
import com.eshoppingzone.common.exception.InsufficientBalanceException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.wallet.entity.Wallet;
import com.eshoppingzone.wallet.entity.WalletTransaction;
import com.eshoppingzone.wallet.repository.WalletRepository;
import com.eshoppingzone.wallet.repository.WalletTransactionRepository;
import com.eshoppingzone.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WalletServiceImpl implements WalletService {

    private static final Logger log = LoggerFactory.getLogger(WalletServiceImpl.class);

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    public WalletServiceImpl(WalletRepository walletRepository,
                             WalletTransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public WalletDto getWallet(Long userId) {
        Wallet wallet = getOrCreateWallet(userId, UserRole.CUSTOMER);
        return mapToDto(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getBalance(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        return wallet.getBalance();
    }

    @Override
    public WalletDto topUp(Long userId, WalletTopUpRequest request) {
        String topUpRef = "TOPUP-" + request.getReferenceId();
        if (transactionRepository.findByTransactionReference(topUpRef).isPresent()) {
            throw new ConflictException("Top-up reference already processed: " + request.getReferenceId());
        }

        Wallet wallet = getOrCreateWallet(userId, UserRole.CUSTOMER);
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet saved = walletRepository.save(wallet);

        WalletTransaction tx = WalletTransaction.builder()
                .transactionReference(topUpRef)
                .wallet(saved)
                .userId(userId)
                .transactionType(TransactionType.CREDIT)
                .amount(request.getAmount())
                .balanceAfter(saved.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Wallet Top-up")
                .sourceParty("EXTERNAL_PAYMENT_GATEWAY")
                .destinationParty("USER_WALLET")
                .build();
        transactionRepository.save(tx);

        log.info("Top-up successful for userId: {}, amount: {}, new balance: {}", userId, request.getAmount(), saved.getBalance());
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletTransactionDto> getTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToTxDto);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletTransactionDto getTransactionByReference(String transactionReference) {
        WalletTransaction tx = transactionRepository.findByTransactionReference(transactionReference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with reference: " + transactionReference));
        return mapToTxDto(tx);
    }

    @Override
    public InternalWalletTransferResponse transferCustomerToAdmin(InternalWalletTransferRequest request) {
        String customerTxRef = request.getTransactionReference() + "-CUST-DEBIT";
        String adminTxRef = request.getTransactionReference() + "-ADMIN-CREDIT";

        // Idempotency check
        Optional<WalletTransaction> existingTx = transactionRepository.findByTransactionReference(customerTxRef);
        if (existingTx.isPresent()) {
            log.info("Duplicate customer-to-admin transfer detected for reference: {}. Returning existing record.", request.getTransactionReference());
            Wallet customerWallet = walletRepository.findByUserId(request.getCustomerUserId()).orElseThrow();
            return InternalWalletTransferResponse.builder()
                    .successful(true)
                    .transactionReference(request.getTransactionReference())
                    .amount(request.getAmount())
                    .status(TransactionStatus.SUCCESS)
                    .message("Transaction already processed successfully")
                    .customerRemainingBalance(customerWallet.getBalance())
                    .processedAt(existingTx.get().getCreatedAt())
                    .build();
        }

        Wallet customerWallet = walletRepository.findByUserId(request.getCustomerUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer wallet not found for userId: " + request.getCustomerUserId()));

        if (customerWallet.getStatus() != WalletStatus.ACTIVE) {
            throw new InsufficientBalanceException("Customer wallet is not active");
        }

        if (customerWallet.getBalance().compareTo(request.getAmount()) < 0) {
            log.warn("Insufficient funds for customerId: {}. Balance: {}, Required: {}",
                    request.getCustomerUserId(), customerWallet.getBalance(), request.getAmount());
            throw new InsufficientBalanceException("Insufficient balance in customer wallet. Available: " + customerWallet.getBalance());
        }

        Wallet adminWallet = getOrCreateAdminWallet();

        // Atomic financial mutation: Customer DEBIT + Admin CREDIT
        customerWallet.setBalance(customerWallet.getBalance().subtract(request.getAmount()));
        adminWallet.setBalance(adminWallet.getBalance().add(request.getAmount()));

        Wallet savedCustomerWallet = walletRepository.save(customerWallet);
        Wallet savedAdminWallet = walletRepository.save(adminWallet);

        // Record customer debit transaction
        WalletTransaction custTx = WalletTransaction.builder()
                .transactionReference(customerTxRef)
                .wallet(savedCustomerWallet)
                .userId(request.getCustomerUserId())
                .transactionType(TransactionType.DEBIT)
                .amount(request.getAmount())
                .balanceAfter(savedCustomerWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Order Payment for order: " + request.getOrderId())
                .sourceParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .destinationParty("ADMIN_WALLET")
                .build();
        transactionRepository.save(custTx);

        // Record admin credit transaction
        WalletTransaction adminTx = WalletTransaction.builder()
                .transactionReference(adminTxRef)
                .wallet(savedAdminWallet)
                .userId(adminWallet.getUserId())
                .transactionType(TransactionType.CREDIT)
                .amount(request.getAmount())
                .balanceAfter(savedAdminWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Order Payment received for order: " + request.getOrderId())
                .sourceParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .destinationParty("ADMIN_WALLET")
                .build();
        transactionRepository.save(adminTx);

        log.info("Atomic transfer SUCCESS: Customer {} debited {}, new balance {}; Admin credited {}, new balance {}",
                request.getCustomerUserId(), request.getAmount(), savedCustomerWallet.getBalance(), request.getAmount(), savedAdminWallet.getBalance());

        return InternalWalletTransferResponse.builder()
                .successful(true)
                .transactionReference(request.getTransactionReference())
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .message("Transfer completed successfully")
                .customerRemainingBalance(savedCustomerWallet.getBalance())
                .processedAt(Instant.now())
                .build();
    }

    @Override
    public InternalWalletTransferResponse transferAdminToCustomer(InternalWalletTransferRequest request) {
        String adminRefundTxRef = request.getTransactionReference() + "-ADMIN-DEBIT";
        String customerRefundTxRef = request.getTransactionReference() + "-CUST-CREDIT";

        // Idempotency check
        Optional<WalletTransaction> existingTx = transactionRepository.findByTransactionReference(adminRefundTxRef);
        if (existingTx.isPresent()) {
            log.info("Duplicate refund transfer detected for reference: {}. Returning existing record.", request.getTransactionReference());
            Wallet customerWallet = walletRepository.findByUserId(request.getCustomerUserId()).orElseThrow();
            return InternalWalletTransferResponse.builder()
                    .successful(true)
                    .transactionReference(request.getTransactionReference())
                    .amount(request.getAmount())
                    .status(TransactionStatus.SUCCESS)
                    .message("Refund already processed successfully")
                    .customerRemainingBalance(customerWallet.getBalance())
                    .processedAt(existingTx.get().getCreatedAt())
                    .build();
        }

        Wallet adminWallet = getOrCreateAdminWallet();
        if (adminWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException("Admin settlement wallet has insufficient funds for refund");
        }

        Wallet customerWallet = walletRepository.findByUserId(request.getCustomerUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer wallet not found for userId: " + request.getCustomerUserId()));

        // Atomic financial mutation: Admin DEBIT + Customer CREDIT
        adminWallet.setBalance(adminWallet.getBalance().subtract(request.getAmount()));
        customerWallet.setBalance(customerWallet.getBalance().add(request.getAmount()));

        Wallet savedAdminWallet = walletRepository.save(adminWallet);
        Wallet savedCustomerWallet = walletRepository.save(customerWallet);

        // Record admin debit transaction
        WalletTransaction adminTx = WalletTransaction.builder()
                .transactionReference(adminRefundTxRef)
                .wallet(savedAdminWallet)
                .userId(adminWallet.getUserId())
                .transactionType(TransactionType.DEBIT)
                .amount(request.getAmount())
                .balanceAfter(savedAdminWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Refund for order: " + request.getOrderId())
                .sourceParty("ADMIN_WALLET")
                .destinationParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .build();
        transactionRepository.save(adminTx);

        // Record customer credit transaction
        WalletTransaction custTx = WalletTransaction.builder()
                .transactionReference(customerRefundTxRef)
                .wallet(savedCustomerWallet)
                .userId(request.getCustomerUserId())
                .transactionType(TransactionType.REFUND)
                .amount(request.getAmount())
                .balanceAfter(savedCustomerWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Refund received for order: " + request.getOrderId())
                .sourceParty("ADMIN_WALLET")
                .destinationParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .build();
        transactionRepository.save(custTx);

        log.info("Atomic refund SUCCESS: Admin debited {}, new balance {}; Customer {} credited {}, new balance {}",
                request.getAmount(), savedAdminWallet.getBalance(), request.getCustomerUserId(), request.getAmount(), savedCustomerWallet.getBalance());

        return InternalWalletTransferResponse.builder()
                .successful(true)
                .transactionReference(request.getTransactionReference())
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .message("Refund transfer completed successfully")
                .customerRemainingBalance(savedCustomerWallet.getBalance())
                .processedAt(Instant.now())
                .build();
    }

    private Wallet getOrCreateWallet(Long userId, UserRole role) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .userId(userId)
                            .role(role)
                            .balance(BigDecimal.ZERO)
                            .currency("INR")
                            .status(WalletStatus.ACTIVE)
                            .build();
                    return walletRepository.save(newWallet);
                });
    }

    private Wallet getOrCreateAdminWallet() {
        List<Wallet> admins = walletRepository.findAdminWallets();
        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        // Provision default system admin wallet (userId: 1)
        Wallet adminWallet = Wallet.builder()
                .userId(1L)
                .role(UserRole.ADMIN)
                .balance(new BigDecimal("1000000.00")) // Initial balance for admin settlement
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();
        return walletRepository.save(adminWallet);
    }

    private WalletDto mapToDto(Wallet wallet) {
        return WalletDto.builder()
                .id(wallet.getId())
                .userId(wallet.getUserId())
                .role(wallet.getRole())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .status(wallet.getStatus())
                .version(wallet.getVersion())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private WalletTransactionDto mapToTxDto(WalletTransaction tx) {
        return WalletTransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .walletId(tx.getWallet() != null ? tx.getWallet().getId() : null)
                .userId(tx.getUserId())
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .status(tx.getStatus())
                .description(tx.getDescription())
                .sourceParty(tx.getSourceParty())
                .destinationParty(tx.getDestinationParty())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
