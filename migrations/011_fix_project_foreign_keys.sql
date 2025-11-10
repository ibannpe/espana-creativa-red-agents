-- Migration: Fix foreign keys after renaming programs to projects
-- Restore foreign key constraints that were dropped

-- Fix opportunities table foreign key
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Fix interests table foreign key
ALTER TABLE public.interests
  ADD CONSTRAINT interests_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT opportunities_project_id_fkey ON public.opportunities IS 'Links opportunity to a project';
COMMENT ON CONSTRAINT interests_project_id_fkey ON public.interests IS 'Links interest to a project';
