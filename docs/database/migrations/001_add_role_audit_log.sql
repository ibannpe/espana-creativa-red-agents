-- ABOUTME: Migration to add role_audit_log table and triggers for automatic logging
-- ABOUTME: This enables tracking of all user role changes with full audit trail

-- ============================================================================
-- 1. Create role_audit_log table
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('assigned', 'removed')),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_role_id ON role_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_performed_by ON role_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_action ON role_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created_at ON role_audit_log(created_at DESC);

-- ============================================================================
-- 2. Create trigger function to log role assignments
-- ============================================================================
CREATE OR REPLACE FUNCTION log_user_role_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        -- Log role assignment
        INSERT INTO role_audit_log (user_id, role_id, action, performed_by, metadata)
        VALUES (
            NEW.user_id,
            NEW.role_id,
            'assigned',
            current_user_id,
            jsonb_build_object(
                'operation', 'INSERT',
                'timestamp', NOW()
            )
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Log role removal
        INSERT INTO role_audit_log (user_id, role_id, action, performed_by, metadata)
        VALUES (
            OLD.user_id,
            OLD.role_id,
            'removed',
            current_user_id,
            jsonb_build_object(
                'operation', 'DELETE',
                'timestamp', NOW()
            )
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Create triggers on user_roles table
-- ============================================================================
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON user_roles;

CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION log_user_role_change();

-- ============================================================================
-- 4. Enable Row Level Security
-- ============================================================================
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create RLS policies
-- ============================================================================

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON role_audit_log;
CREATE POLICY "Only admins can view audit logs" ON role_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- System can insert audit logs (via trigger)
DROP POLICY IF EXISTS "System can insert audit logs" ON role_audit_log;
CREATE POLICY "System can insert audit logs" ON role_audit_log
    FOR INSERT
    WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
DROP POLICY IF EXISTS "Audit logs are immutable" ON role_audit_log;
CREATE POLICY "Audit logs are immutable" ON role_audit_log
    FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON role_audit_log;
CREATE POLICY "Audit logs cannot be deleted" ON role_audit_log
    FOR DELETE
    USING (false);

-- ============================================================================
-- 6. Update user_roles policies to allow admins to manage roles
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Everyone can view user roles" ON user_roles;

-- Recreate with proper permissions
CREATE POLICY "Anyone can view user roles"
ON user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can assign roles"
ON user_roles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

CREATE POLICY "Admins can remove roles"
ON user_roles
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

CREATE POLICY "Service role full access"
ON user_roles
FOR ALL
USING (
    (current_setting('request.jwt.claims'::text, true)::json ->> 'role') = 'service_role'
);

-- ============================================================================
-- 7. Grant necessary permissions
-- ============================================================================
GRANT SELECT ON role_audit_log TO authenticated;
GRANT INSERT ON role_audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE role_audit_log_id_seq TO authenticated;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS user_roles_audit_trigger ON user_roles;
-- DROP FUNCTION IF EXISTS log_user_role_change();
-- DROP TABLE IF EXISTS role_audit_log;
