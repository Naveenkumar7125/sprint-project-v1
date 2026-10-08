package com.eshoppingzone.delivery.service;

import com.eshoppingzone.delivery.dto.DeliveryAssignmentRequest;
import com.eshoppingzone.delivery.dto.DeliveryCreateRequest;
import com.eshoppingzone.delivery.dto.DeliveryDto;
import com.eshoppingzone.delivery.dto.DeliveryStatusUpdateRequest;
import com.eshoppingzone.delivery.dto.DeliverySummaryDto;
import com.eshoppingzone.delivery.enums.DeliveryStatus;
import com.eshoppingzone.delivery.enums.UserRole;
import com.eshoppingzone.delivery.exception.BadRequestException;
import com.eshoppingzone.delivery.exception.ForbiddenException;
import com.eshoppingzone.delivery.entity.Delivery;
import com.eshoppingzone.delivery.repository.DeliveryRepository;
import com.eshoppingzone.delivery.service.impl.DeliveryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private DeliveryServiceImpl deliveryService;

    @Test
    @DisplayName("Create Delivery - Starts as AVAILABLE")
    void testCreateDelivery_Success() {
        DeliveryCreateRequest request = DeliveryCreateRequest.builder()
                .orderId(100L)
                .customerId(50L)
                .merchantId(101L)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .customerNotes("Ring bell")
                .build();

        Delivery saved = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .customerId(50L)
                .merchantId(101L)
                .trackingNumber("TRK-1234567890")
                .status(DeliveryStatus.AVAILABLE)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .customerNotes("Ring bell")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(deliveryRepository.findByOrderId(100L)).thenReturn(Optional.empty());
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(saved);

        DeliveryDto dto = deliveryService.createDelivery(request);

        assertNotNull(dto);
        assertEquals(DeliveryStatus.AVAILABLE, dto.getStatus());
        assertEquals("TRK-1234567890", dto.getTrackingNumber());
        assertEquals(50L, dto.getCustomerId());
        assertEquals(101L, dto.getMerchantId());
    }

    @Test
    @DisplayName("Delivery Agent Self-Accepts Available Delivery - Success")
    void testAcceptDelivery_Success() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .status(DeliveryStatus.AVAILABLE)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        when(deliveryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(existing));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(existing);

        DeliveryDto dto = deliveryService.acceptDelivery(1L, 4L, "delivery_dan");

        assertNotNull(dto);
        assertEquals(DeliveryStatus.ASSIGNED, dto.getStatus());
        assertEquals(4L, dto.getDeliveryAgentId());
        assertEquals("delivery_dan", dto.getDeliveryAgentName());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("delivery.status.changed"), any(Object.class));
    }

    @Test
    @DisplayName("Delivery Agent Self-Accept - Already Assigned Throws BadRequestException")
    void testAcceptDelivery_AlreadyAssigned_ThrowsException() {
        Delivery alreadyAssigned = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .deliveryAgentId(9L)
                .status(DeliveryStatus.ASSIGNED)
                .build();

        when(deliveryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(alreadyAssigned));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                deliveryService.acceptDelivery(1L, 4L, "delivery_dan"));

        assertEquals("Delivery is no longer available.", ex.getMessage());
    }

    @Test
    @DisplayName("Assign Delivery to Agent by Admin - Success")
    void testAssignDelivery_Success() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .status(DeliveryStatus.AVAILABLE)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        DeliveryAssignmentRequest assignReq = DeliveryAssignmentRequest.builder()
                .deliveryAgentId(4L)
                .deliveryAgentName("delivery_dan")
                .build();

        when(deliveryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(existing));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(existing);

        DeliveryDto dto = deliveryService.assignDelivery(1L, assignReq);

        assertNotNull(dto);
        assertEquals(DeliveryStatus.ASSIGNED, dto.getStatus());
        assertEquals(4L, dto.getDeliveryAgentId());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("delivery.status.changed"), any(Object.class));
    }

    @Test
    @DisplayName("Update Delivery Status - Valid Lifecycle Step - Success")
    void testUpdateDeliveryStatus_Success() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .deliveryAgentId(4L)
                .status(DeliveryStatus.OUT_FOR_DELIVERY)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        DeliveryStatusUpdateRequest updateReq = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.DELIVERED)
                .remarks("Delivered to customer")
                .build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(existing);

        DeliveryDto dto = deliveryService.updateDeliveryStatus(1L, updateReq, 4L, UserRole.DELIVERY_AGENT);

        assertNotNull(dto);
        assertEquals(DeliveryStatus.DELIVERED, dto.getStatus());
        assertNotNull(dto.getDeliveredAt());
        verify(rabbitTemplate, times(1)).convertAndSend(any(), eq("delivery.status.changed"), any(Object.class));
    }

    @Test
    @DisplayName("Update Delivery Status - Invalid Transition - Throws BadRequestException")
    void testUpdateDeliveryStatus_InvalidTransition() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .deliveryAgentId(4L)
                .status(DeliveryStatus.ASSIGNED)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        DeliveryStatusUpdateRequest updateReq = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.DELIVERED) // Jump from ASSIGNED to DELIVERED directly without PICKED_UP
                .build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () ->
                deliveryService.updateDeliveryStatus(1L, updateReq, 4L, UserRole.DELIVERY_AGENT));
    }

    @Test
    @DisplayName("Update Delivery Status - Wrong Agent - Throws ForbiddenException")
    void testUpdateDeliveryStatus_WrongAgent() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .deliveryAgentId(4L)
                .status(DeliveryStatus.ASSIGNED)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        DeliveryStatusUpdateRequest updateReq = DeliveryStatusUpdateRequest.builder()
                .status(DeliveryStatus.PICKED_UP)
                .build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () ->
                deliveryService.updateDeliveryStatus(1L, updateReq, 999L, UserRole.DELIVERY_AGENT));
    }

    @Test
    @DisplayName("Get Delivery Summary - Returns Counts")
    void testGetDeliverySummary() {
        when(deliveryRepository.count()).thenReturn(10L);
        when(deliveryRepository.countByStatus(DeliveryStatus.AVAILABLE)).thenReturn(3L);
        when(deliveryRepository.countByStatus(DeliveryStatus.CREATED)).thenReturn(0L);
        when(deliveryRepository.countByStatus(DeliveryStatus.ASSIGNED)).thenReturn(2L);
        when(deliveryRepository.countByStatus(DeliveryStatus.ACCEPTED)).thenReturn(0L);
        when(deliveryRepository.countByStatus(DeliveryStatus.PICKED_UP)).thenReturn(2L);
        when(deliveryRepository.countByStatus(DeliveryStatus.OUT_FOR_DELIVERY)).thenReturn(1L);
        when(deliveryRepository.countByStatus(DeliveryStatus.DELIVERED)).thenReturn(2L);
        when(deliveryRepository.countByStatus(DeliveryStatus.FAILED)).thenReturn(0L);
        when(deliveryRepository.countByStatus(DeliveryStatus.CANCELLED)).thenReturn(0L);

        DeliverySummaryDto summary = deliveryService.getDeliverySummary();

        assertNotNull(summary);
        assertEquals(10L, summary.getTotalDeliveries());
        assertEquals(3L, summary.getAvailableDeliveries());
        assertEquals(2L, summary.getAssignedDeliveries());
        assertEquals(2L, summary.getDeliveredDeliveries());
    }
}

