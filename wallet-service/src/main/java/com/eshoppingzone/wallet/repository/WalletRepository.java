package com.eshoppingzone.wallet.repository;

import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    List<Wallet> findByRole(UserRole role);

    @Query("SELECT w FROM Wallet w WHERE w.role = 'ADMIN' ORDER BY w.id ASC")
    List<Wallet> findAdminWallets();
}
