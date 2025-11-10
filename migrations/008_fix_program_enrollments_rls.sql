-- ABOUTME: Fix RLS policies for program_enrollments to allow backend service role to create enrollments
-- ABOUTME: This migration adds policies that allow the service role to bypass RLS checks

-- Drop existing enrollment policy that's too restrictive
DROP POLICY IF EXISTS "Authenticated users can enroll" ON program_enrollments;

-- Create new policy that allows both direct user enrollments and service role enrollments
CREATE POLICY "Users can create their own enrollments"
    ON program_enrollments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Also add a policy for DELETE operations to allow users to cancel enrollments
CREATE POLICY "Users can delete their enrollments"
    ON program_enrollments FOR DELETE
    USING (auth.uid() = user_id);
