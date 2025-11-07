-- Migration 005: Make attachment file_url nullable and add storage_key
-- Allows creating attachments without file initially (file is uploaded after creation)

-- Make file_url nullable in attachments table (allows creating attachments without file initially)
ALTER TABLE attachments 
ALTER COLUMN file_url DROP NOT NULL;

-- Add storage_key column to attachments table (for MinIO storage key)
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS storage_key TEXT;

-- Add index on storage_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_attachments_storage_key ON attachments(storage_key);

