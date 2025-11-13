-- Migration: Fix opportunities created_by foreign key
-- Date: 2025-11-13
-- Description: Change opportunities.created_by foreign key to reference public.users instead of auth.users
--              This allows direct joins with the users table for profile data

BEGIN;

-- Step 1: Create missing user profiles in public.users for orphaned opportunities
INSERT INTO users (id, email, name)
SELECT DISTINCT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM opportunities o
INNER JOIN auth.users au ON o.created_by = au.id
LEFT JOIN users u ON o.created_by = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_created_by_fkey;

-- Step 3: Add new foreign key pointing to public.users
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the change
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'opportunities_created_by_fkey'
    AND table_name = 'opportunities'
  ) THEN
    RAISE NOTICE 'Foreign key opportunities_created_by_fkey successfully updated';
  ELSE
    RAISE EXCEPTION 'Foreign key opportunities_created_by_fkey was not created';
  END IF;
END $$;

COMMIT;
