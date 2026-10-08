package com.eshoppingzone.delivery.service;

import com.eshoppingzone.delivery.dto.DeliveryAssignmentRequest;
import com.eshoppingzone.delivery.dto.DeliveryCreateRequest;
import com.eshoppingzone.delivery.dto.DeliveryDto;
import com.eshoppingzone.delivery.dto.DeliveryStatusUpdateRequest;
import com.eshoppingzone.delivery.dto.DeliverySummaryDto;
import com.eshoppingzone.delivery.enums.DeliveryStatus;
import com.eshoppingzone.delivery.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeliveryService {
    DeliveryDto createDelivery(DeliveryCreateRequest request);
    DeliveryDto assignDelivery(Long deliveryId, DeliveryAssignmentRequest request);
    DeliveryDto acceptDelivery(Long deliveryId, Long agentId, String agentName);
    DeliveryDto updateDeliveryStatus(Long deliveryId, DeliveryStatusUpdateRequest request, Long agentId, UserRole role);
    DeliveryDto markReadyForPickup(Long deliveryId, Long merchantId, UserRole role, String remarks);
    Page<DeliveryDto> getMerchantDeliveries(Long merchantId, UserRole role, Pageable pageable);
    DeliveryDto getDeliveryById(Long id);
    DeliveryDto getDeliveryByOrderId(Long orderId);
    DeliveryDto getDeliveryByTrackingNumber(String trackingNumber);
    Page<DeliveryDto> getAvailableDeliveries(Pageable pageable);
    Page<DeliveryDto> getAgentDeliveries(Long agentId, Pageable pageable);
    Page<DeliveryDto> getAllDeliveries(DeliveryStatus status, Pageable pageable);
    DeliverySummaryDto getDeliverySummary();
}

