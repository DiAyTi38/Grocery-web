-- Subscription, loyalty and AI-prediction tables from the Smart Grocery ERD.

CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    interval_days INT NOT NULL,
    next_purchase_date DATE NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_subscriptions_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_subscriptions_quantity CHECK (quantity > 0),
    CONSTRAINT chk_subscriptions_interval CHECK (interval_days > 0),
    INDEX idx_subscriptions_user_status (user_id, status),
    INDEX idx_subscriptions_next_purchase_date (next_purchase_date)
);

CREATE TABLE loyalty_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tier ENUM('MEMBER', 'SILVER', 'GOLD') NOT NULL DEFAULT 'MEMBER',
    points INT NOT NULL DEFAULT 0,
    total_spend DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_loyalty_accounts_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_loyalty_accounts_points CHECK (points >= 0),
    CONSTRAINT chk_loyalty_accounts_total_spend CHECK (total_spend >= 0),
    CONSTRAINT uk_loyalty_accounts_user UNIQUE (user_id)
);

CREATE TABLE loyalty_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    points INT NOT NULL,
    type ENUM('EARN', 'REDEEM', 'UPGRADE') NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loyalty_transactions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_loyalty_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_loyalty_transactions_user_created_at (user_id, created_at),
    INDEX idx_loyalty_transactions_order (order_id)
);

CREATE TABLE ai_predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    predicted_next_date DATE NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    type ENUM('REPLENISHMENT', 'RECOMMENDATION') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_predictions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ai_predictions_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_ai_predictions_confidence CHECK (confidence >= 0 AND confidence <= 1),
    INDEX idx_ai_predictions_user_product_created_at (user_id, product_id, created_at),
    INDEX idx_ai_predictions_type_predicted_date (type, predicted_next_date)
);
