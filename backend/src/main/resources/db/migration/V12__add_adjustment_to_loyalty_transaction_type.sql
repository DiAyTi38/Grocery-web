-- V12__add_adjustment_to_loyalty_transaction_type.sql
-- Expand loyalty_transactions.type ENUM to support ADJUSTMENT for manual admin adjustments
ALTER TABLE loyalty_transactions 
MODIFY COLUMN type ENUM('EARN', 'REDEEM', 'UPGRADE', 'ADJUSTMENT') NOT NULL;
