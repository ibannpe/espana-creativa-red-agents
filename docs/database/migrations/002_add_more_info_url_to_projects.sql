-- Migration: Add more_info_url field to projects table
-- Description: Añade campo de URL para más información del proyecto
-- Date: 2025-12-17

-- Add more_info_url column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS more_info_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN projects.more_info_url IS 'URL externa con más información sobre el proyecto';
