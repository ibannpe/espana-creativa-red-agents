-- ABOUTME: Migration to update messages table schema to match domain entities
-- ABOUTME: Renames columns and adds missing fields for read tracking

-- Migration 003: Update Messages Table
-- Description: Rename columns to match code expectations and add read tracking
-- Date: 2025-10-21

BEGIN;

-- Step 1: Rename columns to match domain entity
ALTER TABLE messages RENAME COLUMN receiver_id TO recipient_id;
ALTER TABLE messages RENAME COLUMN body TO content;

-- Step 2: Add missing columns for read tracking and updates
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Add indexes for query performance
-- Index for unread messages queries (frequently used for notifications)
CREATE INDEX idx_messages_unread ON messages(recipient_id, read_at)
WHERE read_at IS NULL;

-- Index for conversation queries (sender + recipient pair sorted by time)
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);

-- Index for recipient's all messages (for conversation list)
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);

-- Index for sender's sent messages
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);

-- Step 4: Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at_trigger
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

COMMIT;

-- Rollback script (in case of issues):
-- BEGIN;
-- DROP TRIGGER IF EXISTS messages_updated_at_trigger ON messages;
-- DROP FUNCTION IF EXISTS update_messages_updated_at();
-- DROP INDEX IF EXISTS idx_messages_sender;
-- DROP INDEX IF EXISTS idx_messages_recipient;
-- DROP INDEX IF EXISTS idx_messages_conversation;
-- DROP INDEX IF EXISTS idx_messages_unread;
-- ALTER TABLE messages DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE messages DROP COLUMN IF EXISTS read_at;
-- ALTER TABLE messages RENAME COLUMN content TO body;
-- ALTER TABLE messages RENAME COLUMN recipient_id TO receiver_id;
-- COMMIT;
