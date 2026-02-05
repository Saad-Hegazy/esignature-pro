-- E-Signature Pro - Supabase Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Admin table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Document Status enum type
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('PENDING', 'SIGNED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    
    -- Signature field coordinates
    signature_x DECIMAL(10,2),
    signature_y DECIMAL(10,2),
    signature_width DECIMAL(10,2),
    signature_height DECIMAL(10,2),
    page_number INTEGER DEFAULT 1,
    
    -- PDF dimensions
    pdf_width DECIMAL(10,2),
    pdf_height DECIMAL(10,2),
    
    -- Token for guest access
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Recipient info
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    
    -- Signature status
    status document_status DEFAULT 'PENDING',
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_path VARCHAR(500),
    signer_ip VARCHAR(45),
    
    -- Relations
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_token ON documents(token);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_admin_id ON documents(admin_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Create default admin user (password: admin123)
-- IMPORTANT: Change this password after first login!
INSERT INTO admins (id, email, password, name)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@esignature.com',
    '$2a$10$rZc8qZ9XzKr7Y.8yq5LzqO8RZL5xYh5YnQZxYzKr7Y.8yq5LzqO8R',
    'Admin User'
)
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (if using RLS)
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Database setup completed successfully!' AS status;
