-- Add sequence_number column to order_conversations
-- This ensures chronological ordering of messages within an order
-- Migration: 20251123000004

-- Step 1: Add the column with a default value of 0
ALTER TABLE order_conversations
ADD COLUMN sequence_number INTEGER NOT NULL DEFAULT 0;

-- Step 2: Backfill sequence numbers for existing messages
-- Order by created_at to maintain chronological order
WITH numbered_messages AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at ASC) as seq_num
  FROM order_conversations
)
UPDATE order_conversations
SET sequence_number = numbered_messages.seq_num
FROM numbered_messages
WHERE order_conversations.id = numbered_messages.id;

-- Step 3: Create index for efficient queries
CREATE INDEX idx_order_conversations_sequence
ON order_conversations(order_id, sequence_number);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN order_conversations.sequence_number IS
'Monotonically increasing sequence number for messages within an order. Guarantees chronological ordering regardless of created_at clock skew.';
