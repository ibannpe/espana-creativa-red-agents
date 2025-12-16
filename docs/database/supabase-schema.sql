-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    linkedin_url TEXT,
    website_url TEXT,
    skills TEXT[],
    interests TEXT[],
    completed_pct INTEGER DEFAULT 0 CHECK (completed_pct >= 0 AND completed_pct <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles (many-to-many)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Role audit log (tracks all role changes)
CREATE TABLE role_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('assigned', 'removed')),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'proyecto',
    skills_required TEXT[],
    location VARCHAR(255),
    remote BOOLEAN DEFAULT false,
    duration VARCHAR(100),
    compensation VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'abierta',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_opportunity_type CHECK (type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')),
    CONSTRAINT valid_opportunity_status CHECK (status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada')),
    CONSTRAINT valid_contact_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_contact_phone CHECK (LENGTH(TRIM(contact_phone)) > 0)
);

-- Messages table (private chat)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table (user networking)
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_connection UNIQUE(requester_id, addressee_id),
    CONSTRAINT no_self_connection CHECK (requester_id != addressee_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Interests table (users interested in projects)
CREATE TABLE interests (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, project_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator with full system access'),
('mentor', 'Mentor with extended privileges'),
('emprendedor', 'Entrepreneur with standard access');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_skills ON users USING GIN(skills);
CREATE INDEX idx_users_interests ON users USING GIN(interests);
-- Messages indexes
CREATE INDEX idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);

-- Connections indexes
CREATE INDEX idx_connections_requester ON connections(requester_id, status);
CREATE INDEX idx_connections_addressee ON connections(addressee_id, status);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_users_pair ON connections(requester_id, addressee_id);

-- Opportunities indexes
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_remote ON opportunities(remote);
CREATE INDEX idx_opportunities_skills ON opportunities USING GIN(skills_required);
CREATE INDEX idx_opportunities_type_status ON opportunities(type, status);
CREATE INDEX idx_opportunities_contact_email ON opportunities(contact_email);
CREATE INDEX idx_projects_status ON projects(status);

-- Create full-text search indexes
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(bio, '')));
CREATE INDEX idx_opportunities_search ON opportunities USING GIN(to_tsvector('spanish', title || ' ' || description));

-- Role audit log indexes
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_role_id ON role_audit_log(role_id);
CREATE INDEX idx_role_audit_log_performed_by ON role_audit_log(performed_by);
CREATE INDEX idx_role_audit_log_action ON role_audit_log(action);
CREATE INDEX idx_role_audit_log_created_at ON role_audit_log(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
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

-- Role audit log policies
CREATE POLICY "Only admins can view audit logs" ON role_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON role_audit_log
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Audit logs are immutable" ON role_audit_log
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON role_audit_log
    FOR DELETE
    USING (false);

-- Projects policies
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = created_by);

-- Opportunities policies
CREATE POLICY "Anyone can view opportunities" ON opportunities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create opportunities" ON opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own opportunities" ON opportunities FOR UPDATE USING (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Connections policies
CREATE POLICY "Users can view their connections" ON connections FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they're involved in" ON connections FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "Users can delete their connections" ON connections FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- Interests policies
CREATE POLICY "Anyone can view interests" ON interests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own interests" ON interests FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic user creation and profile completion calculation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_name TEXT;
    emprendedor_role_id INTEGER;
BEGIN
    -- Safely extract name from metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

    -- Get emprendedor role id
    SELECT id INTO emprendedor_role_id FROM public.roles WHERE name = 'emprendedor';

    IF emprendedor_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol emprendedor no encontrado';
    END IF;

    -- Insert user profile
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, user_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name;

    -- Insert user role (emprendedor by default)
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, emprendedor_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Log success
    RAISE LOG 'User profile created successfully for user %', NEW.id;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the actual error
        RAISE WARNING 'Error creating user profile for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        -- Re-raise the exception to prevent user creation
        RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_pct INTEGER := 0;
BEGIN
    -- Calculate completion percentage based on filled fields
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN completion_pct := completion_pct + 20; END IF;
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completion_pct := completion_pct + 25; END IF;
    IF NEW.location IS NOT NULL AND NEW.location != '' THEN completion_pct := completion_pct + 15; END IF;
    IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN completion_pct := completion_pct + 20; END IF;
    IF NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN completion_pct := completion_pct + 20; END IF;
    
    NEW.completed_pct := completion_pct;
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER calculate_user_completion
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

CREATE TRIGGER set_user_completion_on_insert
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Messages trigger for updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at_trigger
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_messages_updated_at();

-- Connections trigger for updated_at
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connections_updated_at_trigger
    BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_connections_updated_at();

-- Role audit log trigger function
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

CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION log_user_role_change();