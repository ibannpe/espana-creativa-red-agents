-- ABOUTME: Fix for foreign key constraint on approved_by and rejected_by
-- ABOUTME: Removes FK constraint to allow system admin ID that doesn't exist in auth.users

-- Drop the existing foreign key constraints
ALTER TABLE public.pending_signups
  DROP CONSTRAINT IF EXISTS pending_signups_approved_by_fkey;

ALTER TABLE public.pending_signups
  DROP CONSTRAINT IF EXISTS pending_signups_rejected_by_fkey;

-- Optionally: Create a system admin user in auth.users if needed later
-- This is commented out because it requires admin privileges
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'system@espanacreativa.org',
--   'unused',
--   NOW(),
--   NOW(),
--   NOW()
-- ) ON CONFLICT (id) DO NOTHING;

SELECT '✅ Foreign key constraints removed successfully!' AS status;
