package com.eshoppingzone.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "product_pair_associations",
        uniqueConstraints = @UniqueConstraint(name = "uk_prod_pair", columnNames = {"product_id_a", "product_id_b"}),
        indexes = {
                @Index(name = "idx_pair_a", columnList = "product_id_a"),
                @Index(name = "idx_pair_b", columnList = "product_id_b"),
                @Index(name = "idx_pair_count", columnList = "co_purchase_count DESC")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPairAssociation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id_a", nullable = false)
    private Long productIdA;

    @Column(name = "product_id_b", nullable = false)
    private Long productIdB;

    @Column(name = "co_purchase_count", nullable = false)
    @Builder.Default
    private Long coPurchaseCount = 1L;

    @UpdateTimestamp
    @Column(name = "last_co_purchased_at")
    private Instant lastCoPurchasedAt;
}
