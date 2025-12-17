-- ABOUTME: Migration to create opportunity_interests table
-- ABOUTME: Enables users to express interest in opportunities and notify creators

-- Create opportunity_interests table
CREATE TABLE IF NOT EXISTS opportunity_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_interest_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT unique_user_opportunity UNIQUE(opportunity_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_opportunity ON opportunity_interests(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_user ON opportunity_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_status ON opportunity_interests(status);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_created_at ON opportunity_interests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE opportunity_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunity_interests
-- Anyone can view interests (for opportunity creators to see who's interested)
CREATE POLICY "Anyone can view opportunity interests"
ON opportunity_interests
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can express interest (create)
CREATE POLICY "Users can express interest in opportunities"
ON opportunity_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own interests
CREATE POLICY "Users can update own interests"
ON opportunity_interests
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can withdraw their own interests
CREATE POLICY "Users can delete own interests"
ON opportunity_interests
FOR DELETE
USING (auth.uid() = user_id);

-- Opportunity creators can update interest status
CREATE POLICY "Opportunity creators can update interest status"
ON opportunity_interests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM opportunities
        WHERE opportunities.id = opportunity_interests.opportunity_id
        AND opportunities.created_by = auth.uid()
    )
);
