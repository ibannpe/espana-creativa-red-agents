-- VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify migrations were successful

-- ============================================================
-- VERIFY MESSAGES TABLE
-- ============================================================

-- Check columns exist with correct names
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Expected columns: id, sender_id, recipient_id (not receiver_id!), content (not body!), read_at, updated_at, created_at

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'messages'
ORDER BY indexname;

-- Expected indexes: idx_messages_unread, idx_messages_conversation, idx_messages_recipient, idx_messages_sender

-- ============================================================
-- VERIFY CONNECTIONS TABLE
-- ============================================================

-- Check table exists
SELECT COUNT(*) as connections_table_exists
FROM information_schema.tables
WHERE table_name = 'connections';

-- Expected: 1

-- Check columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'connections'
ORDER BY ordinal_position;

-- Expected columns: id, requester_id, addressee_id, status, created_at, updated_at

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'connections'::regclass
ORDER BY conname;

-- Expected constraints: unique_connection, no_self_connection, valid_status

-- ============================================================
-- VERIFY OPPORTUNITIES TABLE
-- ============================================================

-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('type', 'skills_required', 'location', 'remote', 'duration', 'compensation')
ORDER BY column_name;

-- Expected: All 6 columns should exist

-- Check constraints
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'opportunities'::regclass
AND conname IN ('valid_opportunity_type', 'valid_opportunity_status')
ORDER BY conname;

-- Expected: Both constraints with correct CHECK definitions

-- ============================================================
-- SUCCESS INDICATORS
-- ============================================================

-- If all queries above return expected results, migrations are successful!
-- You should see:
-- ✅ messages table has recipient_id and content (not receiver_id/body)
-- ✅ messages table has read_at and updated_at columns
-- ✅ connections table exists with all columns and constraints
-- ✅ opportunities table has 6 new columns (type, skills_required, etc.)
