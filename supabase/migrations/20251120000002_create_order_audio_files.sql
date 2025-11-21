-- Migration: Create order_audio_files table
-- Description: Store metadata for audio files uploaded during order creation

-- =============================================================================
-- ORDER_AUDIO_FILES TABLE
-- =============================================================================

CREATE TABLE order_audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Storage metadata
    storage_path TEXT NOT NULL CHECK (char_length(storage_path) > 0 AND char_length(storage_path) <= 500),
    duration_seconds DECIMAL(8, 2) CHECK (duration_seconds > 0 AND duration_seconds <= 7200), -- Max 2 hours
    file_size_bytes BIGINT CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400), -- Max 25MB (Groq limit)
    
    -- Transcription results
    transcription TEXT CHECK (char_length(transcription) <= 10000),
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Processing status
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'transcribing', 'completed', 'failed')
    ),
    error_message TEXT CHECK (char_length(error_message) <= 1000),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transcribed_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary query: audio files by order
CREATE INDEX idx_order_audio_files_order_id ON order_audio_files(order_id, created_at DESC);

-- Query by processing status (find pending transcriptions)
CREATE INDEX idx_order_audio_files_status ON order_audio_files(processing_status, created_at)
    WHERE processing_status IN ('pending', 'transcribing');

-- Query by confidence score (find low quality transcriptions)
CREATE INDEX idx_order_audio_files_confidence ON order_audio_files(order_id, confidence_score)
    WHERE confidence_score IS NOT NULL AND confidence_score < 0.7;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE order_audio_files ENABLE ROW LEVEL SECURITY;

-- Members can view audio files in orders they can access
CREATE POLICY "members_can_view_audio_files"
    ON order_audio_files FOR SELECT
    USING (can_access_order(order_id));

-- Members can create audio files in orders they can access
CREATE POLICY "members_can_create_audio_files"
    ON order_audio_files FOR INSERT
    WITH CHECK (can_access_order(order_id));

-- Members can update audio file metadata (e.g., transcription results)
CREATE POLICY "members_can_update_audio_files"
    ON order_audio_files FOR UPDATE
    USING (can_access_order(order_id));

-- Members can delete audio files
CREATE POLICY "members_can_delete_audio_files"
    ON order_audio_files FOR DELETE
    USING (can_access_order(order_id));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE order_audio_files IS 'Metadata for audio files uploaded during order creation (stored in Supabase Storage)';
COMMENT ON COLUMN order_audio_files.storage_path IS 'Path in Supabase Storage bucket (e.g., order-audio/{orderId}/{uuid}.webm)';
COMMENT ON COLUMN order_audio_files.duration_seconds IS 'Audio duration in seconds';
COMMENT ON COLUMN order_audio_files.file_size_bytes IS 'File size in bytes (max 25MB for Groq compatibility)';
COMMENT ON COLUMN order_audio_files.transcription IS 'Transcribed text from Groq Whisper';
COMMENT ON COLUMN order_audio_files.confidence_score IS 'Average confidence score from Groq transcription segments';
COMMENT ON COLUMN order_audio_files.processing_status IS 'Transcription status: pending, transcribing, completed, failed';
COMMENT ON COLUMN order_audio_files.error_message IS 'Error details if transcription failed';
