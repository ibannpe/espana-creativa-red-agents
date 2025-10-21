-- ABOUTME: Migration to update opportunities table with new fields and correct schema
-- ABOUTME: Adds type, location, remote, duration, compensation columns and updates status values

-- First, drop the old table if it exists (development only - in production use ALTER TABLE)
DROP TABLE IF EXISTS opportunities CASCADE;

-- Recreate opportunities table with complete schema
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL CHECK (length(title) >= 5 AND length(title) <= 100),
    description TEXT NOT NULL CHECK (length(description) >= 20 AND length(description) <= 2000),
    type VARCHAR(20) NOT NULL CHECK (type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')),
    status VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada')),
    skills_required TEXT[] NOT NULL CHECK (array_length(skills_required, 1) > 0),
    location VARCHAR(255),
    remote BOOLEAN DEFAULT FALSE,
    duration VARCHAR(100),
    compensation VARCHAR(100),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_remote ON opportunities(remote);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);

-- Index for skills array
CREATE INDEX IF NOT EXISTS idx_opportunities_skills ON opportunities USING GIN(skills_required);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities
    USING GIN(to_tsvector('spanish', title || ' ' || description));

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone authenticated can view opportunities
CREATE POLICY "Anyone can view opportunities" ON opportunities
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can create opportunities
CREATE POLICY "Users can create opportunities" ON opportunities
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Only creator can update their opportunities
CREATE POLICY "Users can update own opportunities" ON opportunities
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Only creator can delete their opportunities
CREATE POLICY "Users can delete own opportunities" ON opportunities
    FOR DELETE
    USING (auth.uid() = created_by);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to table
COMMENT ON TABLE opportunities IS 'Collaboration opportunities, job postings, projects, mentorship, and events';
COMMENT ON COLUMN opportunities.type IS 'Type of opportunity: proyecto, colaboracion, empleo, mentoria, evento, otro';
COMMENT ON COLUMN opportunities.status IS 'Opportunity status: abierta, en_progreso, cerrada, cancelada';
COMMENT ON COLUMN opportunities.remote IS 'Whether the opportunity can be done remotely';
COMMENT ON COLUMN opportunities.skills_required IS 'Array of required skills for the opportunity';
