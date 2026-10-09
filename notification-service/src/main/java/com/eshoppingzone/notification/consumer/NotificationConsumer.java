package com.eshoppingzone.notification.consumer;

import com.eshoppingzone.notification.enums.NotificationChannel;
import com.eshoppingzone.notification.event.*;
import com.eshoppingzone.notification.config.RabbitMQConfig;
import com.eshoppingzone.notification.service.NotificationService;
import java.math.BigDecimal;
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
        String subject = "Welcome to EShopping Zone, " + event.getUsername() + "!";
        String content = String.format(
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
            "<div style='background: #0f172a; color: #ffffff; padding: 24px; text-align: center;'>" +
            "<div style='font-size: 22px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div>" +
            "<div style='font-size: 11px; color: #94a3b8; margin-top: 2px;'>Welcome to India's Next-Gen Distributed Retail Marketplace</div>" +
            "</div>" +
            "<div style='padding: 24px;'>" +
            "<div style='text-align: center; margin-bottom: 18px;'>" +
            "<span style='background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;'>ACCOUNT ACTIVATED • %s</span>" +
            "<h2 style='font-size: 18px; font-weight: 800; color: #0f172a; margin: 10px 0 4px;'>Welcome aboard, %s!</h2>" +
            "<p style='font-size: 13px; color: #475569; margin: 0;'>Your verified retail customer profile is active and ready for use.</p>" +
            "</div>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px;'>" +
            "<table style='width: 100%%; border-collapse: collapse;'>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Username:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Registered Email:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
            "<tr><td style='padding: 6px 0; color: #64748b;'>Digital Wallet:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #166534;'>✓ Active (Zero-Balance Ready)</td></tr>" +
            "</table>" +
            "</div>" +
            "<div style='text-align: center; margin: 18px 0;'>" +
            "<a href='http://localhost:4200/products' style='background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;'>Explore Catalog & Start Shopping →</a>" +
            "</div>" +
            "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
            "EShopping Zone • Customer Support: support@eshoppingzone.com" +
            "</div>" +
            "</div>" +
            "</div>",
            event.getRole() != null ? event.getRole() : "CUSTOMER",
            event.getUsername(),
            event.getUsername(),
            event.getEmail()
        );

        notificationService.createAndSend(event.getEmail(), event.getUserId(), subject, content, NotificationChannel.EMAIL, "USER_REGISTERED");
    }

    @RabbitListener(queues = RabbitMQConfig.PASSWORD_RESET_QUEUE)
    public void handlePasswordResetRequested(PasswordResetRequestedEvent event) {
        log.info("Processing PasswordResetRequestedEvent for email: {}", event.getEmail());
        String subject = "Security Verification: Password Reset Request";
        String content = String.format(
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
            "<div style='background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;'>" +
            "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Account Security Advisory</div></div>" +
            "<div><span style='background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px;'>SECURITY ALERT</span></div>" +
            "</div>" +
            "<div style='padding: 24px;'>" +
            "<p style='font-size: 14px; margin: 0 0 12px; color: #0f172a;'>Dear <strong>%s</strong>,</p>" +
            "<p style='font-size: 13px; color: #475569; line-height: 1.5; margin: 0 0 16px;'>A password reset request was initiated for your account. Please use the secure one-time verification token below to reset your credentials:</p>" +
            "<div style='background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px;'>" +
            "<div style='font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;'>One-Time Reset Security Token</div>" +
            "<div style='font-size: 20px; font-family: monospace; font-weight: 800; color: #0f172a; margin-top: 4px;'>%s</div>" +
            "</div>" +
            "<p style='font-size: 12px; color: #dc2626; font-weight: 600; margin-bottom: 20px;'>⏱ This security token is strictly valid for 15 minutes. If you did not request a password change, please disregard this email.</p>" +
            "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
            "EShopping Zone Security Operations • support@eshoppingzone.com" +
            "</div>" +
            "</div>" +
            "</div>",
            event.getUsername() != null ? event.getUsername() : "Customer",
            event.getResetToken()
        );

        notificationService.createAndSend(event.getEmail(), event.getUserId(), subject, content, NotificationChannel.EMAIL, "PASSWORD_RESET_REQUEST");
    }

    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE)
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Processing OrderConfirmedEvent for order: {}", event.getOrderNumber());
        String subject = "Official Tax Invoice & Order Confirmation: #" + event.getOrderNumber();

        StringBuilder itemRows = new StringBuilder();
        if (event.getItems() != null) {
            int idx = 1;
            for (OrderConfirmedEvent.OrderItemSummary item : event.getItems()) {
                itemRows.append(String.format(
                    "<tr style='border-bottom: 1px solid #e2e8f0;'>" +
                    "<td style='padding: 8px; text-align: center; font-family: monospace;'>%d</td>" +
                    "<td style='padding: 8px;'><strong style='color: #0f172a;'>%s</strong></td>" +
                    "<td style='padding: 8px; text-align: center;'>%d</td>" +
                    "<td style='padding: 8px; text-align: right;'>₹%.2f</td>" +
                    "<td style='padding: 8px; text-align: right; font-weight: 700;'>₹%.2f</td>" +
                    "</tr>",
                    idx++,
                    item.getProductName() != null ? item.getProductName() : ("Product #" + item.getProductId()),
                    item.getQuantity() != null ? item.getQuantity() : 1,
                    item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO,
                    item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO
                ));
            }
        }

        String content = String.format(
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; color: #1e293b;'>" +
            "<div style='background: #0f172a; color: #ffffff; padding: 20px; display: flex; justify-content: space-between; align-items: center;'>" +
            "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Retail Tax Invoice & Order Confirmation</div></div>" +
            "<div style='text-align: right;'><span style='background: #ffffff; color: #0f172a; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 4px;'>TAX INVOICE</span><div style='font-size: 12px; color: #cbd5e1; margin-top: 3px; font-family: monospace;'>INV-%s</div></div>" +
            "</div>" +
            "<div style='padding: 20px;'>" +
            "<table style='width: 100%%; border-collapse: collapse; margin-bottom: 16px;'>" +
            "<tr>" +
            "<td style='width: 50%%; vertical-align: top; padding-right: 8px;'>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;'>" +
            "<div style='font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;'>Customer Account</div>" +
            "<div style='font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;'>Customer #%d</div>" +
            "<div style='font-size: 11px; color: #64748b;'>Status: CONFIRMED</div>" +
            "</div>" +
            "</td>" +
            "<td style='width: 50%%; vertical-align: top; padding-left: 8px;'>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;'>" +
            "<div style='font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;'>Order Summary</div>" +
            "<div style='font-size: 12px; color: #0f172a;'><strong>Order Ref:</strong> #%s</div>" +
            "<div style='font-size: 11px; color: #166534; font-weight: 700; margin-top: 2px;'>✓ Payment Settled</div>" +
            "</div>" +
            "</td>" +
            "</tr>" +
            "</table>" +
            "<table style='width: 100%%; border-collapse: collapse; margin-bottom: 16px;'>" +
            "<thead><tr style='background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase;'><th style='padding: 8px; width: 30px;'>#</th><th style='padding: 8px; text-align: left;'>Product</th><th style='padding: 8px; text-align: center; width: 40px;'>Qty</th><th style='padding: 8px; text-align: right; width: 80px;'>Unit Price</th><th style='padding: 8px; text-align: right; width: 80px;'>Total</th></tr></thead>" +
            "<tbody>%s</tbody>" +
            "</table>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;'>" +
            "<div style='font-size: 12px; color: #64748b;'>Total Paid Amount (Incl. Taxes & Delivery):</div>" +
            "<div style='font-size: 16px; font-weight: 900; color: #0f172a;'>₹%.2f</div>" +
            "</div>" +
            "<div style='border-top: 1px solid #e2e8f0; margin-top: 16px; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8;'>" +
            "Computer-generated invoice issued by EShopping Zone • GSTIN: 29AAACE1234F1Z5 • Support: support@eshoppingzone.com" +
            "</div>" +
            "</div>" +
            "</div>",
            event.getOrderNumber(),
            event.getCustomerId(),
            event.getOrderNumber(),
            itemRows.toString(),
            event.getTotalAmount()
        );

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "ORDER_CONFIRMED");

        // Notify Merchants owning items in this order
        if (event.getItems() != null) {
            java.util.Set<Long> merchantIds = event.getItems().stream()
                    .map(OrderConfirmedEvent.OrderItemSummary::getMerchantId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());

            for (Long merchantId : merchantIds) {
                String merchantSubject = "New Order Received: #" + event.getOrderNumber();
                String merchantContent = String.format("Hello Merchant!\n\nA customer has placed order #%s containing your products.\nTotal Order Amount: $%s.\n\nPlease package the goods and click 'Ready for Pickup' in your Merchant Console to dispatch to courier agents.",
                        event.getOrderNumber(), event.getTotalAmount());
                notificationService.createAndSend("merchant" + merchantId + "@eshoppingzone.com", merchantId, merchantSubject, merchantContent, NotificationChannel.EMAIL, "MERCHANT_ORDER_NEW");
                log.info("Sent new order notification to merchant ID: {} for order #{}", merchantId, event.getOrderNumber());
            }
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Processing PaymentSuccessEvent for order: {}", event.getOrderId());
        String subject = "Payment Receipt: Order #" + event.getOrderId();
        String content = String.format(
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
            "<div style='background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;'>" +
            "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Official Payment Settlement Advice</div></div>" +
            "<div><span style='background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px;'>PAYMENT SETTLED</span></div>" +
            "</div>" +
            "<div style='padding: 24px;'>" +
            "<div style='background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 20px;'>" +
            "<div style='font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534;'>Amount Processed</div>" +
            "<div style='font-size: 26px; font-weight: 900; color: #15803d; margin: 4px 0;'>₹%.2f</div>" +
            "<div style='font-size: 12px; color: #166534; font-weight: 700;'>✓ Confirmed via %s</div>" +
            "</div>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px;'>" +
            "<table style='width: 100%%; border-collapse: collapse;'>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Order Reference:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>#%d</td></tr>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Transaction Ref:</td><td style='padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
            "<tr><td style='padding: 6px 0; color: #64748b;'>Settlement Status:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #15803d;'>SUCCESS</td></tr>" +
            "</table>" +
            "</div>" +
            "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
            "EShopping Zone Financial Services • support@eshoppingzone.com" +
            "</div>" +
            "</div>" +
            "</div>",
            event.getAmount() != null ? event.getAmount().doubleValue() : 0.0,
            event.getPaymentMethod() != null ? event.getPaymentMethod() : "WALLET",
            event.getOrderId(),
            event.getPaymentReference() != null ? event.getPaymentReference() : "TXN-AUTO"
        );

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "PAYMENT_SUCCESS");
    }

    @RabbitListener(queues = RabbitMQConfig.REFUND_QUEUE)
    public void handleRefundCompleted(RefundCompletedEvent event) {
        log.info("Processing RefundCompletedEvent for order ID: {}", event.getOrderId());
        String subject = "Refund Processed: Order #" + event.getOrderId();
        String content = String.format(
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
            "<div style='background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;'>" +
            "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Wallet Refund Confirmation</div></div>" +
            "<div><span style='background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px;'>REFUND CREDITED</span></div>" +
            "</div>" +
            "<div style='padding: 24px;'>" +
            "<div style='background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 20px;'>" +
            "<div style='font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534;'>Refund Credited to Digital Wallet</div>" +
            "<div style='font-size: 26px; font-weight: 900; color: #15803d; margin: 4px 0;'>+₹%.2f</div>" +
            "<div style='font-size: 12px; color: #166534; font-weight: 700;'>✓ Instant Settlement Completed</div>" +
            "</div>" +
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px;'>" +
            "<table style='width: 100%%; border-collapse: collapse;'>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Order Reference:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>#%d</td></tr>" +
            "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Refund Reference:</td><td style='padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
            "<tr><td style='padding: 6px 0; color: #64748b;'>Refund Destination:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>EShopping Digital Wallet</td></tr>" +
            "</table>" +
            "</div>" +
            "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
            "EShopping Zone Financial Services • support@eshoppingzone.com" +
            "</div>" +
            "</div>" +
            "</div>",
            event.getAmount() != null ? event.getAmount().doubleValue() : 0.0,
            event.getOrderId(),
            event.getRefundReference() != null ? event.getRefundReference() : "REF-AUTO"
        );

        notificationService.createAndSend("customer" + event.getCustomerId() + "@eshoppingzone.com", event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "REFUND_COMPLETED");
    }

    @RabbitListener(queues = RabbitMQConfig.DELIVERY_QUEUE)
    public void handleDeliveryStatusChanged(DeliveryStatusChangedEvent event) {
        log.info("Processing DeliveryStatusChangedEvent for order ID: {}, Status: {}, Customer ID: {}",
                event.getOrderId(), event.getNewStatus(), event.getCustomerId());

        String recipientEmail = event.getCustomerId() != null
                ? "customer" + event.getCustomerId() + "@eshoppingzone.com"
                : "customer@eshoppingzone.com";

        if (event.getNewStatus() == com.eshoppingzone.notification.enums.DeliveryStatus.DELIVERED) {
            String subject = "🎉 Package Delivered Successfully! Order #" + event.getOrderId();
            String agentName = event.getDeliveryAgentName() != null ? event.getDeliveryAgentName() : "Assigned Delivery Partner";
            String recipientName = event.getRecipientName() != null ? event.getRecipientName() : "Valued Customer";
            String shippingAddress = event.getShippingAddress() != null ? event.getShippingAddress() : "Registered Shipping Address";
            String remarks = event.getRemarks() != null ? event.getRemarks() : "Package handed over directly to recipient";

            String content = String.format(
                "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
                "<div style='background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;'>" +
                "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Logistics & Courier Delivery Network</div></div>" +
                "<div><span style='background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 4px;'>PACKAGE DELIVERED</span></div>" +
                "</div>" +
                "<div style='padding: 24px;'>" +
                "<div style='background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 20px;'>" +
                "<div style='font-size: 32px; margin-bottom: 6px;'>📦 ✨</div>" +
                "<div style='font-size: 16px; font-weight: 800; color: #15803d;'>Your Package Has Arrived!</div>" +
                "<p style='font-size: 13px; color: #166534; margin: 6px 0 0;'>Hello <strong>%s</strong>, order <strong>#%d</strong> has been safely delivered by <strong>%s</strong>.</p>" +
                "</div>" +
                "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px;'>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 8px 0; color: #64748b;'>Order Reference:</td><td style='padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;'>#%d</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 8px 0; color: #64748b;'>Tracking / Waybill:</td><td style='padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 8px 0; color: #64748b;'>Delivered By:</td><td style='padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 8px 0; color: #64748b;'>Recipient Name:</td><td style='padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 8px 0; color: #64748b;'>Delivered To:</td><td style='padding: 8px 0; text-align: right; color: #334155; font-size: 11px;'>%s</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #64748b;'>Handover Remarks:</td><td style='padding: 8px 0; text-align: right; color: #166534; font-weight: 600;'>%s</td></tr>" +
                "</table>" +
                "</div>" +
                "<div style='background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; margin-bottom: 20px; text-align: center;'>" +
                "<div style='font-size: 13px; font-weight: 700; color: #3730a3; margin-bottom: 6px;'>How was your purchase?</div>" +
                "<p style='font-size: 12px; color: #4338ca; margin: 0 0 12px;'>Share your thoughts and help other buyers in the EShopping Zone community.</p>" +
                "<a href='http://localhost:4200/orders' style='background: #4f46e5; color: #ffffff; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;'>Write a Product Review →</a>" +
                "</div>" +
                "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
                "EShopping Zone Logistics • support@eshoppingzone.com • Toll-free: 1800-ESZ-HELP" +
                "</div>" +
                "</div>" +
                "</div>",
                recipientName,
                event.getOrderId(),
                agentName,
                event.getOrderId(),
                event.getTrackingNumber() != null ? event.getTrackingNumber() : "TRK-EXP-001",
                agentName,
                recipientName,
                shippingAddress,
                remarks
            );

            notificationService.createAndSend(recipientEmail, event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "ORDER_DELIVERED");
        } else {
            String subject = "Shipment Tracking Update: Order #" + event.getOrderId();
            String content = String.format(
                "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>" +
                "<div style='background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;'>" +
                "<div><div style='font-size: 20px; font-weight: 900;'>EShopping<span style='color: #818cf8;'>Zone</span></div><div style='font-size: 11px; color: #94a3b8;'>Live Logistics & Courier Dispatch Network</div></div>" +
                "<div><span style='background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px;'>%s</span></div>" +
                "</div>" +
                "<div style='padding: 24px;'>" +
                "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px;'>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Order Reference:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;'>#%d</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Waybill / Tracking No:</td><td style='padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;'>%s</td></tr>" +
                "<tr style='border-bottom: 1px solid #e2e8f0;'><td style='padding: 6px 0; color: #64748b;'>Delivery Status:</td><td style='padding: 6px 0; text-align: right; font-weight: 700; color: #0369a1;'>%s</td></tr>" +
                "<tr><td style='padding: 6px 0; color: #64748b;'>Logistics Remarks:</td><td style='padding: 6px 0; text-align: right; color: #475569;'>%s</td></tr>" +
                "</table>" +
                "</div>" +
                "<div style='border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;'>" +
                "EShopping Zone Logistics • tracking@eshoppingzone.com" +
                "</div>" +
                "</div>" +
                "</div>",
                event.getNewStatus() != null ? event.getNewStatus().toString() : "IN_TRANSIT",
                event.getOrderId(),
                event.getTrackingNumber() != null ? event.getTrackingNumber() : "TRK-EXP-001",
                event.getNewStatus() != null ? event.getNewStatus().toString() : "IN_TRANSIT",
                event.getRemarks() != null ? event.getRemarks() : "Package status updated with verified delivery partner"
            );

            notificationService.createAndSend(recipientEmail, event.getCustomerId(), subject, content, NotificationChannel.EMAIL, "DELIVERY_STATUS");
        }
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
