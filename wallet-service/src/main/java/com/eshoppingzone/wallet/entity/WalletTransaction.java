package com.eshoppingzone.wallet.entity;

import com.eshoppingzone.common.enums.TransactionStatus;
import com.eshoppingzone.common.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_transactions", indexes = {
        @Index(name = "idx_wt_wallet", columnList = "wallet_id"),
        @Index(name = "idx_wt_user", columnList = "user_id"),
        @Index(name = "idx_wt_reference", columnList = "transaction_reference")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_reference", nullable = false, unique = true, length = 100)
    private String transactionReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_after", nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionStatus status;

    @Column(length = 255)
    private String description;

    @Column(name = "source_party", length = 100)
    private String sourceParty;

    @Column(name = "destination_party", length = 100)
    private String destinationParty;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
