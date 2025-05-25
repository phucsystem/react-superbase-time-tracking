-- Insert sample vendors
INSERT INTO vendors (id, name, email, rate_per_hour) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'John Developer', 'john@example.com', 75.00),
  ('550e8400-e29b-41d4-a716-446655440001', 'Jane Designer', 'jane@example.com', 60.00),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bob Consultant', 'bob@example.com', 90.00)
ON CONFLICT (email) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, project, vendor_id) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', 'Frontend Development', 'Build React components for user dashboard', 'Project Alpha', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440001', 'API Integration', 'Integrate with third-party payment API', 'Project Alpha', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440002', 'UI/UX Design', 'Design wireframes for mobile app', 'Project Beta', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Database Optimization', 'Optimize slow queries and add indexes', 'Project Gamma', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Insert sample time entries
INSERT INTO time_entries (task_id, vendor_id, start_time, end_time, duration, description) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '2024-01-15 09:00:00+00', '2024-01-15 12:30:00+00', 12600, 'Worked on login component'),
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '2024-01-15 13:30:00+00', '2024-01-15 17:00:00+00', 12600, 'Implemented user profile page'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '2024-01-16 10:00:00+00', '2024-01-16 14:00:00+00', 14400, 'Payment API integration'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '2024-01-16 09:00:00+00', '2024-01-16 13:00:00+00', 14400, 'Mobile wireframe design'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-01-17 08:00:00+00', '2024-01-17 11:30:00+00', 12600, 'Database performance analysis');