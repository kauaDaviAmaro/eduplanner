-- Migration 008: Add additional fields to file_products for shop separation
-- Adds video, thumbnail, long description, specifications, tags, and shop-only flag

-- Add new columns to file_products table
ALTER TABLE file_products
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_shop_only BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Set all existing products as shop-only by default
UPDATE file_products SET is_shop_only = true WHERE is_shop_only IS NULL;

-- Create index for shop-only filtering
CREATE INDEX IF NOT EXISTS idx_file_products_is_shop_only ON file_products(is_shop_only);

-- Create index for tags (using GIN index for array searches)
CREATE INDEX IF NOT EXISTS idx_file_products_tags ON file_products USING GIN(tags);

