package com.eshoppingzone.wallet.controller;

import com.eshoppingzone.wallet.dto.MerchantWalletDto;
import com.eshoppingzone.wallet.dto.SettlementDto;
import com.eshoppingzone.wallet.dto.WalletTransactionDto;
import com.eshoppingzone.wallet.enums.SettlementStatus;
import com.eshoppingzone.wallet.enums.TransactionStatus;
import com.eshoppingzone.wallet.enums.TransactionType;
import com.eshoppingzone.wallet.enums.UserRole;
import com.eshoppingzone.wallet.enums.WalletStatus;
import com.eshoppingzone.wallet.security.SecurityUtils;
import com.eshoppingzone.wallet.security.UserPrincipal;
import com.eshoppingzone.wallet.service.SettlementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MerchantWalletControllerTest {

    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private MerchantWalletController controller;

    private final Long merchantId = 501L;

    @BeforeEach
    void setUp() {
        UserPrincipal principal = UserPrincipal.builder()
                .userId(merchantId)
                .username("merchant_sam")
                .email("sam@merchant.com")
                .role(UserRole.MERCHANT)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/merchant/wallet: Merchant gets own wallet with pending and available balance")
    void getMerchantWallet_Success() {
        MerchantWalletDto dto = MerchantWalletDto.builder()
                .id(1L)
                .merchantId(merchantId)
                .pendingBalance(new BigDecimal("1800.00"))
                .availableBalance(new BigDecimal("10000.00"))
                .totalBalance(new BigDecimal("10000.00"))
                .totalEarnings(new BigDecimal("25000.00"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        when(settlementService.getMerchantWallet(merchantId)).thenReturn(dto);

        ResponseEntity<MerchantWalletDto> response = controller.getMerchantWallet(null);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(new BigDecimal("1800.00"), response.getBody().getPendingBalance());
        assertEquals(new BigDecimal("10000.00"), response.getBody().getAvailableBalance());
        assertEquals(new BigDecimal("25000.00"), response.getBody().getTotalEarnings());
    }

    @Test
    @DisplayName("GET /api/merchant/settlements: Returns paginated settlement history")
    void getMerchantSettlements_Success() {
        SettlementDto s = SettlementDto.builder()
                .id(1L)
                .orderId(101L)
                .orderNumber("ORD-101")
                .merchantId(merchantId)
                .grossAmount(new BigDecimal("2000.00"))
                .platformCommission(new BigDecimal("200.00"))
                .merchantAmount(new BigDecimal("1800.00"))
                .status(SettlementStatus.AVAILABLE)
                .build();

        Page<SettlementDto> page = new PageImpl<>(List.of(s));
        when(settlementService.getMerchantSettlements(eq(merchantId), eq(SettlementStatus.AVAILABLE), any())).thenReturn(page);

        ResponseEntity<Page<SettlementDto>> response = controller.getMerchantSettlements(SettlementStatus.AVAILABLE, null, PageRequest.of(0, 20));

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().getTotalElements());
        assertEquals(new BigDecimal("1800.00"), response.getBody().getContent().get(0).getMerchantAmount());
    }
}
