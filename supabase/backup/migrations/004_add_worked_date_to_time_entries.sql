ALTER TABLE time_entries ADD COLUMN worked_date DATE;
-- Backfill existing rows
UPDATE time_entries SET worked_date = created_at::date WHERE worked_date IS NULL;

