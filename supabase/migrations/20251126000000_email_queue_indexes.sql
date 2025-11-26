-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_attempts ON jobs(attempts);
CREATE INDEX IF NOT EXISTS idx_jobs_status_pending ON jobs(status) WHERE status = 'pending';

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION notify_new_job()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text := current_setting('app.settings.edge_function_url', true);
  service_role_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  -- Fallback if settings are not set (for local dev or if not configured yet)
  -- In production, these should be set via: ALTER DATABASE postgres SET "app.settings.edge_function_url" = '...';
  IF edge_function_url IS NULL THEN
    edge_function_url := 'http://host.docker.internal:54321/functions/v1'; -- Default local Supabase
  END IF;

  PERFORM
    net.http_post(
      url := edge_function_url || '/process-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, 'anon_key_placeholder')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_job_inserted ON jobs;
CREATE TRIGGER on_job_inserted
AFTER INSERT ON jobs
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_new_job();
