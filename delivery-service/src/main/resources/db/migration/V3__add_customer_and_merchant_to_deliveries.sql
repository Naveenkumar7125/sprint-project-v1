ALTER TABLE deliveries ADD COLUMN customer_id BIGINT NULL AFTER order_id;
ALTER TABLE deliveries ADD COLUMN merchant_id BIGINT NULL AFTER customer_id;
CREATE INDEX idx_deliv_cust ON deliveries (customer_id);
CREATE INDEX idx_deliv_merch ON deliveries (merchant_id);
