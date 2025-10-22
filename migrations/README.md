# Database Migrations - Admin Approval Registration

## Execution Order

Execute migrations in numerical order using Supabase Dashboard SQL Editor:

1. `001_create_pending_signups.sql`
2. `002_create_rate_limits.sql`  
3. `003_add_rls_policies.sql`

## Environment Variables

Add to `.env` after running migrations:

```bash
ADMIN_EMAILS=admin@espanacreativa.org
APPROVAL_TOKEN_EXPIRY_HOURS=168
RATE_LIMIT_SIGNUPS_PER_HOUR=5
RATE_LIMIT_SIGNUPS_PER_DAY=1
```

## Verification

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('pending_signups', 'signup_rate_limits');

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('pending_signups', 'signup_rate_limits');
```
