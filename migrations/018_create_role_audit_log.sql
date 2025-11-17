-- ABOUTME: Migración para crear tabla de auditoría de cambios de roles
-- ABOUTME: Registra todas las asignaciones y remociones de roles para trazabilidad

-- Tabla de auditoría de roles
CREATE TABLE role_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('assigned', 'removed')),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_role_id ON role_audit_log(role_id);
CREATE INDEX idx_role_audit_log_performed_by ON role_audit_log(performed_by);
CREATE INDEX idx_role_audit_log_created_at ON role_audit_log(created_at DESC);
CREATE INDEX idx_role_audit_log_action ON role_audit_log(action);

-- Políticas RLS
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs de auditoría
CREATE POLICY "Only admins can view role audit logs" ON role_audit_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- Función trigger para registrar cambios automáticamente en user_roles
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT (asignación de rol)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO role_audit_log (user_id, role_id, action, performed_by)
        VALUES (NEW.user_id, NEW.role_id, 'assigned', auth.uid());
        RETURN NEW;
    END IF;

    -- Para DELETE (remoción de rol)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO role_audit_log (user_id, role_id, action, performed_by)
        VALUES (OLD.user_id, OLD.role_id, 'removed', auth.uid());
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de INSERT o DELETE en user_roles
DROP TRIGGER IF EXISTS on_user_role_change ON user_roles;
CREATE TRIGGER on_user_role_change
    AFTER INSERT OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION log_role_change();

-- Comentarios para documentación
COMMENT ON TABLE role_audit_log IS 'Registro de auditoría de todos los cambios de roles de usuarios';
COMMENT ON COLUMN role_audit_log.action IS 'Tipo de acción: assigned (asignado) o removed (removido)';
COMMENT ON COLUMN role_audit_log.performed_by IS 'Usuario que realizó la acción (admin)';
COMMENT ON COLUMN role_audit_log.reason IS 'Razón opcional del cambio de rol';
COMMENT ON COLUMN role_audit_log.metadata IS 'Información adicional en formato JSON';
COMMENT ON FUNCTION log_role_change() IS 'Registra automáticamente los cambios de roles en la tabla de auditoría';
