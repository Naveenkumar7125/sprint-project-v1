INSERT INTO notifications (id, recipient_email, recipient_user_id, subject, content, channel, status, template_name, error_message, sent_at, created_at, updated_at)
VALUES 
(1, 'customer1@eshoppingzone.com', 3, 'Welcome to EShopping Zone!', 'Hello customer1, Welcome to EShopping Zone!', 'EMAIL', 'SENT', 'USER_REGISTERED', NULL, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE recipient_email=recipient_email;
