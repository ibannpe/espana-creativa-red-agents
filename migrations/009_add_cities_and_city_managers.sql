-- Migration: Add cities and city_managers tables
-- Date: 2025-11-13
-- Description: Implements city-based opportunities system

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create city_managers junction table (users ↔ cities)
CREATE TABLE IF NOT EXISTS city_managers (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, city_id)
);

-- 3. Insert initial cities
INSERT INTO cities (name, slug, image_url, description, active, display_order) VALUES
('Córdoba', 'cordoba', 'https://images.unsplash.com/photo-1591964649084-73a2905b0b30?w=800', 'Red de emprendedores en Córdoba', true, 1),
('Tenerife', 'tenerife', 'https://images.unsplash.com/photo-1549480017-d76466c99df6?w=800', 'Red de emprendedores en Tenerife', true, 2),
('Quinto', 'quinto', 'https://images.unsplash.com/photo-1556739398-ed02faa5d1e5?w=800', 'Red de emprendedores en Quinto', true, 3),
('Denia', 'denia', 'https://images.unsplash.com/photo-1509477809798-d6087aee237e?w=800', 'Red de emprendedores en Denia', true, 4),
('Ribeira Sacra', 'ribeira-sacra', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800', 'Red de emprendedores en Ribeira Sacra', true, 5),
('Mondoñedo', 'mondonedo', 'https://images.unsplash.com/photo-1579005910000-8b4d0a0daee9?w=800', 'Red de emprendedores en Mondoñedo', true, 6);

-- 4. ⚠️ CRITICAL: Drop existing opportunities (clean start as per requirements)
DROP TABLE IF EXISTS opportunities CASCADE;

-- 5. Recreate opportunities table WITH city_id
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'proyecto',
    skills_required TEXT[],
    location VARCHAR(255),
    remote BOOLEAN DEFAULT false,
    duration VARCHAR(100),
    compensation VARCHAR(255),
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,  -- ⭐ NUEVO: Obligatorio
    status VARCHAR(50) DEFAULT 'abierta',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_opportunity_type CHECK (type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')),
    CONSTRAINT valid_opportunity_status CHECK (status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada'))
);

-- 6. Create indexes for performance
CREATE INDEX idx_opportunities_city_id ON opportunities(city_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX idx_city_managers_user_id ON city_managers(user_id);
CREATE INDEX idx_city_managers_city_id ON city_managers(city_id);
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_active ON cities(active);

-- 7. RLS Policies for cities (read-only for public)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
ON cities FOR SELECT
USING (true);

-- 8. RLS Policies for city_managers (visible to managers and admins)
ALTER TABLE city_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City managers can view their assignments"
ON city_managers FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

CREATE POLICY "Only admins can assign city managers"
ON city_managers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

CREATE POLICY "Only admins can remove city managers"
ON city_managers FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

-- 9. Update RLS Policies for opportunities (now with city manager permission)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can delete their own opportunities" ON opportunities;

-- New policy: Everyone can view opportunities
CREATE POLICY "Everyone can view opportunities"
ON opportunities FOR SELECT
USING (true);

-- New policy: Only city managers or admins can create opportunities
CREATE POLICY "City managers and admins can create opportunities"
ON opportunities FOR INSERT
WITH CHECK (
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- New policy: Creator, city managers, or admins can update
CREATE POLICY "Creator, city managers, and admins can update opportunities"
ON opportunities FOR UPDATE
USING (
    -- Is creator
    created_by = auth.uid() OR
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- New policy: Creator, city managers, or admins can delete
CREATE POLICY "Creator, city managers, and admins can delete opportunities"
ON opportunities FOR DELETE
USING (
    -- Is creator
    created_by = auth.uid() OR
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- 10. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON cities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
