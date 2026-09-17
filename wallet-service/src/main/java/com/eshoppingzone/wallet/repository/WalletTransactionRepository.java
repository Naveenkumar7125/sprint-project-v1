package com.eshoppingzone.wallet.repository;

import com.eshoppingzone.wallet.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction> findByTransactionReference(String transactionReference);

    Page<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId, Pageable pageable);
}
