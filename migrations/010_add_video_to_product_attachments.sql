-- Migration 010: Add video_url to product_attachments
-- Allows optional video per file within a bundle

ALTER TABLE product_attachments
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create index for video_url queries (optional, but useful for filtering)
CREATE INDEX IF NOT EXISTS idx_product_attachments_video_url ON product_attachments(product_id) WHERE video_url IS NOT NULL;

