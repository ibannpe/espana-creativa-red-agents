-- Migration: Disable RLS for cities table write operations
-- Date: 2025-12-09
-- Description: Backend validates admin permissions, so we can allow service_role full access

-- Drop all existing policies except SELECT
DROP POLICY IF EXISTS "Service role can delete cities" ON cities;
DROP POLICY IF EXISTS "Service role can insert cities" ON cities;
DROP POLICY IF EXISTS "Service role can update cities" ON cities;

-- Create policies that allow ALL authenticated users with proper JWT
-- (Backend middleware validates admin before calling repository)
CREATE POLICY "Authenticated users can insert cities"
  ON cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cities"
  ON cities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cities"
  ON cities
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify final policies
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'cities'
ORDER BY cmd, policyname;
