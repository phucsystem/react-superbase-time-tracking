-- =========================================
-- Time Tracking Database Schema
-- =========================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rate_per_hour DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_projects table for many-to-many relationship
CREATE TABLE IF NOT EXISTS vendor_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, project_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project VARCHAR(255), -- legacy field, kept for backward compatibility
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Functions and Triggers
-- =========================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =========================================
-- Indexes for Performance
-- =========================================

CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_vendor_projects_vendor_id ON vendor_projects(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_projects_project_id ON vendor_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_vendor_id ON tasks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_vendor_id ON time_entries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);

-- =========================================
-- Row Level Security (RLS) - DISABLED FOR DEVELOPMENT
-- =========================================

-- Note: RLS is disabled for development with plain PostgreSQL
-- For production with Supabase, enable RLS and create appropriate policies

-- ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendor_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Example policies for production Supabase setup:
-- CREATE POLICY "Allow all operations for authenticated users" ON vendors
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON projects
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON vendor_projects
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON tasks
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON time_entries
--   FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- Sample Data
-- =========================================

-- Insert sample vendors
INSERT INTO vendors (id, name, email, rate_per_hour) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'John Developer', 'john@example.com', 75.00),
  ('550e8400-e29b-41d4-a716-446655440001', 'Jane Designer', 'jane@example.com', 60.00),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bob Consultant', 'bob@example.com', 90.00)
ON CONFLICT (email) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, client_name, status, description) VALUES 
  ('770e8400-e29b-41d4-a716-446655440000', 'E-commerce Platform', 'TechCorp Inc', 'active', 'Building a modern e-commerce platform'),
  ('770e8400-e29b-41d4-a716-446655440001', 'Mobile App Development', 'StartupXYZ', 'active', 'iOS and Android mobile application'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Legacy System Migration', 'BigBusiness LLC', 'inactive', 'Migrating old systems to cloud'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Data Analytics Dashboard', 'DataCorp', 'active', 'Real-time analytics and reporting')
ON CONFLICT (id) DO NOTHING;

-- Assign vendors to projects
INSERT INTO vendor_projects (vendor_id, project_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000'), -- John to E-commerce
  ('550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001'), -- John to Mobile App
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000'), -- Jane to E-commerce
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003'), -- Jane to Analytics
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002'), -- Bob to Legacy Migration
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003')  -- Bob to Analytics
ON CONFLICT (vendor_id, project_id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, project_id, vendor_id) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', 'Frontend Development', 'Build React components for user dashboard', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440001', 'API Integration', 'Integrate with third-party payment API', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440002', 'UI/UX Design', 'Design wireframes for mobile app', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Database Optimization', 'Optimize slow queries and add indexes', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Insert sample time entries
INSERT INTO time_entries (task_id, vendor_id, start_time, end_time, duration, description) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '2024-01-15 09:00:00+00', '2024-01-15 12:30:00+00', 12600, 'Worked on login component'),
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '2024-01-15 13:30:00+00', '2024-01-15 17:00:00+00', 12600, 'Implemented user profile page'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '2024-01-16 10:00:00+00', '2024-01-16 14:00:00+00', 14400, 'Payment API integration'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '2024-01-16 09:00:00+00', '2024-01-16 13:00:00+00', 14400, 'Mobile wireframe design'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-01-17 08:00:00+00', '2024-01-17 11:30:00+00', 12600, 'Database performance analysis');