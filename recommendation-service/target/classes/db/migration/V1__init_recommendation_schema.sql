CREATE TABLE IF NOT EXISTS product_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    search_count BIGINT NOT NULL DEFAULT 0,
    purchase_count BIGINT NOT NULL DEFAULT 0,
    average_rating DOUBLE NOT NULL DEFAULT 0.0,
    rating_count BIGINT NOT NULL DEFAULT 0,
    popularity_score DOUBLE NOT NULL DEFAULT 0.0,
    last_calculated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stat_product (product_id),
    INDEX idx_stat_pop_score (popularity_score DESC),
    INDEX idx_stat_search (search_count DESC),
    INDEX idx_stat_purchase (purchase_count DESC),
    INDEX idx_stat_rating (average_rating DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS search_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NULL,
    keyword VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    category_name VARCHAR(100) NULL,
    user_id BIGINT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_search_prod (product_id),
    INDEX idx_search_time (searched_at),
    INDEX idx_search_user (user_id),
    INDEX idx_search_keyword (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_pair_associations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id_a BIGINT NOT NULL,
    product_id_b BIGINT NOT NULL,
    co_purchase_count BIGINT NOT NULL DEFAULT 1,
    last_co_purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prod_pair (product_id_a, product_id_b),
    INDEX idx_pair_a (product_id_a),
    INDEX idx_pair_b (product_id_b),
    INDEX idx_pair_count (co_purchase_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_category_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    category_name VARCHAR(100) NOT NULL,
    interaction_count BIGINT NOT NULL DEFAULT 1,
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_cat (user_id, category_name),
    INDEX idx_user_pref (user_id),
    INDEX idx_user_count (interaction_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
