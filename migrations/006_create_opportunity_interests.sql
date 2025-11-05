-- ABOUTME: Migration to create opportunity_interests table
-- ABOUTME: Tracks users who express interest in opportunities

-- Create opportunity_interests table
CREATE TABLE IF NOT EXISTS opportunity_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_opportunity_interest UNIQUE(opportunity_id, user_id),
    CONSTRAINT valid_interest_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_opportunity_id ON opportunity_interests(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_user_id ON opportunity_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_status ON opportunity_interests(status);

-- Enable RLS
ALTER TABLE opportunity_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own interests and interests in their own opportunities
CREATE POLICY "Users can view own interests" ON opportunity_interests
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        auth.uid() IN (
            SELECT created_by FROM opportunities WHERE id = opportunity_id
        )
    );

-- Users can create interests in opportunities
CREATE POLICY "Users can create interests" ON opportunity_interests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own interests
CREATE POLICY "Users can update own interests" ON opportunity_interests
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete own interests" ON opportunity_interests
    FOR DELETE
    USING (auth.uid() = user_id);

-- Opportunity creators can update interest status
CREATE POLICY "Opportunity creators can update interest status" ON opportunity_interests
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT created_by FROM opportunities WHERE id = opportunity_id
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_opportunity_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opportunity_interests_updated_at
    BEFORE UPDATE ON opportunity_interests
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_interests_updated_at();
