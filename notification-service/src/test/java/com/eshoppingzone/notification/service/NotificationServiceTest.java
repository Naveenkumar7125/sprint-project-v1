package com.eshoppingzone.notification.service;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.enums.NotificationStatus;
import com.eshoppingzone.common.event.OrderConfirmedEvent;
import com.eshoppingzone.common.event.PasswordResetRequestedEvent;
import com.eshoppingzone.common.event.UserRegisteredEvent;
import com.eshoppingzone.notification.consumer.NotificationConsumer;
import com.eshoppingzone.notification.dto.NotificationDto;
import com.eshoppingzone.notification.dto.SendNotificationRequest;
import com.eshoppingzone.notification.entity.Notification;
import com.eshoppingzone.notification.repository.NotificationRepository;
import com.eshoppingzone.notification.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    @DisplayName("Send Custom Notification - Success")
    void testSendNotification_Success() {
        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientEmail("user@example.com")
                .recipientUserId(5L)
                .subject("Test Subject")
                .content("Test Content")
                .channel(NotificationChannel.EMAIL)
                .build();

        Notification saved = Notification.builder()
                .id(1L)
                .recipientEmail("user@example.com")
                .recipientUserId(5L)
                .subject("Test Subject")
                .content("Test Content")
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.SENT)
                .sentAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        NotificationDto dto = notificationService.sendNotification(request);

        assertNotNull(dto);
        assertEquals(NotificationStatus.SENT, dto.getStatus());
        verify(emailService, times(1)).sendEmail(eq("user@example.com"), eq("Test Subject"), eq("Test Content"));
    }

    @Test
    @DisplayName("Create and Send Notification via Template - Success")
    void testCreateAndSend_Success() {
        Notification saved = Notification.builder()
                .id(2L)
                .recipientEmail("test@example.com")
                .recipientUserId(10L)
                .subject("Welcome")
                .content("Welcome body")
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.SENT)
                .templateName("USER_REGISTERED")
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        notificationService.createAndSend("test@example.com", 10L, "Welcome", "Welcome body", NotificationChannel.EMAIL, "USER_REGISTERED");

        verify(emailService, times(1)).sendEmail(eq("test@example.com"), eq("Welcome"), eq("Welcome body"));
    }

    @Test
    @DisplayName("Notification Consumer - Handle UserRegisteredEvent")
    void testConsumer_UserRegisteredEvent() {
        NotificationService mockNotifService = mock(NotificationService.class);
        NotificationConsumer consumer = new NotificationConsumer(mockNotifService);

        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .userId(1L)
                .username("john")
                .email("john@example.com")
                .role(com.eshoppingzone.common.enums.UserRole.CUSTOMER)
                .build();

        consumer.handleUserRegistered(event);

        verify(mockNotifService, times(1)).createAndSend(
                eq("john@example.com"),
                eq(1L),
                eq("Welcome to EShopping Zone!"),
                anyString(),
                eq(NotificationChannel.EMAIL),
                eq("USER_REGISTERED")
        );
    }

    @Test
    @DisplayName("Notification Consumer - Handle PasswordResetRequestedEvent")
    void testConsumer_PasswordResetRequestedEvent() {
        NotificationService mockNotifService = mock(NotificationService.class);
        NotificationConsumer consumer = new NotificationConsumer(mockNotifService);

        PasswordResetRequestedEvent event = PasswordResetRequestedEvent.builder()
                .userId(2L)
                .email("alex@example.com")
                .resetToken("sample-reset-token")
                .build();

        consumer.handlePasswordResetRequested(event);

        verify(mockNotifService, times(1)).createAndSend(
                eq("alex@example.com"),
                eq(2L),
                eq("Password Reset Request - EShopping Zone"),
                contains("sample-reset-token"),
                eq(NotificationChannel.EMAIL),
                eq("PASSWORD_RESET_REQUEST")
        );
    }

    @Test
    @DisplayName("Notification Consumer - Handle OrderConfirmedEvent")
    void testConsumer_OrderConfirmedEvent() {
        NotificationService mockNotifService = mock(NotificationService.class);
        NotificationConsumer consumer = new NotificationConsumer(mockNotifService);

        OrderConfirmedEvent event = OrderConfirmedEvent.builder()
                .orderId(10L)
                .orderNumber("ORD-987654")
                .customerId(3L)
                .totalAmount(new BigDecimal("150.00"))
                .build();

        consumer.handleOrderConfirmed(event);

        verify(mockNotifService, times(1)).createAndSend(
                eq("customer3@eshoppingzone.com"),
                eq(3L),
                eq("Order Confirmation - ORD-987654"),
                contains("ORD-987654"),
                eq(NotificationChannel.EMAIL),
                eq("ORDER_CONFIRMED")
        );
    }
}
