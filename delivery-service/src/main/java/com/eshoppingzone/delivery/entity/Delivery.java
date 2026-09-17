package com.eshoppingzone.delivery.entity;

import com.eshoppingzone.common.enums.DeliveryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "deliveries", indexes = {
        @Index(name = "idx_deliv_order", columnList = "order_id"),
        @Index(name = "idx_deliv_track", columnList = "tracking_number"),
        @Index(name = "idx_deliv_agent", columnList = "delivery_agent_id"),
        @Index(name = "idx_deliv_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "tracking_number", nullable = false, unique = true, length = 60)
    private String trackingNumber;

    @Column(name = "delivery_agent_id")
    private Long deliveryAgentId;

    @Column(name = "delivery_agent_name", length = 100)
    private String deliveryAgentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryStatus status;

    @Column(name = "shipping_address_snapshot", nullable = false, length = 500)
    private String shippingAddressSnapshot;

    @Column(name = "customer_notes", length = 500)
    private String customerNotes;

    @Column(name = "estimated_delivery_time")
    private Instant estimatedDeliveryTime;

    @Column(name = "actual_delivery_time")
    private Instant actualDeliveryTime;

    @Version
    @Column(nullable = false)
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
