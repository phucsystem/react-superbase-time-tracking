-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64)
);

-- Insert initial migrations if they don't exist
INSERT INTO migrations (filename, checksum) VALUES 
  ('001_initial_schema.sql', 'initial'),
  ('002_projects_and_vendor_updates.sql', 'projects')
ON CONFLICT (filename) DO NOTHING;