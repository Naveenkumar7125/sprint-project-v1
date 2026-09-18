package com.eshoppingzone.shipping.service;

import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.shipping.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ShippingService {

    List<ShipmentDto> processOrderShipments(OrderDto order);

    List<ShipmentDto> processOrderShipmentsById(Long orderId);

    OrderTrackingDto getOrderTracking(Long orderId);

    ShipmentDto getShipmentByTrackingNumber(String trackingNumber);

    ShipmentDto getShipmentById(Long id);

    Page<ShipmentDto> getMerchantShipments(Long merchantId, Pageable pageable);

    ShipmentDto handleWebhookEvent(ShippingWebhookPayload payload);

    ShipmentDto createManualShipment(Long orderId, ManualShipRequest request, Long merchantId);
}
