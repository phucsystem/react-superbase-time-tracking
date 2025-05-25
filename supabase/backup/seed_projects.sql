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

-- Update existing tasks to reference project IDs instead of project names
UPDATE tasks SET project_id = '770e8400-e29b-41d4-a716-446655440000' WHERE project = 'Project Alpha';
UPDATE tasks SET project_id = '770e8400-e29b-41d4-a716-446655440001' WHERE project = 'Project Beta';
UPDATE tasks SET project_id = '770e8400-e29b-41d4-a716-446655440002' WHERE project = 'Project Gamma';