package com.eshoppingzone.delivery.service;

import com.eshoppingzone.common.dto.delivery.DeliveryAssignmentRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import com.eshoppingzone.common.dto.delivery.DeliveryStatusUpdateRequest;
import com.eshoppingzone.common.enums.DeliveryStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ForbiddenException;
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
    @DisplayName("Create Delivery - Success")
    void testCreateDelivery_Success() {
        DeliveryCreateRequest request = DeliveryCreateRequest.builder()
                .orderId(100L)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .customerNotes("Ring bell")
                .build();

        Delivery saved = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .status(DeliveryStatus.CREATED)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .customerNotes("Ring bell")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(deliveryRepository.findByOrderId(100L)).thenReturn(Optional.empty());
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(saved);

        DeliveryDto dto = deliveryService.createDelivery(request);

        assertNotNull(dto);
        assertEquals(DeliveryStatus.CREATED, dto.getStatus());
        assertEquals("TRK-1234567890", dto.getTrackingNumber());
    }

    @Test
    @DisplayName("Assign Delivery to Agent - Success")
    void testAssignDelivery_Success() {
        Delivery existing = Delivery.builder()
                .id(1L)
                .orderId(100L)
                .trackingNumber("TRK-1234567890")
                .status(DeliveryStatus.CREATED)
                .shippingAddressSnapshot("123 Main St, Springfield")
                .build();

        DeliveryAssignmentRequest assignReq = DeliveryAssignmentRequest.builder()
                .deliveryAgentId(4L)
                .build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(existing));
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
                .status(DeliveryStatus.DELIVERED) // Jump from ASSIGNED to DELIVERED directly
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
                .status(DeliveryStatus.ACCEPTED)
                .build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () ->
                deliveryService.updateDeliveryStatus(1L, updateReq, 999L, UserRole.DELIVERY_AGENT));
    }
}
