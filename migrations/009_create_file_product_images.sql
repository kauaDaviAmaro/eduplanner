-- Migration 009: Create file_product_images table for additional product images
-- Allows multiple images per product for gallery display

CREATE TABLE IF NOT EXISTS file_product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_product_id UUID NOT NULL REFERENCES file_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_product_images_file_product_id ON file_product_images(file_product_id);
CREATE INDEX IF NOT EXISTS idx_file_product_images_display_order ON file_product_images(file_product_id, display_order);

-- Create trigger for updated_at
CREATE TRIGGER update_file_product_images_updated_at BEFORE UPDATE ON file_product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

