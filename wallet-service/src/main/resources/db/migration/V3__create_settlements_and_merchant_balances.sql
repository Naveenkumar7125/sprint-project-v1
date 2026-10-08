-- V3: Add Pending/Available Balances to Wallets & Create Settlements Table
ALTER TABLE wallets
ADD COLUMN pending_balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00 AFTER balance,
ADD COLUMN available_balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00 AFTER pending_balance;

-- Backfill available_balance with current balance
UPDATE wallets SET available_balance = balance WHERE available_balance = 0.00 AND balance > 0.00;

CREATE TABLE IF NOT EXISTS settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    merchant_id BIGINT NOT NULL,
    gross_amount DECIMAL(19, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    platform_commission DECIMAL(19, 2) NOT NULL,
    merchant_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settlement_order (order_id),
    INDEX idx_settlement_merchant (merchant_id),
    INDEX idx_settlement_status (status),
    CONSTRAINT uk_order_merchant UNIQUE (order_id, merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
