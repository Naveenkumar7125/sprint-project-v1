package com.eshoppingzone.delivery.service.impl;

import com.eshoppingzone.delivery.dto.*;
import com.eshoppingzone.delivery.enums.DeliveryStatus;
import com.eshoppingzone.delivery.enums.UserRole;
import com.eshoppingzone.delivery.event.DeliveryStatusChangedEvent;
import com.eshoppingzone.delivery.exception.BadRequestException;
import com.eshoppingzone.delivery.exception.ForbiddenException;
import com.eshoppingzone.delivery.exception.ResourceNotFoundException;
import com.eshoppingzone.delivery.entity.Delivery;
import com.eshoppingzone.delivery.repository.DeliveryRepository;
import com.eshoppingzone.delivery.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    @Override
    @Transactional
    public DeliveryDto createDelivery(DeliveryCreateRequest request) {
        log.info("Creating delivery record for order ID: {}", request.getOrderId());

        if (deliveryRepository.findByOrderId(request.getOrderId()).isPresent()) {
            log.warn("Delivery record already exists for order ID: {}", request.getOrderId());
            return mapToDto(deliveryRepository.findByOrderId(request.getOrderId()).get());
        }

        String trackingNumber = "TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        Delivery delivery = Delivery.builder()
                .orderId(request.getOrderId())
                .customerId(request.getCustomerId())
                .merchantId(request.getMerchantId())
                .trackingNumber(trackingNumber)
                .status(DeliveryStatus.CREATED)
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .shippingAddressSnapshot(request.getShippingAddressSnapshot())
                .pickupAddressSnapshot(request.getPickupAddressSnapshot())
                .customerNotes(request.getCustomerNotes())
                .estimatedDeliveryTime(Instant.now().plus(Duration.ofDays(3)))
                .build();

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery created with ID {} and tracking number {} in CREATED status (Awaiting merchant preparation)", saved.getId(), trackingNumber);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DeliveryDto markReadyForPickup(Long deliveryId, Long merchantId, UserRole role, String remarks) {
        log.info("Merchant/Admin {} attempting to mark delivery ID {} ready for pickup", merchantId, deliveryId);
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (role == UserRole.MERCHANT && delivery.getMerchantId() != null && !delivery.getMerchantId().equals(merchantId)) {
            throw new ForbiddenException("You are not authorized to manage shipments for other merchants");
        }

        if (delivery.getStatus() != DeliveryStatus.CREATED && delivery.getStatus() != DeliveryStatus.AVAILABLE) {
            throw new BadRequestException("Delivery is already in status " + delivery.getStatus() + " and cannot be set to Ready for Pickup");
        }

        DeliveryStatus prevStatus = delivery.getStatus();
        delivery.setStatus(DeliveryStatus.AVAILABLE);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} marked as AVAILABLE (Ready for Pickup) by merchant ID {}", saved.getId(), merchantId);

        String note = remarks != null ? remarks : "Merchant packaged items and marked ready for courier pickup";
        publishStatusEvent(saved, prevStatus, DeliveryStatus.AVAILABLE, note);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryDto> getMerchantDeliveries(Long merchantId, UserRole role, Pageable pageable) {
        if (role == UserRole.ADMIN) {
            return deliveryRepository.findAll(pageable).map(this::mapToDto);
        }
        return deliveryRepository.findByMerchantId(merchantId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional
    public DeliveryDto assignDelivery(Long deliveryId, DeliveryAssignmentRequest request) {
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.AVAILABLE &&
            delivery.getStatus() != DeliveryStatus.CREATED &&
            delivery.getStatus() != DeliveryStatus.ASSIGNED) {
            throw new BadRequestException("Cannot assign or re-assign delivery in current status: " + delivery.getStatus());
        }

        DeliveryStatus prevStatus = delivery.getStatus();
        delivery.setDeliveryAgentId(request.getDeliveryAgentId());
        delivery.setDeliveryAgentName(request.getDeliveryAgentName() != null ? request.getDeliveryAgentName() : "Agent #" + request.getDeliveryAgentId());
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(Instant.now());

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} assigned to delivery agent ID {}", saved.getId(), request.getDeliveryAgentId());

        publishStatusEvent(saved, prevStatus, DeliveryStatus.ASSIGNED, "Assigned to agent by Admin");
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DeliveryDto acceptDelivery(Long deliveryId, Long agentId, String agentName) {
        log.info("Delivery Agent {} attempting to self-accept delivery ID {}", agentId, deliveryId);

        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() == DeliveryStatus.CREATED) {
            throw new BadRequestException("This order is still being prepared by the merchant and has not been marked 'Ready for Pickup' yet.");
        }

        if (delivery.getStatus() != DeliveryStatus.AVAILABLE || delivery.getDeliveryAgentId() != null) {
            throw new BadRequestException("Delivery is no longer available for assignment.");
        }

        DeliveryStatus prevStatus = delivery.getStatus();
        delivery.setDeliveryAgentId(agentId);
        delivery.setDeliveryAgentName(agentName != null ? agentName : "Agent #" + agentId);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(Instant.now());

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} accepted by agent ID {}", saved.getId(), agentId);

        publishStatusEvent(saved, prevStatus, DeliveryStatus.ASSIGNED, "Accepted by delivery agent: " + delivery.getDeliveryAgentName());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DeliveryDto updateDeliveryStatus(Long deliveryId, DeliveryStatusUpdateRequest request, Long agentId, UserRole role) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (role == UserRole.DELIVERY_AGENT) {
            if (delivery.getDeliveryAgentId() == null || !delivery.getDeliveryAgentId().equals(agentId)) {
                throw new ForbiddenException("You are not assigned to this delivery task");
            }
        }

        DeliveryStatus current = delivery.getStatus();
        DeliveryStatus target = request.getStatus();

        // Validate lifecycle transition if not admin
        if (role != UserRole.ADMIN) {
            validateStatusTransition(current, target);
        }

        delivery.setStatus(target);
        if (target == DeliveryStatus.PICKED_UP) {
            delivery.setPickedUpAt(Instant.now());
        } else if (target == DeliveryStatus.DELIVERED) {
            delivery.setActualDeliveryTime(Instant.now());
        } else if (target == DeliveryStatus.AVAILABLE) {
            // Reassignment flow / agent cancellation
            delivery.setDeliveryAgentId(null);
            delivery.setDeliveryAgentName(null);
            delivery.setAssignedAt(null);
            delivery.setPickedUpAt(null);
        }

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} status transitioned from {} to {}", saved.getId(), current, target);

        publishStatusEvent(saved, current, target, request.getRemarks());
        return mapToDto(saved);
    }

    private void validateStatusTransition(DeliveryStatus current, DeliveryStatus target) {
        boolean valid = switch (current) {
            case CREATED, AVAILABLE -> target == DeliveryStatus.ASSIGNED || target == DeliveryStatus.CANCELLED;
            case ASSIGNED -> target == DeliveryStatus.PICKED_UP || target == DeliveryStatus.ACCEPTED || target == DeliveryStatus.AVAILABLE || target == DeliveryStatus.CANCELLED;
            case ACCEPTED -> target == DeliveryStatus.PICKED_UP || target == DeliveryStatus.CANCELLED;
            case PICKED_UP -> target == DeliveryStatus.OUT_FOR_DELIVERY || target == DeliveryStatus.FAILED;
            case OUT_FOR_DELIVERY -> target == DeliveryStatus.DELIVERED || target == DeliveryStatus.FAILED;
            case DELIVERED, CANCELLED, FAILED -> false;
        };

        if (!valid) {
            throw new BadRequestException("Invalid delivery status transition from " + current + " to " + target);
        }
    }

    private void publishStatusEvent(Delivery delivery, DeliveryStatus prev, DeliveryStatus next, String remarks) {
        try {
            DeliveryStatusChangedEvent event = DeliveryStatusChangedEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .timestamp(Instant.now())
                    .deliveryId(delivery.getId())
                    .orderId(delivery.getOrderId())
                    .trackingNumber(delivery.getTrackingNumber())
                    .previousStatus(prev)
                    .newStatus(next)
                    .deliveryAgentId(delivery.getDeliveryAgentId())
                    .remarks(remarks)
                    .build();

            rabbitTemplate.convertAndSend(exchange, "delivery.status.changed", event);
            log.info("Published DeliveryStatusChangedEvent for delivery ID: {}", delivery.getId());
        } catch (Exception e) {
            log.error("Failed to publish DeliveryStatusChangedEvent: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryDto getDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryDto getDeliveryByOrderId(Long orderId) {
        return deliveryRepository.findByOrderId(orderId)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order id: " + orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryDto getDeliveryByTrackingNumber(String trackingNumber) {
        return deliveryRepository.findByTrackingNumber(trackingNumber)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with tracking number: " + trackingNumber));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryDto> getAvailableDeliveries(Pageable pageable) {
        return deliveryRepository.findAvailableDeliveries(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryDto> getAgentDeliveries(Long agentId, Pageable pageable) {
        return deliveryRepository.findByDeliveryAgentId(agentId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryDto> getAllDeliveries(DeliveryStatus status, Pageable pageable) {
        if (status != null) {
            return deliveryRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return deliveryRepository.findAll(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliverySummaryDto getDeliverySummary() {
        long total = deliveryRepository.count();
        long available = deliveryRepository.countByStatus(DeliveryStatus.AVAILABLE) + deliveryRepository.countByStatus(DeliveryStatus.CREATED);
        long assigned = deliveryRepository.countByStatus(DeliveryStatus.ASSIGNED) + deliveryRepository.countByStatus(DeliveryStatus.ACCEPTED);
        long pickedUp = deliveryRepository.countByStatus(DeliveryStatus.PICKED_UP);
        long outForDelivery = deliveryRepository.countByStatus(DeliveryStatus.OUT_FOR_DELIVERY);
        long delivered = deliveryRepository.countByStatus(DeliveryStatus.DELIVERED);
        long failed = deliveryRepository.countByStatus(DeliveryStatus.FAILED);
        long cancelled = deliveryRepository.countByStatus(DeliveryStatus.CANCELLED);

        return DeliverySummaryDto.builder()
                .totalDeliveries(total)
                .availableDeliveries(available)
                .assignedDeliveries(assigned)
                .pickedUpDeliveries(pickedUp)
                .outForDeliveryDeliveries(outForDelivery)
                .deliveredDeliveries(delivered)
                .failedDeliveries(failed)
                .cancelledDeliveries(cancelled)
                .build();
    }

    private DeliveryDto mapToDto(Delivery delivery) {
        return DeliveryDto.builder()
                .id(delivery.getId())
                .orderId(delivery.getOrderId())
                .customerId(delivery.getCustomerId())
                .merchantId(delivery.getMerchantId())
                .trackingNumber(delivery.getTrackingNumber())
                .deliveryAgentId(delivery.getDeliveryAgentId())
                .deliveryAgentName(delivery.getDeliveryAgentName())
                .status(delivery.getStatus())
                .recipientName(delivery.getRecipientName())
                .recipientPhone(delivery.getRecipientPhone())
                .deliveryAddress(delivery.getShippingAddressSnapshot())
                .shippingAddressSnapshot(delivery.getShippingAddressSnapshot())
                .pickupAddressSnapshot(delivery.getPickupAddressSnapshot())
                .customerNotes(delivery.getCustomerNotes())
                .estimatedDeliveryTime(delivery.getEstimatedDeliveryTime())
                .assignedAt(delivery.getAssignedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getActualDeliveryTime())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt())
                .build();
    }
}

