-- Auto-Archive Order Management System
-- Migration: 20251203000001
-- Purpose: Add 'archived' status to orders and implement automatic archival of inactive drafts/reviews
--
-- Timers (configurable per organization in future):
-- - Draft orders with items: 24 hours of inactivity → archived
-- - Review orders: 48 hours of inactivity → archived

-- =============================================================================
-- 1. Add 'archived' status to order_status ENUM
-- =============================================================================

-- Add 'archived' status after 'sent'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'archived' AFTER 'sent';

COMMENT ON TYPE order_status IS
'Order lifecycle: draft → review → sending → sent → archived. 
Orders are auto-archived after inactivity: draft (24h), review (48h).
Archived orders can be restored to review status.
Can be cancelled at any stage.';

-- =============================================================================
-- 2. Create Database Function for Auto-Archiving
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_archive_inactive_orders()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  draft_count INTEGER;
  review_count INTEGER;
BEGIN
  -- Archive draft orders that:
  -- 1. Have status = 'draft'
  -- 2. Have been inactive for 24+ hours
  -- 3. Have at least one item (prevent archiving empty drafts)
  
  UPDATE orders
  SET 
    status = 'archived',
    updated_at = NOW()
  WHERE 
    status = 'draft' 
    AND updated_at < NOW() - INTERVAL '24 hours'
    AND EXISTS (
      SELECT 1 FROM order_items WHERE order_id = orders.id
    );
  
  GET DIAGNOSTICS draft_count = ROW_COUNT;
  archived_count := draft_count;
  
  -- Archive review orders that:
  -- 1. Have status = 'review'
  -- 2. Have been inactive for 48+ hours
  
  UPDATE orders
  SET 
    status = 'archived',
    updated_at = NOW()
  WHERE 
    status = 'review' 
    AND updated_at < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS review_count = ROW_COUNT;
  archived_count := archived_count + review_count;
  
  -- Log the operation (for monitoring)
  RAISE NOTICE 'Auto-archived % orders (% drafts, % reviews)', 
    archived_count, draft_count, review_count;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_archive_inactive_orders IS
'Automatically archives inactive draft and review orders.
Draft orders (with items) inactive for 24h+ → archived.
Review orders inactive for 48h+ → archived.
Returns count of archived orders.
Run daily via pg_cron.

Future enhancement: Make timers configurable per organization via organization_settings table.';

-- =============================================================================
-- 3. Create Performance Index
-- =============================================================================

-- Index to optimize auto-archive queries
-- Covers the WHERE clause: status IN ('draft', 'review') AND updated_at < threshold
CREATE INDEX IF NOT EXISTS idx_orders_status_updated_at 
ON orders(status, updated_at) 
WHERE status IN ('draft', 'review');

COMMENT ON INDEX idx_orders_status_updated_at IS
'Performance index for auto-archive job. 
Speeds up queries that filter orders by status (draft/review) and updated_at timestamp.';

-- =============================================================================
-- 4. Schedule pg_cron Job (runs daily at 3 AM)
-- =============================================================================

-- Note: pg_cron extension must be enabled first
-- This is typically done by Supabase automatically, but verify with:
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';

SELECT cron.schedule(
  'auto-archive-inactive-orders',           -- Job name
  '0 3 * * *',                               -- Cron expression: daily at 3 AM UTC
  $$SELECT auto_archive_inactive_orders();$$ -- SQL to execute
);

COMMENT ON EXTENSION pg_cron IS
'PostgreSQL job scheduler. 
Runs auto-archive-inactive-orders daily at 3 AM UTC.
View scheduled jobs: SELECT * FROM cron.job;
View job run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';

-- =============================================================================
-- 5. Grant Permissions (if needed for RLS)
-- =============================================================================

-- The function uses SECURITY DEFINER, so it runs with creator's permissions
-- This ensures it can update orders even with RLS policies active
-- No additional grants needed for the auto-archive function

-- =============================================================================
-- Verification Queries (for manual testing)
-- =============================================================================

-- To manually test the function:
-- SELECT auto_archive_inactive_orders();

-- To check scheduled cron jobs:
-- SELECT * FROM cron.job WHERE jobname = 'auto-archive-inactive-orders';

-- To view cron execution history:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-archive-inactive-orders')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- To simulate old orders for testing:
-- UPDATE orders 
-- SET updated_at = NOW() - INTERVAL '25 hours' 
-- WHERE id = '<test-order-id>';
