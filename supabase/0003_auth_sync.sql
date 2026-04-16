-- 0003_auth_sync.sql
-- Create a trigger that automatically inserts into public.users when a new auth.users row is created.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, display_name, role, reputation, created_at, updated_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 
    'user', 
    0, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Manually fix all existing broken links (Upsert any existing auth user without a public user)
INSERT INTO public.users (id, display_name, role, reputation)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 'user', 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
