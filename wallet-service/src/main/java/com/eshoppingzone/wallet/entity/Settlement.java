package com.eshoppingzone.wallet.entity;

import com.eshoppingzone.wallet.enums.SettlementStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "settlements", indexes = {
        @Index(name = "idx_settlement_order", columnList = "order_id"),
        @Index(name = "idx_settlement_merchant", columnList = "merchant_id"),
        @Index(name = "idx_settlement_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_order_merchant", columnNames = {"order_id", "merchant_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Column(name = "gross_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "commission_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionPercentage;

    @Column(name = "platform_commission", nullable = false, precision = 19, scale = 2)
    private BigDecimal platformCommission;

    @Column(name = "merchant_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal merchantAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
