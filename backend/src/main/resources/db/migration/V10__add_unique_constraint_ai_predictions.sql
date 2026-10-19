-- V10__add_unique_constraint_ai_predictions.sql
-- 1. Deduplicate any existing duplicate (user_id, product_id) rows, keeping the newest (highest id)
DELETE p1 FROM ai_predictions p1
INNER JOIN ai_predictions p2 
WHERE p1.id < p2.id 
  AND p1.user_id = p2.user_id 
  AND p1.product_id = p2.product_id;

-- 2. Add UNIQUE constraint on (user_id, product_id)
ALTER TABLE ai_predictions 
ADD CONSTRAINT uq_ai_predictions_user_product UNIQUE (user_id, product_id);
