package com.eshoppingzone.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "inventory_history", indexes = {
        @Index(name = "idx_inv_hist_prod", columnList = "product_id"),
        @Index(name = "idx_inv_hist_order", columnList = "order_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "change_type", nullable = false, length = 30)
    private String changeType; // RESERVE, RELEASE, CONFIRM, MANUAL_UPDATE

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "available_stock_after", nullable = false)
    private Integer availableStockAfter;

    @Column(name = "reserved_stock_after", nullable = false)
    private Integer reservedStockAfter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
