package com.eshoppingzone.shipping.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentCreationRequest {
    private String orderNumber;
    private Long orderId;
    private Long merchantId;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private List<PackageItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackageItem {
        private Long productId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
