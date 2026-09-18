CREATE TABLE IF NOT EXISTS shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_reference VARCHAR(64) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(64) NOT NULL,
    merchant_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'SHIPROCKET',
    provider_shipment_id VARCHAR(100) NULL,
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    carrier VARCHAR(100) NOT NULL DEFAULT 'Delhivery',
    tracking_url VARCHAR(500) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    estimated_delivery DATE NULL,
    shipping_address_snapshot VARCHAR(1000) NULL,
    items_snapshot TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ship_order (order_id),
    INDEX idx_ship_order_num (order_number),
    INDEX idx_ship_merchant (merchant_id),
    INDEX idx_ship_tracking (tracking_number),
    INDEX idx_ship_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shipment_tracking_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255) NULL,
    description VARCHAR(500) NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_shipment (shipment_id),
    INDEX idx_event_time (event_timestamp),
    CONSTRAINT fk_event_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS webhook_event_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'SHIPROCKET',
    event_id VARCHAR(128) NOT NULL UNIQUE,
    event_type VARCHAR(100) NULL,
    payload TEXT NULL,
    processed BOOLEAN NOT NULL DEFAULT TRUE,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_event_id (event_id),
    INDEX idx_webhook_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
