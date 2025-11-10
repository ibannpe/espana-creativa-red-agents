-- Migration: Fix trigger functions after renaming programs to projects
-- Updates trigger functions to reference the correct table names

-- Update the update_program_participants function to reference projects instead of programs
CREATE OR REPLACE FUNCTION public.update_program_participants()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'enrolled') THEN
        UPDATE projects
        SET participants = participants + 1
        WHERE id = NEW.project_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'enrolled' AND NEW.status != 'enrolled') THEN
        UPDATE projects
        SET participants = participants - 1
        WHERE id = NEW.project_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'enrolled' AND NEW.status = 'enrolled') THEN
        UPDATE projects
        SET participants = participants + 1
        WHERE id = NEW.project_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'enrolled') THEN
        UPDATE projects
        SET participants = participants - 1
        WHERE id = OLD.project_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Check if update_programs_updated_at function exists and update it
CREATE OR REPLACE FUNCTION public.update_programs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_program_participants IS 'Updates project participant count when enrollments change';
COMMENT ON FUNCTION public.update_programs_updated_at IS 'Updates the updated_at timestamp for project enrollments';
