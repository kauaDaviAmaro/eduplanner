-- Migration 004: Course Creation Updates
-- Makes video_url nullable, adds is_published to courses, and adds storage_key to lessons

-- Make video_url nullable in lessons table (allows creating lessons without video initially)
ALTER TABLE lessons 
ALTER COLUMN video_url DROP NOT NULL;

-- Add is_published column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL;

-- Add storage_key column to lessons table (for MinIO storage key)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS storage_key TEXT;

-- Add index on is_published for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);

-- Add index on storage_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_storage_key ON lessons(storage_key);

-- Update existing courses to be published by default (optional, adjust as needed)
-- Uncomment if you want existing courses to be published:
-- UPDATE courses SET is_published = true WHERE is_published = false;

