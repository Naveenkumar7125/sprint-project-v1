package com.eshoppingzone.delivery.service;

import com.eshoppingzone.common.dto.delivery.DeliveryAssignmentRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import com.eshoppingzone.common.dto.delivery.DeliveryStatusUpdateRequest;
import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.common.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeliveryService {
    DeliveryDto createDelivery(DeliveryCreateRequest request);
    DeliveryDto assignDelivery(Long deliveryId, DeliveryAssignmentRequest request);
    DeliveryDto updateDeliveryStatus(Long deliveryId, DeliveryStatusUpdateRequest request, Long agentId, UserRole role);
    DeliveryDto getDeliveryById(Long id);
    DeliveryDto getDeliveryByOrderId(Long orderId);
    DeliveryDto getDeliveryByTrackingNumber(String trackingNumber);
    Page<DeliveryDto> getAgentDeliveries(Long agentId, Pageable pageable);
    Page<DeliveryDto> getAllDeliveries(DeliveryStatus status, Pageable pageable);
}
