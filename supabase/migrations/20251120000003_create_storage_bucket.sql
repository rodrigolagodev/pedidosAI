-- Create 'orders' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('orders', 'orders', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to 'orders' bucket
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'orders' );

-- Policy to allow authenticated users to read from 'orders' bucket
CREATE POLICY "Authenticated users can read audio"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'orders' );
