# Database Migrations

This directory contains SQL migration files for the España Creativa Red database schema.

## Migration Files

### 003_update_messages_table.sql
**Status**: Ready to run
**Description**: Updates the messages table to match domain entity expectations
**Changes**:
- Renames `receiver_id` → `recipient_id`
- Renames `body` → `content`
- Adds `read_at` column for read receipts
- Adds `updated_at` column with auto-update trigger
- Adds performance indexes for conversation queries

**Impact**: BREAKING - Requires code to use new column names

---

### 004_create_connections_table.sql
**Status**: Ready to run
**Description**: Creates the connections table for network feature
**Changes**:
- Creates `connections` table with UUID primary key
- Adds foreign keys to users table
- Adds status constraint (pending, accepted, rejected, blocked)
- Adds unique constraint to prevent duplicate connections
- Adds check constraint to prevent self-connections
- Adds auto-update trigger for updated_at

**Impact**: NEW TABLE - No breaking changes

---

### 005_update_opportunities_table.sql
**Status**: Ready to run
**Description**: Extends opportunities table with additional fields
**Changes**:
- Adds `type` column (proyecto, colaboracion, empleo, mentoria, evento, otro)
- Adds `skills_required` array column
- Adds `location`, `remote`, `duration`, `compensation` columns
- Migrates data from old `skills` column if it exists
- Adds GIN index for skills array searches
- Updates status constraint

**Impact**: ADDITIVE - Backward compatible (default values provided)

---

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended for first time)

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of each migration file
4. Run them in order (003 → 004 → 005)
5. Verify success in Table Editor

### Option 2: Supabase CLI (For automation)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 3: psql (Direct database connection)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i migrations/003_update_messages_table.sql
\i migrations/004_create_connections_table.sql
\i migrations/005_update_opportunities_table.sql
```

---

## Verification Queries

After running migrations, verify with these queries:

### Verify messages table
```sql
-- Check column names
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'messages';
```

### Verify connections table
```sql
-- Check table exists
SELECT * FROM connections LIMIT 0;

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'connections'::regclass;
```

### Verify opportunities table
```sql
-- Check new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('type', 'skills_required', 'location', 'remote', 'duration', 'compensation');

-- Test skills array search
SELECT id, title, skills_required
FROM opportunities
WHERE skills_required @> ARRAY['JavaScript']::text[];
```

---

## Rollback Instructions

Each migration file includes a commented rollback script at the bottom. To rollback:

1. Uncomment the rollback section
2. Run it in Supabase SQL Editor
3. Verify rollback with verification queries

**WARNING**: Rollback will lose data added to new columns. Backup first!

---

## Post-Migration Checklist

- [ ] All 3 migrations run successfully
- [ ] No errors in Supabase logs
- [ ] Verification queries return expected results
- [ ] Backend repository queries work correctly
- [ ] Test creating a connection via API
- [ ] Test sending a message via API
- [ ] Test creating an opportunity via API
- [ ] Update `supabase-schema.sql` with final schema

---

## Dependencies

These migrations require:
- PostgreSQL 12+ (Supabase uses PostgreSQL 15)
- `uuid-ossp` extension (should be enabled in Supabase by default)
- Existing `users` table

---

## Notes

- Migrations are idempotent where possible (using `IF NOT EXISTS`)
- All timestamps use `TIMESTAMP WITH TIME ZONE` for correct timezone handling
- Indexes are optimized for common query patterns identified in use cases
- Constraints enforce domain rules at database level
- Triggers maintain data consistency automatically

---

**Last Updated**: 2025-10-21
**Status**: Ready for production deployment
