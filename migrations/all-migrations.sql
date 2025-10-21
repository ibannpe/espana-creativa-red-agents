-- CONSOLIDATED MIGRATIONS FOR MANUAL EXECUTION
-- Copy this entire file and paste into Supabase SQL Editor
-- URL: https://app.supabase.com/project/jbkzymvswvnkrxriyzdx/sql/new

-- ============================================================
-- MIGRATION 003: Update Messages Table
-- ============================================================

-- Rename columns
ALTER TABLE messages RENAME COLUMN receiver_id TO recipient_id;
ALTER TABLE messages RENAME COLUMN body TO content;

-- Add missing columns
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes
CREATE INDEX idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);

-- Add trigger
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

-- ============================================================
-- MIGRATION 004: Create Connections Table
-- ============================================================

CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_connection UNIQUE(requester_id, addressee_id),
    CONSTRAINT no_self_connection CHECK (requester_id != addressee_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Add indexes
CREATE INDEX idx_connections_requester ON connections(requester_id, status);
CREATE INDEX idx_connections_addressee ON connections(addressee_id, status);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_users_pair ON connections(requester_id, addressee_id);

-- Add trigger
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

-- ============================================================
-- MIGRATION 005: Update Opportunities Table
-- ============================================================

-- Add new columns
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'proyecto';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS skills_required TEXT[];
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS remote BOOLEAN DEFAULT false;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS compensation VARCHAR(255);

-- Add constraints
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS valid_opportunity_type;
ALTER TABLE opportunities ADD CONSTRAINT valid_opportunity_type CHECK (
    type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')
);

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS valid_opportunity_status;
ALTER TABLE opportunities ADD CONSTRAINT valid_opportunity_status CHECK (
    status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada')
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_remote ON opportunities(remote);
CREATE INDEX IF NOT EXISTS idx_opportunities_skills ON opportunities USING GIN(skills_required);
CREATE INDEX IF NOT EXISTS idx_opportunities_type_status ON opportunities(type, status);
