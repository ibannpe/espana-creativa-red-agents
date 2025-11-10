-- ABOUTME: Migration para crear la tabla system_settings para configuraciones clave-valor del sistema
-- ABOUTME: Permite a los administradores gestionar configuraciones sin modificar código

-- Crear tabla system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('boolean', 'number', 'string', 'text', 'json')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Índice para búsquedas por data_type
CREATE INDEX idx_system_settings_data_type ON system_settings(data_type);

-- RLS: Solo admins pueden leer configuraciones
CREATE POLICY "Admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- RLS: Solo admins pueden actualizar configuraciones
CREATE POLICY "Admins can update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- RLS: Solo admins pueden insertar configuraciones
CREATE POLICY "Admins can insert system settings"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- RLS: Solo admins pueden eliminar configuraciones
CREATE POLICY "Admins can delete system settings"
  ON system_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Habilitar RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Insertar configuraciones por defecto
INSERT INTO system_settings (key, value, description, data_type) VALUES
  ('public_registration_enabled', 'true', 'Permite el registro público de nuevos usuarios', 'boolean'),
  ('manual_approval_required', 'true', 'Requiere aprobación manual de administrador para nuevos registros', 'boolean'),
  ('max_connections_per_user', '500', 'Límite máximo de conexiones por usuario', 'number'),
  ('support_email', '"contacto@espanacreativa.org"', 'Email de contacto para soporte mostrado a usuarios', 'string'),
  ('maintenance_mode', 'false', 'Activa el modo mantenimiento (muestra página de mantenimiento)', 'boolean'),
  ('maintenance_message', '"La plataforma está en mantenimiento. Volveremos pronto."', 'Mensaje mostrado durante el modo mantenimiento', 'text')
ON CONFLICT (key) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();
