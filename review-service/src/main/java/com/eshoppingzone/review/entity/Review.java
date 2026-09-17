package com.eshoppingzone.review.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(name = "uk_review_prod_cust", columnNames = {"product_id", "customer_id"})
}, indexes = {
        @Index(name = "idx_review_prod", columnList = "product_id"),
        @Index(name = "idx_review_cust", columnList = "customer_id"),
        @Index(name = "idx_review_rating", columnList = "rating")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "customer_username", nullable = false, length = 50)
    private String customerUsername;

    @Column(nullable = false)
    private Integer rating;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comment;

    @Column(name = "is_verified_purchase", nullable = false)
    @Builder.Default
    private Boolean isVerifiedPurchase = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
