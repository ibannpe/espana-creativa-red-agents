-- ABOUTME: Migration to create programs table for courses, workshops, and acceleration programs
-- ABOUTME: Includes program enrollments for tracking user participation

-- Programs table
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'workshop',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration VARCHAR(100),
    location VARCHAR(255),
    participants INTEGER DEFAULT 0,
    max_participants INTEGER,
    instructor VARCHAR(255),
    status VARCHAR(50) DEFAULT 'upcoming',
    featured BOOLEAN DEFAULT false,
    skills TEXT[] DEFAULT '{}',
    price VARCHAR(100),
    image_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_program_type CHECK (type IN ('aceleracion', 'workshop', 'bootcamp', 'mentoria', 'curso', 'otro')),
    CONSTRAINT valid_program_status CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    CONSTRAINT valid_participants CHECK (participants >= 0),
    CONSTRAINT valid_max_participants CHECK (max_participants IS NULL OR max_participants > 0)
);

-- Program enrollments table (user inscriptions)
CREATE TABLE program_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'enrolled',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_enrollment UNIQUE(program_id, user_id),
    CONSTRAINT valid_enrollment_status CHECK (status IN ('enrolled', 'completed', 'dropped', 'rejected'))
);

-- Indexes for performance
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_type ON programs(type);
CREATE INDEX idx_programs_start_date ON programs(start_date);
CREATE INDEX idx_programs_featured ON programs(featured);
CREATE INDEX idx_programs_created_by ON programs(created_by);
CREATE INDEX idx_program_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX idx_program_enrollments_user_id ON program_enrollments(user_id);
CREATE INDEX idx_program_enrollments_status ON program_enrollments(status);

-- Full-text search index on title and description
CREATE INDEX idx_programs_search ON programs USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for programs table
-- Anyone can view programs
CREATE POLICY "Programs are viewable by everyone"
    ON programs FOR SELECT
    USING (true);

-- Only authenticated users can create programs
CREATE POLICY "Authenticated users can create programs"
    ON programs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only creators can update their programs
CREATE POLICY "Users can update their own programs"
    ON programs FOR UPDATE
    USING (auth.uid() = created_by);

-- Only creators can delete their programs
CREATE POLICY "Users can delete their own programs"
    ON programs FOR DELETE
    USING (auth.uid() = created_by);

-- RLS Policies for program_enrollments table
-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments"
    ON program_enrollments FOR SELECT
    USING (auth.uid() = user_id);

-- Program creators can view enrollments for their programs
CREATE POLICY "Program creators can view enrollments"
    ON program_enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM programs
            WHERE programs.id = program_enrollments.program_id
            AND programs.created_by = auth.uid()
        )
    );

-- Authenticated users can enroll in programs
CREATE POLICY "Authenticated users can enroll"
    ON program_enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments (e.g., drop out)
CREATE POLICY "Users can update their enrollments"
    ON program_enrollments FOR UPDATE
    USING (auth.uid() = user_id);

-- Program creators can update enrollments (e.g., approve/reject)
CREATE POLICY "Program creators can update enrollments"
    ON program_enrollments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM programs
            WHERE programs.id = program_enrollments.program_id
            AND programs.created_by = auth.uid()
        )
    );

-- Function to automatically update participant count
CREATE OR REPLACE FUNCTION update_program_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'enrolled') THEN
        UPDATE programs
        SET participants = participants + 1
        WHERE id = NEW.program_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'enrolled' AND NEW.status != 'enrolled') THEN
        UPDATE programs
        SET participants = participants - 1
        WHERE id = NEW.program_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'enrolled' AND NEW.status = 'enrolled') THEN
        UPDATE programs
        SET participants = participants + 1
        WHERE id = NEW.program_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'enrolled') THEN
        UPDATE programs
        SET participants = participants - 1
        WHERE id = OLD.program_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant count
CREATE TRIGGER program_enrollments_update_count
    AFTER INSERT OR UPDATE OR DELETE ON program_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_program_participants();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on programs
CREATE TRIGGER programs_update_timestamp
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_programs_updated_at();

-- Trigger to update updated_at on program_enrollments
CREATE TRIGGER program_enrollments_update_timestamp
    BEFORE UPDATE ON program_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_programs_updated_at();
