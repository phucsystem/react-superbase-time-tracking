# Supabase Configuration

This folder contains the Supabase configuration and database setup for the time tracking application.

## Files

- `config.toml` - Supabase CLI configuration
- `init.sql` - Initial database setup (legacy)
- `migrations/` - Database migration files
- `seed.sql` - Sample data for development

## Database Schema

### Tables

1. **vendors** - Store vendor/developer information
   - id (UUID, primary key)
   - name (varchar)
   - email (varchar, unique)
   - rate_per_hour (decimal)
   - created_at, updated_at (timestamps)

2. **tasks** - Store task information
   - id (UUID, primary key)
   - title (varchar)
   - description (text)
   - project (varchar)
   - vendor_id (UUID, foreign key)
   - created_at, updated_at (timestamps)

3. **time_entries** - Store time tracking entries
   - id (UUID, primary key)
   - task_id (UUID, foreign key)
   - vendor_id (UUID, foreign key)
   - start_time (timestamp)
   - end_time (timestamp, nullable)
   - duration (integer, seconds)
   - description (text)
   - created_at, updated_at (timestamps)

## Local Development

The database is automatically initialized when running with Docker Compose. The migration files are executed in order:

1. `init.sql` - Basic setup
2. `migrations/001_initial_schema.sql` - Full schema with indexes and RLS
3. `seed.sql` - Sample data

## Production Setup

For production, you'll want to:

1. Create a Supabase project at https://supabase.com
2. Run the migrations manually or use Supabase CLI
3. Update the environment variables with your production URLs and keys