CREATE TABLE IF NOT EXISTS wallet_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    wallet_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    balance_after DECIMAL(19, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    source_party VARCHAR(100),
    destination_party VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wt_wallet (wallet_id),
    INDEX idx_wt_user (user_id),
    INDEX idx_wt_reference (transaction_reference),
    CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
