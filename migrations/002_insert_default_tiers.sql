-- Insert default tiers
-- Make sure to run this migration after 001_initial_schema.sql

INSERT INTO tiers (name, price_monthly, description, download_limit, permission_level)
VALUES 
    ('Essencial', 0.00, 'Plano gratuito com acesso básico', 10, 1),
    ('Professor Pro', 29.90, 'Plano intermediário com mais recursos', 50, 2),
    ('Premium', 99.90, 'Plano completo com acesso ilimitado', NULL, 3)
ON CONFLICT (name) DO NOTHING;

