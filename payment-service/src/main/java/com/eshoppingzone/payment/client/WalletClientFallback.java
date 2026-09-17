package com.eshoppingzone.payment.client;

import com.eshoppingzone.common.dto.wallet.InternalWalletTransferRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferResponse;
import com.eshoppingzone.common.exception.PaymentFailedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class WalletClientFallback implements WalletClient {

    private static final Logger log = LoggerFactory.getLogger(WalletClientFallback.class);

    @Override
    public InternalWalletTransferResponse transferCustomerToAdmin(InternalWalletTransferRequest request) {
        log.error("WalletClientFallback triggered for customer-to-admin transfer for orderId: {}", request.getOrderId());
        throw new PaymentFailedException("Wallet Service is currently unavailable. Payment could not be processed.");
    }

    @Override
    public InternalWalletTransferResponse transferAdminToCustomer(InternalWalletTransferRequest request) {
        log.error("WalletClientFallback triggered for admin-to-customer refund transfer for orderId: {}", request.getOrderId());
        throw new PaymentFailedException("Wallet Service is currently unavailable. Refund could not be processed.");
    }
}
