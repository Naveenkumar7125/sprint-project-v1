package com.eshoppingzone.wallet.service;

import com.eshoppingzone.common.dto.wallet.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface WalletService {

    WalletDto getWallet(Long userId);

    BigDecimal getBalance(Long userId);

    WalletDto topUp(Long userId, WalletTopUpRequest request);

    Page<WalletTransactionDto> getTransactions(Long userId, Pageable pageable);

    WalletTransactionDto getTransactionByReference(String transactionReference);

    InternalWalletTransferResponse transferCustomerToAdmin(InternalWalletTransferRequest request);

    InternalWalletTransferResponse transferAdminToCustomer(InternalWalletTransferRequest request);
}
