-- V11__add_updated_at_to_ai_predictions.sql
-- Add updated_at column to track last recalculation timestamp for staleness management

ALTER TABLE ai_predictions 
ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
