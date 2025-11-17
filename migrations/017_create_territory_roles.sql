-- ABOUTME: Migración para crear roles territoriales y trigger automático
-- ABOUTME: Crea un rol por cada ciudad/territorio para gestionar permisos de creación de oportunidades

-- Crear roles para todas las ciudades existentes
INSERT INTO roles (name, description)
SELECT
    name,
    'Gestor de oportunidades en ' || name
FROM cities
WHERE name NOT IN (SELECT name FROM roles)
ON CONFLICT (name) DO NOTHING;

-- Función para crear rol automáticamente al crear una ciudad
CREATE OR REPLACE FUNCTION create_role_for_city()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear rol con el mismo nombre que la ciudad
    INSERT INTO roles (name, description)
    VALUES (NEW.name, 'Gestor de oportunidades en ' || NEW.name)
    ON CONFLICT (name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de insertar una nueva ciudad
DROP TRIGGER IF EXISTS on_city_created ON cities;
CREATE TRIGGER on_city_created
    AFTER INSERT ON cities
    FOR EACH ROW
    EXECUTE FUNCTION create_role_for_city();

-- Comentarios para documentación
COMMENT ON FUNCTION create_role_for_city() IS 'Crea automáticamente un rol cuando se crea una nueva ciudad/territorio';
COMMENT ON TRIGGER on_city_created ON cities IS 'Trigger que crea un rol territorial al insertar una ciudad';
