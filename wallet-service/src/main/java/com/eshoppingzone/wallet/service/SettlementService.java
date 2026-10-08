package com.eshoppingzone.wallet.service;

import com.eshoppingzone.wallet.dto.MerchantWalletDto;
import com.eshoppingzone.wallet.dto.PlatformCommissionSummaryDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.dto.WalletTransactionDto;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import com.eshoppingzone.wallet.event.OrderConfirmedEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface SettlementService {

    List<SettlementDto> createSettlementsForOrder(Long orderId, String orderNumber, List<OrderConfirmedEvent.OrderItemSummary> items);

    List<SettlementDto> releaseSettlementsForOrder(Long orderId);

    List<SettlementDto> cancelSettlementsForOrder(Long orderId, String reason);

    MerchantWalletDto getMerchantWallet(Long merchantId);

    Page<SettlementDto> getMerchantSettlements(Long merchantId, SettlementStatus status, Pageable pageable);

    Page<WalletTransactionDto> getMerchantTransactions(Long merchantId, Pageable pageable);

    Page<SettlementDto> getAdminSettlements(SettlementStatus status, Long merchantId, Long orderId, Pageable pageable);

    PlatformCommissionSummaryDto getAdminCommissionSummary();

    BigDecimal getConfiguredCommissionPercentage();
}
