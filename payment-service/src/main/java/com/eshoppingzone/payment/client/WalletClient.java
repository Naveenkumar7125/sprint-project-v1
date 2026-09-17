package com.eshoppingzone.payment.client;

import com.eshoppingzone.common.dto.wallet.InternalWalletTransferRequest;
import com.eshoppingzone.common.dto.wallet.InternalWalletTransferResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "wallet-service", fallback = WalletClientFallback.class)
public interface WalletClient {

    @PostMapping("/api/v1/wallet/internal/transfer/customer-to-admin")
    InternalWalletTransferResponse transferCustomerToAdmin(@RequestBody InternalWalletTransferRequest request);

    @PostMapping("/api/v1/wallet/internal/transfer/admin-to-customer")
    InternalWalletTransferResponse transferAdminToCustomer(@RequestBody InternalWalletTransferRequest request);
}
