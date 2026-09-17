CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    price DECIMAL(19, 2) NOT NULL,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prod_merchant (merchant_id),
    INDEX idx_prod_category (category_id),
    INDEX idx_prod_name (name),
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_specifications (
    product_id BIGINT NOT NULL,
    spec_key VARCHAR(100) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    PRIMARY KEY (product_id, spec_key),
    CONSTRAINT fk_spec_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
