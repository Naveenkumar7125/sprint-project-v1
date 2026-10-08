-- Seed default user accounts for all roles (Password@123)
-- BCrypt hash for 'Password@123': $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a

INSERT INTO users (id, username, email, password, role, enabled, account_status, created_at) VALUES
(1, 'john_doe', 'john@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'CUSTOMER', TRUE, 'ACTIVE', NOW()),
(2, 'merchant_bob', 'merchant@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'MERCHANT', TRUE, 'ACTIVE', NOW()),
(3, 'admin_sarah', 'admin@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ADMIN', TRUE, 'ACTIVE', NOW()),
(4, 'delivery_dan', 'delivery@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'DELIVERY_AGENT', TRUE, 'ACTIVE', NOW()),
(10, 'admin', 'admin@eshoppingzone.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ADMIN', TRUE, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE 
    email=VALUES(email),
    password=VALUES(password),
    role=VALUES(role),
    enabled=VALUES(enabled),
    account_status=VALUES(account_status);
