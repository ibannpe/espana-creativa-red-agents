-- Fix handle_new_user trigger to ensure user_roles is always created
-- This migration improves error handling and ensures atomicity

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile and assigns emprendedor role when new auth user is created';
