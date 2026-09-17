CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    recipient_user_id BIGINT,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    template_name VARCHAR(50),
    error_message VARCHAR(500),
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notif_user (recipient_user_id),
    INDEX idx_notif_email (recipient_email),
    INDEX idx_notif_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
