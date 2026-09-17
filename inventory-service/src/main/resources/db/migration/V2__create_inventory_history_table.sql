CREATE TABLE IF NOT EXISTS inventory_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    order_id BIGINT,
    change_type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    available_stock_after INT NOT NULL,
    reserved_stock_after INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inv_hist_prod (product_id),
    INDEX idx_inv_hist_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
