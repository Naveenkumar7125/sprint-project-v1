package com.eshoppingzone.shipping.service.impl;

import com.eshoppingzone.common.dto.order.OrderDto;
import com.eshoppingzone.common.dto.order.OrderItemDto;
import com.eshoppingzone.common.dto.shipping.*;
import com.eshoppingzone.common.enums.ShipmentStatus;
import com.eshoppingzone.common.event.ShipmentCreatedEvent;
import com.eshoppingzone.common.event.ShipmentStatusUpdatedEvent;
import com.eshoppingzone.common.exception.ConflictException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.shipping.client.OrderClient;
import com.eshoppingzone.shipping.entity.Shipment;
import com.eshoppingzone.shipping.entity.ShipmentTrackingEvent;
import com.eshoppingzone.shipping.entity.WebhookEventLog;
import com.eshoppingzone.shipping.provider.ShippingProvider;
import com.eshoppingzone.shipping.provider.dto.ShipmentCreationRequest;
import com.eshoppingzone.shipping.provider.dto.ShipmentProviderResponse;
import com.eshoppingzone.shipping.provider.dto.TrackingProviderResponse;
import com.eshoppingzone.shipping.provider.impl.ShiprocketShippingProvider;
import com.eshoppingzone.shipping.repository.ShipmentRepository;
import com.eshoppingzone.shipping.repository.ShipmentTrackingEventRepository;
import com.eshoppingzone.shipping.repository.WebhookEventLogRepository;
import com.eshoppingzone.shipping.service.ShippingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingServiceImpl implements ShippingService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentTrackingEventRepository shipmentTrackingEventRepository;
    private final WebhookEventLogRepository webhookEventLogRepository;
    private final ShippingProvider shippingProvider;
    private final OrderClient orderClient;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.rabbitmq.exchange:eshoppingzone.exchange}")
    private String exchange;

    @Override
    @Transactional
    public List<ShipmentDto> processOrderShipments(OrderDto order) {
        if (order == null || order.getId() == null) {
            throw new ResourceNotFoundException("Order data is required to process shipments");
        }

        List<Shipment> existingShipments = shipmentRepository.findByOrderId(order.getId());
        if (!existingShipments.isEmpty()) {
            log.info("Shipments already exist for order ID: {}. Returning existing {} shipments.", order.getId(), existingShipments.size());
            return existingShipments.stream().map(this::mapToShipmentDto).collect(Collectors.toList());
        }

        // Multi-Vendor grouping: Group order line items by merchantId
        Map<Long, List<OrderItemDto>> vendorGroups = new HashMap<>();
        if (order.getItems() != null) {
            for (OrderItemDto item : order.getItems()) {
                Long merchantId = item.getMerchantId() != null ? item.getMerchantId() : 1L;
                vendorGroups.computeIfAbsent(merchantId, k -> new ArrayList<>()).add(item);
            }
        }

        List<ShipmentDto> createdShipmentDtos = new ArrayList<>();
        int vendorIndex = 1;

        for (Map.Entry<Long, List<OrderItemDto>> entry : vendorGroups.entrySet()) {
            Long merchantId = entry.getKey();
            List<OrderItemDto> vendorItems = entry.getValue();

            BigDecimal vendorTotal = vendorItems.stream()
                    .map(OrderItemDto::getTotalPrice)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String shipmentRef = String.format("SHIP-%s-V%d", order.getOrderNumber(), vendorIndex++);

            List<ShipmentCreationRequest.PackageItem> packageItems = vendorItems.stream()
                    .map(item -> ShipmentCreationRequest.PackageItem.builder()
                            .productId(item.getProductId())
                            .name(item.getProductName())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .build())
                    .collect(Collectors.toList());

            ShipmentCreationRequest creationReq = ShipmentCreationRequest.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .merchantId(merchantId)
                    .recipientName(order.getCustomerUsername())
                    .shippingAddress(order.getShippingAddressSnapshot())
                    .totalAmount(vendorTotal)
                    .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "WALLET")
                    .items(packageItems)
                    .build();

            ShipmentProviderResponse providerRes = shippingProvider.createShipment(creationReq);

            String itemsJson = "";
            try {
                itemsJson = objectMapper.writeValueAsString(packageItems);
            } catch (Exception ignored) {}

            Shipment shipment = Shipment.builder()
                    .shipmentReference(shipmentRef)
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .merchantId(merchantId)
                    .provider(shippingProvider.getProviderName())
                    .providerShipmentId(providerRes.getProviderShipmentId())
                    .trackingNumber(providerRes.getTrackingNumber())
                    .carrier(providerRes.getCarrier())
                    .trackingUrl(providerRes.getTrackingUrl())
                    .status(providerRes.getInitialStatus() != null ? providerRes.getInitialStatus() : ShipmentStatus.CONFIRMED)
                    .estimatedDelivery(providerRes.getEstimatedDelivery())
                    .shippingAddressSnapshot(order.getShippingAddressSnapshot())
                    .itemsSnapshot(itemsJson)
                    .build();

            Shipment savedShipment = shipmentRepository.save(shipment);

            // Create initial milestone event
            ShipmentTrackingEvent initialEvent = ShipmentTrackingEvent.builder()
                    .shipment(savedShipment)
                    .status(savedShipment.getStatus())
                    .location("Fulfillment Center")
                    .description("Shipment booked with " + savedShipment.getCarrier() + " (AWB: " + savedShipment.getTrackingNumber() + ")")
                    .eventTimestamp(Instant.now())
                    .build();
            shipmentTrackingEventRepository.save(initialEvent);

            // Publish ShipmentCreatedEvent
            try {
                ShipmentCreatedEvent event = ShipmentCreatedEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType("SHIPMENT_CREATED")
                        .timestamp(Instant.now())
                        .shipmentId(savedShipment.getId())
                        .shipmentReference(savedShipment.getShipmentReference())
                        .orderId(savedShipment.getOrderId())
                        .orderNumber(savedShipment.getOrderNumber())
                        .merchantId(savedShipment.getMerchantId())
                        .trackingNumber(savedShipment.getTrackingNumber())
                        .carrier(savedShipment.getCarrier())
                        .trackingUrl(savedShipment.getTrackingUrl())
                        .status(savedShipment.getStatus())
                        .estimatedDelivery(savedShipment.getEstimatedDelivery())
                        .build();

                rabbitTemplate.convertAndSend(exchange, "shipment.created", event);
                log.info("Published ShipmentCreatedEvent for AWB: {}", savedShipment.getTrackingNumber());
            } catch (Exception e) {
                log.error("Failed to publish ShipmentCreatedEvent: {}", e.getMessage());
            }

            createdShipmentDtos.add(mapToShipmentDto(savedShipment));
        }

        return createdShipmentDtos;
    }

    @Override
    @Transactional
    public List<ShipmentDto> processOrderShipmentsById(Long orderId) {
        OrderDto order = orderClient.getOrderById(orderId);
        if (order == null) {
            throw new ResourceNotFoundException("Order not found with ID: " + orderId);
        }
        return processOrderShipments(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderTrackingDto getOrderTracking(Long orderId) {
        List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
        if (shipments.isEmpty()) {
            try {
                // Trigger auto-creation if order was confirmed
                OrderDto order = orderClient.getOrderById(orderId);
                if (order != null) {
                    List<ShipmentDto> created = processOrderShipments(order);
                    return OrderTrackingDto.builder()
                            .orderId(orderId)
                            .orderNumber(order.getOrderNumber())
                            .totalShipments(created.size())
                            .shipments(created)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Could not lazily initialize shipments for order {}: {}", orderId, e.getMessage());
            }
            throw new ResourceNotFoundException("No shipments found for order ID: " + orderId);
        }

        List<ShipmentDto> shipmentDtos = shipments.stream()
                .map(this::mapToShipmentDto)
                .collect(Collectors.toList());

        return OrderTrackingDto.builder()
                .orderId(orderId)
                .orderNumber(shipments.get(0).getOrderNumber())
                .totalShipments(shipmentDtos.size())
                .shipments(shipmentDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentDto getShipmentByTrackingNumber(String trackingNumber) {
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with tracking number: " + trackingNumber));
        return mapToShipmentDto(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentDto getShipmentById(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + id));
        return mapToShipmentDto(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShipmentDto> getMerchantShipments(Long merchantId, Pageable pageable) {
        return shipmentRepository.findByMerchantId(merchantId, pageable).map(this::mapToShipmentDto);
    }

    @Override
    @Transactional
    public ShipmentDto handleWebhookEvent(ShippingWebhookPayload payload) {
        log.info("Processing shipping webhook event: {} for trackingNumber: {}", payload.getEventId(), payload.getTrackingNumber());

        // 1. Mandatory Idempotency Check
        if (webhookEventLogRepository.existsByEventId(payload.getEventId())) {
            log.warn("Webhook event {} already processed. Ignoring duplicate.", payload.getEventId());
            return shipmentRepository.findByTrackingNumber(payload.getTrackingNumber())
                    .map(this::mapToShipmentDto)
                    .orElse(null);
        }

        // 2. Log webhook event for deduplication
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception ignored) {}

        WebhookEventLog eventLog = WebhookEventLog.builder()
                .provider(shippingProvider.getProviderName())
                .eventId(payload.getEventId())
                .eventType(payload.getStatus())
                .payload(payloadJson)
                .processed(true)
                .build();
        webhookEventLogRepository.save(eventLog);

        // 3. Resolve Shipment
        Shipment shipment = shipmentRepository.findByTrackingNumber(payload.getTrackingNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for tracking number: " + payload.getTrackingNumber()));

        ShipmentStatus previousStatus = shipment.getStatus();
        ShipmentStatus newStatus = ShiprocketShippingProvider.mapThirdPartyStatus(payload.getStatus());

        // 4. Update Shipment Status
        shipment.setStatus(newStatus);
        if (payload.getCarrier() != null && !payload.getCarrier().isBlank()) {
            shipment.setCarrier(payload.getCarrier());
        }
        Shipment updatedShipment = shipmentRepository.save(shipment);

        // 5. Append Tracking Milestone Event
        ShipmentTrackingEvent trackingEvent = ShipmentTrackingEvent.builder()
                .shipment(updatedShipment)
                .status(newStatus)
                .location(payload.getLocation() != null ? payload.getLocation() : "Transit Facility")
                .description(payload.getDescription() != null ? payload.getDescription() : "Status updated to " + newStatus)
                .eventTimestamp(payload.getTimestamp() != null ? payload.getTimestamp() : Instant.now())
                .build();
        shipmentTrackingEventRepository.save(trackingEvent);

        // 6. Publish Status Updated Domain Event
        try {
            ShipmentStatusUpdatedEvent statusEvent = ShipmentStatusUpdatedEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType("SHIPMENT_STATUS_UPDATED")
                    .timestamp(Instant.now())
                    .shipmentId(updatedShipment.getId())
                    .trackingNumber(updatedShipment.getTrackingNumber())
                    .orderId(updatedShipment.getOrderId())
                    .previousStatus(previousStatus)
                    .currentStatus(newStatus)
                    .location(trackingEvent.getLocation())
                    .description(trackingEvent.getDescription())
                    .build();

            rabbitTemplate.convertAndSend(exchange, "shipment.status.updated", statusEvent);
            log.info("Published ShipmentStatusUpdatedEvent for tracking: {} ({} -> {})",
                    updatedShipment.getTrackingNumber(), previousStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to publish ShipmentStatusUpdatedEvent: {}", e.getMessage());
        }

        return mapToShipmentDto(updatedShipment);
    }

    @Override
    @Transactional
    public ShipmentDto createManualShipment(Long orderId, ManualShipRequest request, Long merchantId) {
        OrderDto order = orderClient.getOrderById(orderId);
        if (order == null) {
            throw new ResourceNotFoundException("Order not found with ID: " + orderId);
        }

        List<ShipmentDto> shipments = processOrderShipments(order);
        return shipments.stream()
                .filter(s -> s.getMerchantId().equals(merchantId))
                .findFirst()
                .orElse(shipments.isEmpty() ? null : shipments.get(0));
    }

    private ShipmentDto mapToShipmentDto(Shipment s) {
        List<ShipmentTrackingEvent> events = shipmentTrackingEventRepository.findByShipmentIdOrderByEventTimestampAsc(s.getId());
        List<ShipmentEventDto> eventDtos = events.stream()
                .map(e -> ShipmentEventDto.builder()
                        .id(e.getId())
                        .status(e.getStatus())
                        .location(e.getLocation())
                        .description(e.getDescription())
                        .eventTimestamp(e.getEventTimestamp())
                        .build())
                .collect(Collectors.toList());

        return ShipmentDto.builder()
                .id(s.getId())
                .shipmentReference(s.getShipmentReference())
                .orderId(s.getOrderId())
                .orderNumber(s.getOrderNumber())
                .merchantId(s.getMerchantId())
                .provider(s.getProvider())
                .providerShipmentId(s.getProviderShipmentId())
                .trackingNumber(s.getTrackingNumber())
                .carrier(s.getCarrier())
                .trackingUrl(s.getTrackingUrl())
                .status(s.getStatus())
                .estimatedDelivery(s.getEstimatedDelivery())
                .shippingAddressSnapshot(s.getShippingAddressSnapshot())
                .itemsSnapshot(s.getItemsSnapshot())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .trackingEvents(eventDtos)
                .build();
    }
}
