-- ABOUTME: Migration to update opportunities table with extended fields
-- ABOUTME: Adds type, skills_required, location, remote, duration, and compensation columns

-- Migration 005: Update Opportunities Table
-- Description: Add missing columns for comprehensive opportunity management
-- Date: 2025-10-21

BEGIN;

-- Step 1: Add new columns for opportunity details
ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'proyecto',
    ADD COLUMN IF NOT EXISTS skills_required TEXT[],
    ADD COLUMN IF NOT EXISTS location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS remote BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS duration VARCHAR(100),
    ADD COLUMN IF NOT EXISTS compensation VARCHAR(255);

-- Step 2: Add constraint for valid opportunity types
ALTER TABLE opportunities
    ADD CONSTRAINT valid_opportunity_type CHECK (
        type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')
    );

-- Step 3: Update existing opportunities table column (rename skills to match domain)
-- Note: Only if 'skills' column exists, otherwise skip
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'opportunities'
        AND column_name = 'skills'
    ) THEN
        -- Copy data from old column to new column
        UPDATE opportunities SET skills_required = skills WHERE skills IS NOT NULL;

        -- Drop old column
        ALTER TABLE opportunities DROP COLUMN skills;
    END IF;
END $$;

-- Step 4: Add indexes for common queries
-- Index for filtering by opportunity type
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);

-- Index for filtering remote opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_remote ON opportunities(remote);

-- GIN index for skills array searches (PostgreSQL array contains queries)
CREATE INDEX IF NOT EXISTS idx_opportunities_skills ON opportunities USING GIN(skills_required);

-- Composite index for type + status queries
CREATE INDEX IF NOT EXISTS idx_opportunities_type_status ON opportunities(type, status);

-- Step 5: Update status constraint to include new statuses
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS valid_opportunity_status;
ALTER TABLE opportunities
    ADD CONSTRAINT valid_opportunity_status CHECK (
        status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada')
    );

-- Step 6: Add comments for documentation
COMMENT ON COLUMN opportunities.type IS 'Type: proyecto, colaboracion, empleo, mentoria, evento, otro';
COMMENT ON COLUMN opportunities.skills_required IS 'Array of required skills for the opportunity';
COMMENT ON COLUMN opportunities.location IS 'Physical location (if applicable)';
COMMENT ON COLUMN opportunities.remote IS 'Whether the opportunity can be done remotely';
COMMENT ON COLUMN opportunities.duration IS 'Expected duration (e.g., "3 meses", "6 semanas")';
COMMENT ON COLUMN opportunities.compensation IS 'Compensation details (can be monetary or other)';

COMMIT;

-- Rollback script (in case of issues):
-- BEGIN;
-- ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS valid_opportunity_status;
-- ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS valid_opportunity_type;
-- DROP INDEX IF EXISTS idx_opportunities_type_status;
-- DROP INDEX IF EXISTS idx_opportunities_skills;
-- DROP INDEX IF EXISTS idx_opportunities_remote;
-- DROP INDEX IF EXISTS idx_opportunities_type;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS compensation;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS duration;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS remote;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS location;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS skills_required;
-- ALTER TABLE opportunities DROP COLUMN IF EXISTS type;
-- COMMIT;
