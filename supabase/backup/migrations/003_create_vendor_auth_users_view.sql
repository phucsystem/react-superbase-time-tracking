-- Migration: Create vendor_auth_users view for vendor selection in UI
CREATE OR REPLACE VIEW public.vendor_auth_users AS
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE (raw_user_meta_data->>'role') = 'vendor';

GRANT SELECT ON public.vendor_auth_users TO anon, authenticated; 