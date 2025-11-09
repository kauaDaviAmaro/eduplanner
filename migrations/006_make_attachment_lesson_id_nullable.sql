-- Migration 006: Make attachment lesson_id nullable
-- Allows creating attachments without being linked to a course/lesson
-- Access control will be based only on tier

-- Make lesson_id nullable in attachments table
ALTER TABLE attachments 
ALTER COLUMN lesson_id DROP NOT NULL;

-- Add index for attachments without lesson_id (for faster queries)
CREATE INDEX IF NOT EXISTS idx_attachments_lesson_id_null ON attachments(lesson_id) WHERE lesson_id IS NULL;





