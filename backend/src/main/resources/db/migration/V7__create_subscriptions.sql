-- V7__create_subscriptions.sql

CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    interval_days INT NOT NULL,
    next_purchase_date DATE NOT NULL,
    status ENUM(
        'ACTIVE',
        'PAUSED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_subscriptions_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);