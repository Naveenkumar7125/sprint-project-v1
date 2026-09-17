INSERT INTO orders (id, order_number, customer_id, customer_username, customer_email, status, payment_method, total_amount, shipping_address_id, shipping_address_snapshot, cancellation_reason, version, created_at, updated_at)
VALUES 
(1, 'ORD-SEED0001', 3, 'customer1', 'customer1@eshoppingzone.com', 'DELIVERED', 'WALLET', 1299.99, 1, '123 Tech Park Blvd, Silicon Valley, CA, USA - 94025', NULL, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE order_number=order_number;

INSERT INTO order_items (id, order_id, product_id, product_name, product_image_url, merchant_id, unit_price, quantity, total_price)
VALUES 
(1, 1, 1, 'UltraBook Pro 15', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', 2, 1299.99, 1, 1299.99)
ON DUPLICATE KEY UPDATE product_name=product_name;
