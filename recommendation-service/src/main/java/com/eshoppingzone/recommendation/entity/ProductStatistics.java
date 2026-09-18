package com.eshoppingzone.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "product_statistics", indexes = {
        @Index(name = "idx_stat_product", columnList = "product_id"),
        @Index(name = "idx_stat_pop_score", columnList = "popularity_score DESC"),
        @Index(name = "idx_stat_search", columnList = "search_count DESC"),
        @Index(name = "idx_stat_purchase", columnList = "purchase_count DESC")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(name = "search_count", nullable = false)
    @Builder.Default
    private Long searchCount = 0L;

    @Column(name = "purchase_count", nullable = false)
    @Builder.Default
    private Long purchaseCount = 0L;

    @Column(name = "average_rating", nullable = false)
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Long ratingCount = 0L;

    @Column(name = "popularity_score", nullable = false)
    @Builder.Default
    private Double popularityScore = 0.0;

    @Column(name = "last_calculated_at")
    private Instant lastCalculatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
