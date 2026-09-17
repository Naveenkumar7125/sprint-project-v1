CREATE TABLE IF NOT EXISTS deliveries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    tracking_number VARCHAR(60) NOT NULL UNIQUE,
    delivery_agent_id BIGINT,
    delivery_agent_name VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    shipping_address_snapshot VARCHAR(500) NOT NULL,
    customer_notes VARCHAR(500),
    estimated_delivery_time TIMESTAMP NULL,
    actual_delivery_time TIMESTAMP NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deliv_order (order_id),
    INDEX idx_deliv_track (tracking_number),
    INDEX idx_deliv_agent (delivery_agent_id),
    INDEX idx_deliv_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
