package com.eshoppingzone.wallet.service.impl;

import com.eshoppingzone.wallet.dto.*;
import com.eshoppingzone.wallet.enums.TransactionStatus;
import com.eshoppingzone.wallet.enums.TransactionType;
import com.eshoppingzone.wallet.enums.UserRole;
import com.eshoppingzone.wallet.enums.WalletStatus;
import com.eshoppingzone.wallet.exception.ConflictException;
import com.eshoppingzone.wallet.exception.InsufficientBalanceException;
import com.eshoppingzone.wallet.exception.ResourceNotFoundException;
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
    @Transactional
    public WalletDto getWallet(Long userId) {
        Wallet wallet = getOrCreateWallet(userId, UserRole.CUSTOMER);
        return mapToDto(wallet);
    }

    @Override
    @Transactional
    public BigDecimal getBalance(Long userId) {
        Wallet wallet = getOrCreateWallet(userId, UserRole.CUSTOMER);
        return wallet.getBalance();
    }

    @Override
    public WalletDto topUp(Long userId, WalletTopUpRequest request) {
        String topUpRef = "TOPUP-" + request.getReferenceId();
        if (transactionRepository.findByTransactionReference(topUpRef).isPresent()) {
            throw new ConflictException("Top-up reference already processed: " + request.getReferenceId());
        }

        Wallet wallet = getOrCreateWallet(userId, UserRole.CUSTOMER);
        BigDecimal newBal = wallet.getBalance().add(request.getAmount());
        wallet.setBalance(newBal);
        wallet.setAvailableBalance(newBal);
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
        String merchantTxRef = request.getTransactionReference() + "-MERCHANT-CREDIT";

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

        // Calculate 10% Admin Platform share and 90% Merchant Share
        BigDecimal adminShare = request.getAmount().multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal merchantShare = request.getAmount().subtract(adminShare).setScale(2, java.math.RoundingMode.HALF_UP);

        Wallet adminWallet = getOrCreateAdminWallet();
        Wallet merchantWallet = getOrCreateMerchantWallet(request.getMerchantId());

        // Atomic financial mutation: Customer DEBIT (100%), Admin CREDIT (10%), Merchant CREDIT (90%)
        customerWallet.setBalance(customerWallet.getBalance().subtract(request.getAmount()));
        customerWallet.setAvailableBalance(customerWallet.getBalance());

        adminWallet.setBalance(adminWallet.getBalance().add(adminShare));
        adminWallet.setAvailableBalance(adminWallet.getBalance());

        merchantWallet.setBalance(merchantWallet.getBalance().add(merchantShare));
        BigDecimal currentMerchantAvailable = merchantWallet.getAvailableBalance() != null ? merchantWallet.getAvailableBalance() : BigDecimal.ZERO;
        merchantWallet.setAvailableBalance(currentMerchantAvailable.add(merchantShare));

        Wallet savedCustomerWallet = walletRepository.save(customerWallet);
        Wallet savedAdminWallet = walletRepository.save(adminWallet);
        Wallet savedMerchantWallet = walletRepository.save(merchantWallet);

        // Record customer debit transaction (100%)
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
                .destinationParty("ADMIN (10%) & MERCHANT (90%)")
                .build();
        transactionRepository.save(custTx);

        // Record admin credit transaction (10%)
        WalletTransaction adminTx = WalletTransaction.builder()
                .transactionReference(adminTxRef)
                .wallet(savedAdminWallet)
                .userId(adminWallet.getUserId())
                .transactionType(TransactionType.CREDIT)
                .amount(adminShare)
                .balanceAfter(savedAdminWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Platform fee (10%) for order: " + request.getOrderId())
                .sourceParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .destinationParty("ADMIN_WALLET")
                .build();
        transactionRepository.save(adminTx);

        // Record merchant credit transaction (90%)
        WalletTransaction merchantTx = WalletTransaction.builder()
                .transactionReference(merchantTxRef)
                .wallet(savedMerchantWallet)
                .userId(savedMerchantWallet.getUserId())
                .transactionType(TransactionType.CREDIT)
                .amount(merchantShare)
                .balanceAfter(savedMerchantWallet.getBalance())
                .status(TransactionStatus.SUCCESS)
                .description("Merchant earnings (90%) for order: " + request.getOrderId())
                .sourceParty("CUSTOMER_WALLET_" + request.getCustomerUserId())
                .destinationParty("MERCHANT_WALLET_" + savedMerchantWallet.getUserId())
                .build();
        transactionRepository.save(merchantTx);

        log.info("Atomic transfer SUCCESS: Customer {} debited {}, Admin credited {} (10%), Merchant {} credited {} (90%)",
                request.getCustomerUserId(), request.getAmount(), adminShare, savedMerchantWallet.getUserId(), merchantShare);

        return InternalWalletTransferResponse.builder()
                .successful(true)
                .transactionReference(request.getTransactionReference())
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .message("Transfer completed successfully (10% Admin, 90% Merchant)")
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
                            .pendingBalance(BigDecimal.ZERO)
                            .availableBalance(BigDecimal.ZERO)
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

        // Provision reserved platform system admin escrow wallet (userId: 0L)
        return walletRepository.findByUserId(0L)
                .orElseGet(() -> {
                    Wallet adminWallet = Wallet.builder()
                            .userId(0L)
                            .role(UserRole.ADMIN)
                            .balance(new BigDecimal("1000000.00")) // Initial balance for admin settlement
                            .pendingBalance(BigDecimal.ZERO)
                            .availableBalance(new BigDecimal("1000000.00"))
                            .currency("INR")
                            .status(WalletStatus.ACTIVE)
                            .build();
                    return walletRepository.save(adminWallet);
                });
    }

    private Wallet getOrCreateMerchantWallet(Long merchantId) {
        if (merchantId != null) {
            return walletRepository.findByUserId(merchantId)
                    .orElseGet(() -> {
                        Wallet w = Wallet.builder()
                                .userId(merchantId)
                                .role(UserRole.MERCHANT)
                                .balance(BigDecimal.ZERO)
                                .pendingBalance(BigDecimal.ZERO)
                                .availableBalance(BigDecimal.ZERO)
                                .currency("INR")
                                .status(WalletStatus.ACTIVE)
                                .build();
                        return walletRepository.save(w);
                    });
        }

        List<Wallet> merchants = walletRepository.findByRole(UserRole.MERCHANT);
        if (!merchants.isEmpty()) {
            return merchants.get(0);
        }

        // Fallback default merchant ID 2 (merchant_bob)
        return walletRepository.findByUserId(2L)
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .userId(2L)
                            .role(UserRole.MERCHANT)
                            .balance(BigDecimal.ZERO)
                            .pendingBalance(BigDecimal.ZERO)
                            .availableBalance(BigDecimal.ZERO)
                            .currency("INR")
                            .status(WalletStatus.ACTIVE)
                            .build();
                    return walletRepository.save(w);
                });
    }


    private WalletDto mapToDto(Wallet wallet) {
        BigDecimal pending = wallet.getPendingBalance() != null ? wallet.getPendingBalance() : BigDecimal.ZERO;
        BigDecimal available = wallet.getAvailableBalance() != null ? wallet.getAvailableBalance() : (wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO);
        BigDecimal primaryBal = wallet.getBalance() != null ? wallet.getBalance() : available;

        return WalletDto.builder()
                .id(wallet.getId())
                .userId(wallet.getUserId())
                .role(wallet.getRole())
                .balance(primaryBal)
                .pendingBalance(pending)
                .availableBalance(available)
                .totalEarnings(available)
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
