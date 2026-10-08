ALTER TABLE deliveries ADD COLUMN pickup_address_snapshot VARCHAR(500) NULL AFTER shipping_address_snapshot;
ALTER TABLE deliveries ADD COLUMN assigned_at TIMESTAMP NULL AFTER actual_delivery_time;
ALTER TABLE deliveries ADD COLUMN picked_up_at TIMESTAMP NULL AFTER assigned_at;
