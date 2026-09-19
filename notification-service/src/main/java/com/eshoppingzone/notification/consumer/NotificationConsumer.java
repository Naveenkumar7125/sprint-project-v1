package com.eshoppingzone.notification.consumer;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.event.*;
import com.eshoppingzone.notification.config.RabbitMQConfig;
import com.eshoppingzone.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Processing UserRegisteredEvent for email: {}", event.getEmail());
        String subject = "Welcome to EShopping Zone!";
        String content = String.format("Hello %s,\n\nWelcome to EShopping Zone! Your account has been created successfully with role %s.",
                event.getUsername(), event.getRole());

        notificationService.createAndSend(event.getEmail(), event.getUserId(), subject, content, NotificationChannel.EMAIL, "USER_REGISTERED");
    }

    @RabbitListener(queues = RabbitMQConfig.PASSWORD_RESET_QUEUE)
    public void handlePasswordResetRequested(PasswordResetRequestedEvent event) {
        log.info("Processing PasswordResetRequestedEvent for email: {}", event.getEmail());
        String subject = "Password Reset Request - EShopping Zone";
        String content = String.format("Hello %s,\n\nA password reset was requested for your account.\n\nReset Link: %s\nReset Token: %s\n\nThis token will expire in 15 minutes. If you did not request this, please ignore.",
                event.getUsername() != null ? event.getUsername() : "Customer",
                event.getResetUrl() != null ? event.getResetUrl() : "N/A",
                event.getResetToken());

        notificationService.createAndSend(event.getEmail(), event.getUserId(), subject, content, NotificationChannel.EMAIL, "PASSWORD_RESET_REQUEST");
    }

    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE)
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Processing OrderConfirmedEvent for order: {}", event.getOrderNumber());
        String subject = "Order Confirmation - " + event.getOrderNumber();
        String content = String.format("Thank you for your purchase!\n\nOrder Number: %s\nTotal Amount: $%s\nStatus: CONFIRMED\n\nYour order is currently being prepared for shipment.",
                event.getOrderNumber(), event.getTotalAmount());

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "ORDER_CONFIRMED");
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Processing PaymentSuccessEvent for order: {}", event.getOrderId());
        String subject = "Payment Receipt for Order #" + event.getOrderId();
        String content = String.format("Your payment of $%s has been successfully processed via %s.\nTransaction Ref: %s",
                event.getAmount(), event.getPaymentMethod(), event.getPaymentReference());

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "PAYMENT_SUCCESS");
    }

    @RabbitListener(queues = RabbitMQConfig.REFUND_QUEUE)
    public void handleRefundCompleted(RefundCompletedEvent event) {
        log.info("Processing RefundCompletedEvent for order ID: {}", event.getOrderId());
        String subject = "Refund Processed - Order #" + event.getOrderId();
        String content = String.format("Your refund of $%s has been credited back to your EShopping Zone Digital Wallet.\nRefund Ref: %s",
                event.getAmount(), event.getRefundReference());

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "REFUND_COMPLETED");
    }

    @RabbitListener(queues = RabbitMQConfig.DELIVERY_QUEUE)
    public void handleDeliveryStatusChanged(DeliveryStatusChangedEvent event) {
        log.info("Processing DeliveryStatusChangedEvent for order ID: {}, Status: {}", event.getOrderId(), event.getNewStatus());
        String subject = "Shipment Tracking Update - Order #" + event.getOrderId();
        String content = String.format("Your shipment status has updated to: %s\nTracking Number: %s\nRemarks: %s",
                event.getNewStatus(), event.getTrackingNumber(), event.getRemarks() != null ? event.getRemarks() : "In transit");

        notificationService.createAndSend("customer@eshoppingzone.com", null, subject, content, NotificationChannel.EMAIL, "DELIVERY_STATUS");
    }

    @RabbitListener(queues = RabbitMQConfig.INVENTORY_QUEUE)
    public void handleLowStock(LowStockEvent event) {
        log.info("Processing LowStockEvent for product ID: {}", event.getProductId());
        String subject = "ALERT: Low Stock for Product " + event.getProductName();
        String content = String.format("Warning: Stock for product '%s' (ID: %s) has fallen to %s units (Threshold: %s). Please restock soon.",
                event.getProductName(), event.getProductId(), event.getAvailableStock(), event.getThreshold());

        notificationService.createAndSend("admin@eshoppingzone.com", 1L, subject, content, NotificationChannel.EMAIL, "LOW_STOCK_ALERT");
    }
}
