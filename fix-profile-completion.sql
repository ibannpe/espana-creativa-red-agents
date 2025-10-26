-- ABOUTME: Script para corregir el cálculo del porcentaje de completado del perfil
-- ABOUTME: Actualiza la función calculate_profile_completion() para usar los mismos criterios que el frontend

-- Eliminar la función existente
DROP FUNCTION IF EXISTS calculate_profile_completion() CASCADE;

-- Crear la función actualizada
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_pct INTEGER := 0;
BEGIN
    -- Calcular el porcentaje basado en los 5 campos que muestra el frontend
    -- Cada campo vale 20% (5 campos × 20% = 100%)

    -- 1. Información básica (name)
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        completion_pct := completion_pct + 20;
    END IF;

    -- 2. Foto de perfil (avatar_url)
    IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
        completion_pct := completion_pct + 20;
    END IF;

    -- 3. Biografía (bio)
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
        completion_pct := completion_pct + 20;
    END IF;

    -- 4. Habilidades (skills)
    IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN
        completion_pct := completion_pct + 20;
    END IF;

    -- 5. Enlaces sociales (linkedin_url o website_url)
    IF (NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '')
       OR (NEW.website_url IS NOT NULL AND NEW.website_url != '') THEN
        completion_pct := completion_pct + 20;
    END IF;

    NEW.completed_pct := completion_pct;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear los triggers
DROP TRIGGER IF EXISTS calculate_user_completion ON users;
DROP TRIGGER IF EXISTS set_user_completion_on_insert ON users;

CREATE TRIGGER calculate_user_completion
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

CREATE TRIGGER set_user_completion_on_insert
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Recalcular el porcentaje para todos los usuarios existentes
UPDATE users SET updated_at = NOW();
