INSERT INTO reviews (id, product_id, customer_id, customer_username, rating, title, comment, is_verified_purchase, created_at, updated_at)
VALUES 
(1, 1, 3, 'customer1', 5, 'Exceptional performance!', 'This laptop handles heavy dev workloads and compilation like a dream. Battery lasts all day.', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE title=title;
