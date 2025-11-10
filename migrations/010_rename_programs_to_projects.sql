-- Migration: Rename programs tables to projects
-- This migration renames programs and program_enrollments to projects and project_enrollments

-- Step 1: Drop the empty projects table if it exists
DROP TABLE IF EXISTS public.projects CASCADE;

-- Step 2: Rename programs table to projects
ALTER TABLE public.programs RENAME TO projects;

-- Step 3: Rename program_enrollments to project_enrollments
ALTER TABLE public.program_enrollments RENAME TO project_enrollments;

-- Step 4: Rename the foreign key column in project_enrollments
ALTER TABLE public.project_enrollments
  RENAME COLUMN program_id TO project_id;

-- Step 5: Update RLS policies for projects table
-- Drop old policies
DROP POLICY IF EXISTS "Users can view all programs" ON public.projects;
DROP POLICY IF EXISTS "Users can create programs" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own programs" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own programs" ON public.projects;

-- Create new policies
CREATE POLICY "Users can view all projects" ON public.projects
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE
  USING (auth.uid() = created_by);

-- Step 6: Update RLS policies for project_enrollments table
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.project_enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.project_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.project_enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.project_enrollments;

-- Create new policies
CREATE POLICY "Users can view their own enrollments" ON public.project_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" ON public.project_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.project_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments" ON public.project_enrollments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Update indexes (rename them for consistency)
ALTER INDEX IF EXISTS programs_pkey RENAME TO projects_pkey;
ALTER INDEX IF EXISTS program_enrollments_pkey RENAME TO project_enrollments_pkey;
ALTER INDEX IF EXISTS idx_programs_status RENAME TO idx_projects_status;
ALTER INDEX IF EXISTS idx_programs_type RENAME TO idx_projects_type;
ALTER INDEX IF EXISTS idx_programs_created_by RENAME TO idx_projects_created_by;
ALTER INDEX IF EXISTS idx_program_enrollments_user_id RENAME TO idx_project_enrollments_user_id;
ALTER INDEX IF EXISTS idx_program_enrollments_program_id RENAME TO idx_project_enrollments_project_id;

-- Step 8: Rename foreign key constraints
ALTER TABLE public.project_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_program_id_fkey;

ALTER TABLE public.project_enrollments
  ADD CONSTRAINT project_enrollments_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_user_id_fkey;

ALTER TABLE public.project_enrollments
  ADD CONSTRAINT project_enrollments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMENT ON TABLE public.projects IS 'Stores projects (courses, workshops, bootcamps, etc.)';
COMMENT ON TABLE public.project_enrollments IS 'Stores user enrollments in projects';
