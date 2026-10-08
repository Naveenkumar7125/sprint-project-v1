package com.eshoppingzone.wallet.service.impl;

import com.eshoppingzone.wallet.dto.MerchantWalletDto;
import com.eshoppingzone.wallet.dto.PlatformCommissionSummaryDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.dto.WalletTransactionDto;
import com.eshoppingzone.wallet.entity.Settlement;
import com.eshoppingzone.wallet.entity.Wallet;
import com.eshoppingzone.wallet.entity.WalletTransaction;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import com.eshoppingzone.wallet.enums.TransactionStatus;
import com.eshoppingzone.wallet.enums.TransactionType;
import com.eshoppingzone.wallet.enums.UserRole;
import com.eshoppingzone.wallet.enums.WalletStatus;
import com.eshoppingzone.wallet.event.OrderConfirmedEvent;
import com.eshoppingzone.wallet.repository.SettlementRepository;
import com.eshoppingzone.wallet.repository.WalletRepository;
import com.eshoppingzone.wallet.repository.WalletTransactionRepository;
import com.eshoppingzone.wallet.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementServiceImpl implements SettlementService {

    private final SettlementRepository settlementRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    @Value("${app.settlement.platform-commission-percentage:10.00}")
    private BigDecimal defaultCommissionPercentage;

    @Override
    @Transactional
    public List<SettlementDto> createSettlementsForOrder(Long orderId, String orderNumber, List<OrderConfirmedEvent.OrderItemSummary> items) {
        log.info("Calculating multi-merchant settlements for order: {} (ID: {}) with {} item(s)", orderNumber, orderId, items != null ? items.size() : 0);

        if (items == null || items.isEmpty()) {
            log.warn("No items provided for order {}. Cannot calculate merchant settlement.", orderId);
            return List.of();
        }

        // Group items by merchantId (defaulting to merchant 1 if unassigned)
        Map<Long, List<OrderConfirmedEvent.OrderItemSummary>> itemsByMerchant = items.stream()
                .collect(Collectors.groupingBy(i -> i.getMerchantId() != null ? i.getMerchantId() : 1L));

        List<Settlement> createdSettlements = new ArrayList<>();

        for (Map.Entry<Long, List<OrderConfirmedEvent.OrderItemSummary>> entry : itemsByMerchant.entrySet()) {
            Long merchantId = entry.getKey();
            List<OrderConfirmedEvent.OrderItemSummary> merchantItems = entry.getValue();

            // Calculate total gross amount for this merchant using order item snapshots
            BigDecimal grossAmount = merchantItems.stream()
                    .map(i -> {
                        if (i.getTotalPrice() != null) {
                            return i.getTotalPrice();
                        } else if (i.getUnitPrice() != null && i.getQuantity() != null) {
                            return i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity()));
                        }
                        return BigDecimal.ZERO;
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            // Idempotency check: Check if settlement already exists for this order & merchant
            Optional<Settlement> existingOpt = settlementRepository.findByOrderIdAndMerchantId(orderId, merchantId);
            if (existingOpt.isPresent()) {
                log.info("Settlement already exists for order {} and merchant {}. Skipping duplicate creation.", orderId, merchantId);
                createdSettlements.add(existingOpt.get());
                continue;
            }

            BigDecimal commissionPercentage = getConfiguredCommissionPercentage();
            BigDecimal platformCommission = grossAmount.multiply(commissionPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal merchantAmount = grossAmount.subtract(platformCommission)
                    .setScale(2, RoundingMode.HALF_UP);

            log.info("Order {}: Merchant {} Gross = ₹{}, Platform Comm ({}%) = ₹{}, Merchant Net = ₹{}",
                    orderNumber, merchantId, grossAmount, commissionPercentage, platformCommission, merchantAmount);

            // Create and persist Settlement
            Settlement settlement = Settlement.builder()
                    .orderId(orderId)
                    .orderNumber(orderNumber)
                    .merchantId(merchantId)
                    .grossAmount(grossAmount)
                    .commissionPercentage(commissionPercentage)
                    .platformCommission(platformCommission)
                    .merchantAmount(merchantAmount)
                    .status(SettlementStatus.PENDING)
                    .build();

            Settlement savedSettlement = settlementRepository.save(settlement);
            createdSettlements.add(savedSettlement);

            // Credit Merchant's PENDING balance
            Wallet merchantWallet = getOrCreateMerchantWalletEntity(merchantId);
            BigDecimal currentPending = merchantWallet.getPendingBalance() != null ? merchantWallet.getPendingBalance() : BigDecimal.ZERO;
            merchantWallet.setPendingBalance(currentPending.add(merchantAmount));
            Wallet savedWallet = walletRepository.save(merchantWallet);

            // Record transaction ledger entry
            String txRef = "SETTLE-" + orderId + "-M" + merchantId + "-PENDING";
            if (transactionRepository.findByTransactionReference(txRef).isEmpty()) {
                WalletTransaction pendingTx = WalletTransaction.builder()
                        .transactionReference(txRef)
                        .wallet(savedWallet)
                        .userId(merchantId)
                        .transactionType(TransactionType.CREDIT)
                        .amount(merchantAmount)
                        .balanceAfter(savedWallet.getAvailableBalance())
                        .status(TransactionStatus.PENDING)
                        .description(String.format("Pending settlement for Order #%s (Gross: ₹%s, Platform Fee: ₹%s)",
                                orderNumber, grossAmount, platformCommission))
                        .sourceParty("PLATFORM_ESCROW")
                        .destinationParty("MERCHANT_PENDING_WALLET_" + merchantId)
                        .build();
                transactionRepository.save(pendingTx);
            }
        }

        return createdSettlements.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<SettlementDto> releaseSettlementsForOrder(Long orderId) {
        log.info("Releasing pending settlements to AVAILABLE for order ID: {}", orderId);

        List<Settlement> pendingSettlements = settlementRepository.findByOrderId(orderId).stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING)
                .collect(Collectors.toList());

        if (pendingSettlements.isEmpty()) {
            log.info("No PENDING settlements found to release for order ID: {}", orderId);
            return settlementRepository.findByOrderId(orderId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        List<Settlement> updatedSettlements = new ArrayList<>();

        for (Settlement settlement : pendingSettlements) {
            settlement.setStatus(SettlementStatus.AVAILABLE);
            Settlement saved = settlementRepository.save(settlement);
            updatedSettlements.add(saved);

            Long merchantId = settlement.getMerchantId();
            BigDecimal merchantAmount = settlement.getMerchantAmount();

            Wallet merchantWallet = getOrCreateMerchantWalletEntity(merchantId);

            BigDecimal currentPending = merchantWallet.getPendingBalance() != null ? merchantWallet.getPendingBalance() : BigDecimal.ZERO;
            BigDecimal currentAvailable = merchantWallet.getAvailableBalance() != null ? merchantWallet.getAvailableBalance() : BigDecimal.ZERO;

            BigDecimal newPending = currentPending.subtract(merchantAmount);
            if (newPending.compareTo(BigDecimal.ZERO) < 0) {
                newPending = BigDecimal.ZERO;
            }

            BigDecimal newAvailable = currentAvailable.add(merchantAmount);

            merchantWallet.setPendingBalance(newPending);
            merchantWallet.setAvailableBalance(newAvailable);
            merchantWallet.setBalance(newAvailable); // Keep primary balance in sync with available balance
            Wallet savedWallet = walletRepository.save(merchantWallet);

            // Record available earnings release in transaction ledger
            String txRef = "SETTLE-" + orderId + "-M" + merchantId + "-AVAILABLE";
            if (transactionRepository.findByTransactionReference(txRef).isEmpty()) {
                WalletTransaction availableTx = WalletTransaction.builder()
                        .transactionReference(txRef)
                        .wallet(savedWallet)
                        .userId(merchantId)
                        .transactionType(TransactionType.CREDIT)
                        .amount(merchantAmount)
                        .balanceAfter(newAvailable)
                        .status(TransactionStatus.SUCCESS)
                        .description(String.format("Delivered order settlement credited for Order #%s", settlement.getOrderNumber()))
                        .sourceParty("MERCHANT_PENDING_WALLET_" + merchantId)
                        .destinationParty("MERCHANT_AVAILABLE_WALLET_" + merchantId)
                        .build();
                transactionRepository.save(availableTx);
            }

            log.info("Released settlement for Order #{}: Merchant {} available balance updated to ₹{} (Pending: ₹{})",
                    settlement.getOrderNumber(), merchantId, newAvailable, newPending);
        }

        return updatedSettlements.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<SettlementDto> cancelSettlementsForOrder(Long orderId, String reason) {
        log.info("Cancelling settlements for order ID: {}, reason: {}", orderId, reason);

        List<Settlement> pendingSettlements = settlementRepository.findByOrderId(orderId).stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING)
                .collect(Collectors.toList());

        List<Settlement> cancelledSettlements = new ArrayList<>();

        for (Settlement settlement : pendingSettlements) {
            settlement.setStatus(SettlementStatus.CANCELLED);
            Settlement saved = settlementRepository.save(settlement);
            cancelledSettlements.add(saved);

            Long merchantId = settlement.getMerchantId();
            BigDecimal merchantAmount = settlement.getMerchantAmount();

            Wallet merchantWallet = getOrCreateMerchantWalletEntity(merchantId);
            BigDecimal currentPending = merchantWallet.getPendingBalance() != null ? merchantWallet.getPendingBalance() : BigDecimal.ZERO;
            BigDecimal newPending = currentPending.subtract(merchantAmount);
            if (newPending.compareTo(BigDecimal.ZERO) < 0) {
                newPending = BigDecimal.ZERO;
            }

            merchantWallet.setPendingBalance(newPending);
            Wallet savedWallet = walletRepository.save(merchantWallet);

            String txRef = "SETTLE-" + orderId + "-M" + merchantId + "-CANCELLED";
            if (transactionRepository.findByTransactionReference(txRef).isEmpty()) {
                WalletTransaction cancelTx = WalletTransaction.builder()
                        .transactionReference(txRef)
                        .wallet(savedWallet)
                        .userId(merchantId)
                        .transactionType(TransactionType.DEBIT)
                        .amount(merchantAmount)
                        .balanceAfter(savedWallet.getAvailableBalance())
                        .status(TransactionStatus.SUCCESS)
                        .description(String.format("Cancelled pending earnings for Order #%s: %s",
                                settlement.getOrderNumber(), reason != null ? reason : "Order Cancelled"))
                        .sourceParty("MERCHANT_PENDING_WALLET_" + merchantId)
                        .destinationParty("PLATFORM_REVERSAL")
                        .build();
                transactionRepository.save(cancelTx);
            }
        }

        return cancelledSettlements.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantWalletDto getMerchantWallet(Long merchantId) {
        Wallet wallet = getOrCreateMerchantWalletEntity(merchantId);
        BigDecimal totalEarnings = settlementRepository.sumTotalEarningsByMerchantId(merchantId);
        BigDecimal pending = wallet.getPendingBalance() != null ? wallet.getPendingBalance() : BigDecimal.ZERO;
        BigDecimal available = wallet.getAvailableBalance() != null ? wallet.getAvailableBalance() : (wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO);
        BigDecimal primaryBal = wallet.getBalance() != null ? wallet.getBalance() : available;
        BigDecimal effectiveEarnings = (totalEarnings != null && totalEarnings.compareTo(BigDecimal.ZERO) > 0) ? totalEarnings : primaryBal;

        return MerchantWalletDto.builder()
                .id(wallet.getId())
                .merchantId(merchantId)
                .pendingBalance(pending)
                .availableBalance(primaryBal)
                .totalBalance(primaryBal)
                .totalEarnings(effectiveEarnings)
                .currency(wallet.getCurrency() != null ? wallet.getCurrency() : "INR")
                .status(wallet.getStatus())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SettlementDto> getMerchantSettlements(Long merchantId, SettlementStatus status, Pageable pageable) {
        if (status != null) {
            return settlementRepository.findByMerchantIdAndStatusOrderByCreatedAtDesc(merchantId, status, pageable)
                    .map(this::mapToDto);
        }
        return settlementRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletTransactionDto> getMerchantTransactions(Long merchantId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(merchantId, pageable)
                .map(tx -> WalletTransactionDto.builder()
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
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SettlementDto> getAdminSettlements(SettlementStatus status, Long merchantId, Long orderId, Pageable pageable) {
        if (merchantId != null) {
            return getMerchantSettlements(merchantId, status, pageable);
        }
        if (status != null) {
            return settlementRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::mapToDto);
        }
        return settlementRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformCommissionSummaryDto getAdminCommissionSummary() {
        BigDecimal gmv = settlementRepository.sumTotalGrossMerchandiseValue();
        BigDecimal totalCommission = settlementRepository.sumTotalPlatformCommission();
        BigDecimal pendingCommission = settlementRepository.sumPendingPlatformCommission();
        BigDecimal settledCommission = settlementRepository.sumSettledPlatformCommission();

        long pendingCount = settlementRepository.countByStatus(SettlementStatus.PENDING);
        long completedCount = settlementRepository.countByStatus(SettlementStatus.AVAILABLE) + settlementRepository.countByStatus(SettlementStatus.COMPLETED);
        long cancelledCount = settlementRepository.countByStatus(SettlementStatus.CANCELLED);
        long totalCount = settlementRepository.count();

        return PlatformCommissionSummaryDto.builder()
                .configuredCommissionPercentage(getConfiguredCommissionPercentage())
                .totalGrossMerchandiseValue(gmv != null ? gmv : BigDecimal.ZERO)
                .totalPlatformCommission(totalCommission != null ? totalCommission : BigDecimal.ZERO)
                .pendingPlatformCommission(pendingCommission != null ? pendingCommission : BigDecimal.ZERO)
                .settledPlatformCommission(settledCommission != null ? settledCommission : BigDecimal.ZERO)
                .totalSettlementsCount(totalCount)
                .pendingSettlementsCount(pendingCount)
                .completedSettlementsCount(completedCount)
                .cancelledSettlementsCount(cancelledCount)
                .build();
    }

    @Override
    public BigDecimal getConfiguredCommissionPercentage() {
        return defaultCommissionPercentage != null ? defaultCommissionPercentage : new BigDecimal("10.00");
    }

    private Wallet getOrCreateMerchantWalletEntity(Long merchantId) {
        return walletRepository.findByUserId(merchantId)
                .orElseGet(() -> {
                    Wallet wallet = Wallet.builder()
                            .userId(merchantId)
                            .role(UserRole.MERCHANT)
                            .balance(BigDecimal.ZERO)
                            .pendingBalance(BigDecimal.ZERO)
                            .availableBalance(BigDecimal.ZERO)
                            .currency("INR")
                            .status(WalletStatus.ACTIVE)
                            .build();
                    return walletRepository.save(wallet);
                });
    }

    private SettlementDto mapToDto(Settlement settlement) {
        return SettlementDto.builder()
                .id(settlement.getId())
                .orderId(settlement.getOrderId())
                .orderNumber(settlement.getOrderNumber())
                .merchantId(settlement.getMerchantId())
                .grossAmount(settlement.getGrossAmount())
                .commissionPercentage(settlement.getCommissionPercentage())
                .platformCommission(settlement.getPlatformCommission())
                .merchantAmount(settlement.getMerchantAmount())
                .status(settlement.getStatus())
                .createdAt(settlement.getCreatedAt())
                .updatedAt(settlement.getUpdatedAt())
                .build();
    }
}
