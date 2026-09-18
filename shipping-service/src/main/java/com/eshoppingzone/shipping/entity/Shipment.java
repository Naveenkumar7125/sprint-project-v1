package com.eshoppingzone.shipping.entity;

import com.eshoppingzone.common.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shipments", indexes = {
        @Index(name = "idx_ship_order", columnList = "order_id"),
        @Index(name = "idx_ship_order_num", columnList = "order_number"),
        @Index(name = "idx_ship_merchant", columnList = "merchant_id"),
        @Index(name = "idx_ship_tracking", columnList = "tracking_number"),
        @Index(name = "idx_ship_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_reference", nullable = false, unique = true, length = 64)
    private String shipmentReference;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, length = 64)
    private String orderNumber;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String provider = "SHIPROCKET";

    @Column(name = "provider_shipment_id", length = 100)
    private String providerShipmentId;

    @Column(name = "tracking_number", nullable = false, unique = true, length = 100)
    private String trackingNumber;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String carrier = "Delhivery";

    @Column(name = "tracking_url", length = 500)
    private String trackingUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ShipmentStatus status = ShipmentStatus.CREATED;

    @Column(name = "estimated_delivery")
    private LocalDate estimatedDelivery;

    @Column(name = "shipping_address_snapshot", length = 1000)
    private String shippingAddressSnapshot;

    @Column(name = "items_snapshot", columnDefinition = "TEXT")
    private String itemsSnapshot;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("eventTimestamp ASC")
    @Builder.Default
    private List<ShipmentTrackingEvent> trackingEvents = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
