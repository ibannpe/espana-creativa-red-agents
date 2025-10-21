-- ABOUTME: Migration to create connections table for user network connections
-- ABOUTME: Adds table, indexes, RLS policies, and triggers for connection management

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Business rule: Can't connect with yourself
    CONSTRAINT different_users CHECK (requester_id != addressee_id),

    -- Business rule: Only one connection between two users (bidirectional)
    CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at DESC);

-- Index for finding connections between two users (bidirectional)
CREATE INDEX IF NOT EXISTS idx_connections_between_users ON connections(requester_id, addressee_id);

-- Index for counting pending requests
CREATE INDEX IF NOT EXISTS idx_connections_pending_requests ON connections(addressee_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_connections_sent_requests ON connections(requester_id, status) WHERE status = 'pending';

-- Index for accepted connections
CREATE INDEX IF NOT EXISTS idx_connections_accepted ON connections(status) WHERE status = 'accepted';

-- Enable Row Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view connections they are part of
CREATE POLICY "Users can view their connections" ON connections
    FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create connection requests (as requester)
CREATE POLICY "Users can create connection requests" ON connections
    FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Users can update connections they are part of
CREATE POLICY "Users can update their connections" ON connections
    FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete connections they are part of
CREATE POLICY "Users can delete their connections" ON connections
    FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE connections IS 'User network connections with pending/accepted/rejected/blocked statuses';
COMMENT ON COLUMN connections.requester_id IS 'User who initiated the connection request';
COMMENT ON COLUMN connections.addressee_id IS 'User who received the connection request';
COMMENT ON COLUMN connections.status IS 'Connection status: pending, accepted, rejected, or blocked';
