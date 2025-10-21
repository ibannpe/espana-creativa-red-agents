-- ABOUTME: Migration to create connections table for network feature
-- ABOUTME: Manages user connections with status tracking (pending, accepted, rejected, blocked)

-- Migration 004: Create Connections Table
-- Description: Create table for user-to-user connections with proper constraints
-- Date: 2025-10-21

BEGIN;

-- Step 1: Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_connection UNIQUE(requester_id, addressee_id),
    CONSTRAINT no_self_connection CHECK (requester_id != addressee_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Step 2: Add indexes for query performance
-- Index for requester's connections filtered by status
CREATE INDEX idx_connections_requester ON connections(requester_id, status);

-- Index for addressee's connections filtered by status
CREATE INDEX idx_connections_addressee ON connections(addressee_id, status);

-- Index for status-based queries
CREATE INDEX idx_connections_status ON connections(status);

-- Composite index for finding connection between two users
CREATE INDEX idx_connections_users_pair ON connections(requester_id, addressee_id);

-- Step 3: Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connections_updated_at_trigger
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_updated_at();

-- Step 4: Add comments for documentation
COMMENT ON TABLE connections IS 'User-to-user connections for networking feature';
COMMENT ON COLUMN connections.status IS 'Connection status: pending, accepted, rejected, blocked';
COMMENT ON COLUMN connections.requester_id IS 'User who initiated the connection request';
COMMENT ON COLUMN connections.addressee_id IS 'User who received the connection request';

COMMIT;

-- Rollback script (in case of issues):
-- BEGIN;
-- DROP TRIGGER IF EXISTS connections_updated_at_trigger ON connections;
-- DROP FUNCTION IF EXISTS update_connections_updated_at();
-- DROP INDEX IF EXISTS idx_connections_users_pair;
-- DROP INDEX IF EXISTS idx_connections_status;
-- DROP INDEX IF EXISTS idx_connections_addressee;
-- DROP INDEX IF EXISTS idx_connections_requester;
-- DROP TABLE IF EXISTS connections;
-- COMMIT;
