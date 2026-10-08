package com.eshoppingzone.wallet.service;

import com.eshoppingzone.wallet.dto.MerchantWalletDto;
import com.eshoppingzone.wallet.dto.PlatformCommissionSummaryDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.entity.Settlement;
import com.eshoppingzone.wallet.entity.Wallet;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import com.eshoppingzone.wallet.enums.UserRole;
import com.eshoppingzone.wallet.enums.WalletStatus;
import com.eshoppingzone.wallet.event.OrderConfirmedEvent;
import com.eshoppingzone.wallet.repository.SettlementRepository;
import com.eshoppingzone.wallet.repository.WalletRepository;
import com.eshoppingzone.wallet.repository.WalletTransactionRepository;
import com.eshoppingzone.wallet.service.impl.SettlementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    private SettlementServiceImpl settlementService;

    @BeforeEach
    void setUp() {
        settlementService = new SettlementServiceImpl(settlementRepository, walletRepository, transactionRepository);
        ReflectionTestUtils.setField(settlementService, "defaultCommissionPercentage", new BigDecimal("10.00"));
    }

    @Test
    @DisplayName("Acceptance Criteria 1: Customer buys ₹2000 product (Merchant 501) -> Platform ₹200, Merchant Pending ₹1800")
    void createSettlement_SingleMerchant_Success() {
        Long orderId = 1001L;
        String orderNumber = "ORD-TEST-1001";
        Long merchantId = 501L;

        OrderConfirmedEvent.OrderItemSummary item = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(10L)
                .productName("Flagship Phone")
                .merchantId(merchantId)
                .unitPrice(new BigDecimal("2000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("2000.00"))
                .build();

        Wallet merchantWallet = Wallet.builder()
                .id(1L)
                .userId(merchantId)
                .role(UserRole.MERCHANT)
                .balance(BigDecimal.ZERO)
                .pendingBalance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .status(WalletStatus.ACTIVE)
                .build();

        when(settlementRepository.findByOrderIdAndMerchantId(orderId, merchantId)).thenReturn(Optional.empty());
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> {
            Settlement s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });
        when(walletRepository.findByUserId(merchantId)).thenReturn(Optional.of(merchantWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<SettlementDto> settlements = settlementService.createSettlementsForOrder(orderId, orderNumber, List.of(item));

        assertEquals(1, settlements.size());
        SettlementDto settlement = settlements.get(0);
        assertEquals(merchantId, settlement.getMerchantId());
        assertEquals(new BigDecimal("2000.00"), settlement.getGrossAmount());
        assertEquals(new BigDecimal("10.00"), settlement.getCommissionPercentage());
        assertEquals(new BigDecimal("200.00"), settlement.getPlatformCommission());
        assertEquals(new BigDecimal("1800.00"), settlement.getMerchantAmount());
        assertEquals(SettlementStatus.PENDING, settlement.getStatus());

        assertEquals(new BigDecimal("1800.00"), merchantWallet.getPendingBalance());
        assertEquals(BigDecimal.ZERO, merchantWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Acceptance Criteria 2: Multi-Merchant Cart (Merchant 101: ₹1000 + ₹500 = ₹1500; Merchant 102: ₹2000 = ₹2000)")
    void createSettlement_MultiMerchantCart_Success() {
        Long orderId = 2002L;
        String orderNumber = "ORD-MULTI-2002";

        OrderConfirmedEvent.OrderItemSummary itemA = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(1L)
                .productName("Product A")
                .merchantId(101L)
                .unitPrice(new BigDecimal("1000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("1000.00"))
                .build();

        OrderConfirmedEvent.OrderItemSummary itemB = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(2L)
                .productName("Product B")
                .merchantId(102L)
                .unitPrice(new BigDecimal("2000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("2000.00"))
                .build();

        OrderConfirmedEvent.OrderItemSummary itemC = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(3L)
                .productName("Product C")
                .merchantId(101L)
                .unitPrice(new BigDecimal("500.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("500.00"))
                .build();

        Wallet wallet101 = Wallet.builder()
                .userId(101L)
                .role(UserRole.MERCHANT)
                .pendingBalance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .build();

        Wallet wallet102 = Wallet.builder()
                .userId(102L)
                .role(UserRole.MERCHANT)
                .pendingBalance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .build();

        when(settlementRepository.findByOrderIdAndMerchantId(eq(orderId), eq(101L))).thenReturn(Optional.empty());
        when(settlementRepository.findByOrderIdAndMerchantId(eq(orderId), eq(102L))).thenReturn(Optional.empty());
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> inv.getArgument(0));

        when(walletRepository.findByUserId(101L)).thenReturn(Optional.of(wallet101));
        when(walletRepository.findByUserId(102L)).thenReturn(Optional.of(wallet102));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<SettlementDto> settlements = settlementService.createSettlementsForOrder(orderId, orderNumber, List.of(itemA, itemB, itemC));

        assertEquals(2, settlements.size());

        SettlementDto s101 = settlements.stream().filter(s -> s.getMerchantId().equals(101L)).findFirst().orElseThrow();
        assertEquals(new BigDecimal("1500.00"), s101.getGrossAmount());
        assertEquals(new BigDecimal("150.00"), s101.getPlatformCommission());
        assertEquals(new BigDecimal("1350.00"), s101.getMerchantAmount());
        assertEquals(new BigDecimal("1350.00"), wallet101.getPendingBalance());

        SettlementDto s102 = settlements.stream().filter(s -> s.getMerchantId().equals(102L)).findFirst().orElseThrow();
        assertEquals(new BigDecimal("2000.00"), s102.getGrossAmount());
        assertEquals(new BigDecimal("200.00"), s102.getPlatformCommission());
        assertEquals(new BigDecimal("1800.00"), s102.getMerchantAmount());
        assertEquals(new BigDecimal("1800.00"), wallet102.getPendingBalance());
    }

    @Test
    @DisplayName("Acceptance Criteria 3: Order Delivered -> Pending Balance (₹1800) moves to Available Balance (₹11800)")
    void releaseSettlement_OnDelivery_Success() {
        Long orderId = 3003L;
        Long merchantId = 501L;

        Settlement pendingSettlement = Settlement.builder()
                .id(10L)
                .orderId(orderId)
                .orderNumber("ORD-3003")
                .merchantId(merchantId)
                .grossAmount(new BigDecimal("2000.00"))
                .commissionPercentage(new BigDecimal("10.00"))
                .platformCommission(new BigDecimal("200.00"))
                .merchantAmount(new BigDecimal("1800.00"))
                .status(SettlementStatus.PENDING)
                .build();

        Wallet merchantWallet = Wallet.builder()
                .id(1L)
                .userId(merchantId)
                .role(UserRole.MERCHANT)
                .balance(new BigDecimal("10000.00"))
                .pendingBalance(new BigDecimal("1800.00"))
                .availableBalance(new BigDecimal("10000.00"))
                .status(WalletStatus.ACTIVE)
                .build();

        when(settlementRepository.findByOrderId(orderId)).thenReturn(List.of(pendingSettlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> inv.getArgument(0));
        when(walletRepository.findByUserId(merchantId)).thenReturn(Optional.of(merchantWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<SettlementDto> released = settlementService.releaseSettlementsForOrder(orderId);

        assertEquals(1, released.size());
        assertEquals(SettlementStatus.AVAILABLE, released.get(0).getStatus());

        assertEquals(0, merchantWallet.getPendingBalance().compareTo(BigDecimal.ZERO));
        assertEquals(0, new BigDecimal("11800.00").compareTo(merchantWallet.getAvailableBalance()));
        assertEquals(0, new BigDecimal("11800.00").compareTo(merchantWallet.getBalance()));
    }

    @Test
    @DisplayName("Idempotency: Processing duplicate OrderConfirmed event does not create duplicate settlements or credit balances twice")
    void createSettlement_IdempotentDuplicate_ReturnsExisting() {
        Long orderId = 4004L;
        Long merchantId = 501L;

        Settlement existingSettlement = Settlement.builder()
                .id(99L)
                .orderId(orderId)
                .orderNumber("ORD-4004")
                .merchantId(merchantId)
                .grossAmount(new BigDecimal("2000.00"))
                .commissionPercentage(new BigDecimal("10.00"))
                .platformCommission(new BigDecimal("200.00"))
                .merchantAmount(new BigDecimal("1800.00"))
                .status(SettlementStatus.PENDING)
                .build();

        OrderConfirmedEvent.OrderItemSummary item = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(10L)
                .merchantId(merchantId)
                .unitPrice(new BigDecimal("2000.00"))
                .quantity(1)
                .totalPrice(new BigDecimal("2000.00"))
                .build();

        when(settlementRepository.findByOrderIdAndMerchantId(orderId, merchantId)).thenReturn(Optional.of(existingSettlement));

        List<SettlementDto> settlements = settlementService.createSettlementsForOrder(orderId, "ORD-4004", List.of(item));

        assertEquals(1, settlements.size());
        assertEquals(99L, settlements.get(0).getId());
        verify(settlementRepository, never()).save(any());
        verify(walletRepository, never()).save(any());
    }

    @Test
    @DisplayName("Order Cancellation: Pending settlement is cancelled and pending balance reversed")
    void cancelSettlement_OnCancellation_ReversesPending() {
        Long orderId = 5005L;
        Long merchantId = 501L;

        Settlement pendingSettlement = Settlement.builder()
                .id(20L)
                .orderId(orderId)
                .orderNumber("ORD-5005")
                .merchantId(merchantId)
                .merchantAmount(new BigDecimal("1800.00"))
                .status(SettlementStatus.PENDING)
                .build();

        Wallet merchantWallet = Wallet.builder()
                .userId(merchantId)
                .role(UserRole.MERCHANT)
                .pendingBalance(new BigDecimal("1800.00"))
                .availableBalance(new BigDecimal("5000.00"))
                .build();

        when(settlementRepository.findByOrderId(orderId)).thenReturn(List.of(pendingSettlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> inv.getArgument(0));
        when(walletRepository.findByUserId(merchantId)).thenReturn(Optional.of(merchantWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<SettlementDto> cancelled = settlementService.cancelSettlementsForOrder(orderId, "Customer requested cancellation");

        assertEquals(1, cancelled.size());
        assertEquals(SettlementStatus.CANCELLED, cancelled.get(0).getStatus());
        assertEquals(0, merchantWallet.getPendingBalance().compareTo(BigDecimal.ZERO));
        assertEquals(0, new BigDecimal("5000.00").compareTo(merchantWallet.getAvailableBalance()));
    }

    @Test
    @DisplayName("Configurable Commission: 15% rate creates ₹300 platform fee and ₹1700 merchant net on ₹2000 gross")
    void createSettlement_ConfigurableCommissionRate() {
        ReflectionTestUtils.setField(settlementService, "defaultCommissionPercentage", new BigDecimal("15.00"));

        Long orderId = 6006L;
        Long merchantId = 501L;

        OrderConfirmedEvent.OrderItemSummary item = OrderConfirmedEvent.OrderItemSummary.builder()
                .productId(10L)
                .merchantId(merchantId)
                .totalPrice(new BigDecimal("2000.00"))
                .build();

        Wallet merchantWallet = Wallet.builder()
                .userId(merchantId)
                .pendingBalance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .build();

        when(settlementRepository.findByOrderIdAndMerchantId(orderId, merchantId)).thenReturn(Optional.empty());
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(inv -> inv.getArgument(0));
        when(walletRepository.findByUserId(merchantId)).thenReturn(Optional.of(merchantWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        List<SettlementDto> settlements = settlementService.createSettlementsForOrder(orderId, "ORD-6006", List.of(item));

        assertEquals(1, settlements.size());
        assertEquals(new BigDecimal("15.00"), settlements.get(0).getCommissionPercentage());
        assertEquals(new BigDecimal("300.00"), settlements.get(0).getPlatformCommission());
        assertEquals(new BigDecimal("1700.00"), settlements.get(0).getMerchantAmount());
    }

    @Test
    @DisplayName("Admin Summary: Correctly aggregates GMV, Platform Commissions, and Settlement Counts")
    void getAdminCommissionSummary_AggregatesAccurately() {
        when(settlementRepository.sumTotalGrossMerchandiseValue()).thenReturn(new BigDecimal("50000.00"));
        when(settlementRepository.sumTotalPlatformCommission()).thenReturn(new BigDecimal("5000.00"));
        when(settlementRepository.sumPendingPlatformCommission()).thenReturn(new BigDecimal("2000.00"));
        when(settlementRepository.sumSettledPlatformCommission()).thenReturn(new BigDecimal("3000.00"));
        when(settlementRepository.countByStatus(SettlementStatus.PENDING)).thenReturn(10L);
        when(settlementRepository.countByStatus(SettlementStatus.AVAILABLE)).thenReturn(15L);
        when(settlementRepository.countByStatus(SettlementStatus.COMPLETED)).thenReturn(5L);
        when(settlementRepository.countByStatus(SettlementStatus.CANCELLED)).thenReturn(2L);
        when(settlementRepository.count()).thenReturn(32L);

        PlatformCommissionSummaryDto summary = settlementService.getAdminCommissionSummary();

        assertEquals(new BigDecimal("10.00"), summary.getConfiguredCommissionPercentage());
        assertEquals(new BigDecimal("50000.00"), summary.getTotalGrossMerchandiseValue());
        assertEquals(new BigDecimal("5000.00"), summary.getTotalPlatformCommission());
        assertEquals(new BigDecimal("2000.00"), summary.getPendingPlatformCommission());
        assertEquals(new BigDecimal("3000.00"), summary.getSettledPlatformCommission());
        assertEquals(10L, summary.getPendingSettlementsCount());
        assertEquals(20L, summary.getCompletedSettlementsCount());
        assertEquals(2L, summary.getCancelledSettlementsCount());
        assertEquals(32L, summary.getTotalSettlementsCount());
    }
}
