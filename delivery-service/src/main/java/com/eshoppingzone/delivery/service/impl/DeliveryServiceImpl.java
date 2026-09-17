package com.eshoppingzone.delivery.service.impl;

import com.eshoppingzone.common.dto.delivery.DeliveryAssignmentRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import com.eshoppingzone.common.dto.delivery.DeliveryStatusUpdateRequest;
import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.event.DeliveryStatusChangedEvent;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
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
                .trackingNumber(trackingNumber)
                .status(DeliveryStatus.CREATED)
                .shippingAddressSnapshot(request.getShippingAddressSnapshot())
                .customerNotes(request.getCustomerNotes())
                .estimatedDeliveryTime(Instant.now().plus(Duration.ofDays(3)))
                .build();

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery created with ID {} and tracking number {}", saved.getId(), trackingNumber);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DeliveryDto assignDelivery(Long deliveryId, DeliveryAssignmentRequest request) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.CREATED && delivery.getStatus() != DeliveryStatus.ASSIGNED) {
            throw new BadRequestException("Cannot re-assign delivery in current status: " + delivery.getStatus());
        }

        delivery.setDeliveryAgentId(request.getDeliveryAgentId());
        delivery.setStatus(DeliveryStatus.ASSIGNED);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} assigned to delivery agent ID {}", saved.getId(), request.getDeliveryAgentId());

        publishStatusEvent(saved, DeliveryStatus.CREATED, DeliveryStatus.ASSIGNED, "Assigned to agent");
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
        if (target == DeliveryStatus.DELIVERED) {
            delivery.setActualDeliveryTime(Instant.now());
        }

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery ID {} status transitioned from {} to {}", saved.getId(), current, target);

        publishStatusEvent(saved, current, target, request.getRemarks());
        return mapToDto(saved);
    }

    private void validateStatusTransition(DeliveryStatus current, DeliveryStatus target) {
        boolean valid = switch (current) {
            case CREATED -> target == DeliveryStatus.ASSIGNED || target == DeliveryStatus.CANCELLED;
            case ASSIGNED -> target == DeliveryStatus.ACCEPTED || target == DeliveryStatus.CANCELLED;
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

    private DeliveryDto mapToDto(Delivery delivery) {
        return DeliveryDto.builder()
                .id(delivery.getId())
                .orderId(delivery.getOrderId())
                .trackingNumber(delivery.getTrackingNumber())
                .deliveryAgentId(delivery.getDeliveryAgentId())
                .deliveryAgentName(delivery.getDeliveryAgentName())
                .status(delivery.getStatus())
                .shippingAddressSnapshot(delivery.getShippingAddressSnapshot())
                .customerNotes(delivery.getCustomerNotes())
                .estimatedDeliveryTime(delivery.getEstimatedDeliveryTime())
                .deliveredAt(delivery.getActualDeliveryTime())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt())
                .build();
    }
}
