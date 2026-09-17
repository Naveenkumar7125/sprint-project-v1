INSERT INTO deliveries (id, order_id, tracking_number, delivery_agent_id, delivery_agent_name, status, shipping_address_snapshot, customer_notes, estimated_delivery_time, actual_delivery_time, version, created_at, updated_at)
VALUES 
(1, 1, 'TRK-SEED00001', 4, 'agent1', 'DELIVERED', '123 Tech Park Blvd, Silicon Valley, CA, USA - 94025', 'Leave at front door', NOW(), NOW(), 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE tracking_number=tracking_number;
