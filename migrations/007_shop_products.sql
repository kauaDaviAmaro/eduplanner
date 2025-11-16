-- Migration 007: Shop Products - File Products and Bundles
-- Allows selling individual files and bundles of files

-- File Products Table (individual file products)
CREATE TABLE IF NOT EXISTS file_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attachment_id) -- One attachment can only have one product
);

-- Products Table (bundles of files)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Attachments Table (many-to-many relationship between bundles and attachments)
CREATE TABLE IF NOT EXISTS product_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, attachment_id) -- Prevent duplicate attachments in same bundle
);

-- File Purchases Table (purchases of individual file products)
CREATE TABLE IF NOT EXISTS file_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_product_id UUID NOT NULL REFERENCES file_products(id) ON DELETE RESTRICT,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, file_product_id) -- User can only purchase same file product once
);

-- Product Purchases Table (purchases of bundles)
CREATE TABLE IF NOT EXISTS product_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- User can only purchase same bundle once
);

-- Indexes for performance
CREATE INDEX idx_file_products_attachment_id ON file_products(attachment_id);
CREATE INDEX idx_file_products_is_active ON file_products(is_active);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_product_attachments_product_id ON product_attachments(product_id);
CREATE INDEX idx_product_attachments_attachment_id ON product_attachments(attachment_id);
CREATE INDEX idx_file_purchases_user_id ON file_purchases(user_id);
CREATE INDEX idx_file_purchases_file_product_id ON file_purchases(file_product_id);
CREATE INDEX idx_file_purchases_stripe_payment_intent_id ON file_purchases(stripe_payment_intent_id);
CREATE INDEX idx_product_purchases_user_id ON product_purchases(user_id);
CREATE INDEX idx_product_purchases_product_id ON product_purchases(product_id);
CREATE INDEX idx_product_purchases_stripe_payment_intent_id ON product_purchases(stripe_payment_intent_id);

-- Triggers for updated_at
CREATE TRIGGER update_file_products_updated_at BEFORE UPDATE ON file_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_purchases_updated_at BEFORE UPDATE ON file_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_purchases_updated_at BEFORE UPDATE ON product_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

