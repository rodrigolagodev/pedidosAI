-- Migration: Create order_conversations table
-- Description: Store chat conversation history for orders (text messages and transcriptions)

-- =============================================================================
-- ORDER_CONVERSATIONS TABLE
-- =============================================================================

CREATE TABLE order_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Message metadata
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
    
    -- Optional link to audio file (if message came from voice input)
    audio_file_id UUID REFERENCES order_audio_files(id) ON DELETE SET NULL,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary query: messages by order, chronologically
CREATE INDEX idx_order_conversations_order_id ON order_conversations(order_id, created_at);

-- Filter messages by role
CREATE INDEX idx_order_conversations_role ON order_conversations(order_id, role);

-- Find messages linked to audio files
CREATE INDEX idx_order_conversations_audio_file ON order_conversations(audio_file_id) 
    WHERE audio_file_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE order_conversations ENABLE ROW LEVEL SECURITY;

-- Members can view conversation messages in orders they can access
CREATE POLICY "members_can_view_conversations"
    ON order_conversations FOR SELECT
    USING (can_access_order(order_id));

-- Members can create conversation messages in orders they can access
CREATE POLICY "members_can_create_conversations"
    ON order_conversations FOR INSERT
    WITH CHECK (can_access_order(order_id));

-- Members can update their own messages (e.g., edit typos)
CREATE POLICY "members_can_update_own_conversations"
    ON order_conversations FOR UPDATE
    USING (can_access_order(order_id));

-- Members can delete their own messages
CREATE POLICY "members_can_delete_conversations"
    ON order_conversations FOR DELETE
    USING (can_access_order(order_id));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE order_conversations IS 'Chat conversation history for orders (user messages and AI responses)';
COMMENT ON COLUMN order_conversations.role IS 'Message sender: user (human) or assistant (AI)';
COMMENT ON COLUMN order_conversations.content IS 'Message text content or transcription';
COMMENT ON COLUMN order_conversations.audio_file_id IS 'Optional reference to audio file if message came from voice input';
