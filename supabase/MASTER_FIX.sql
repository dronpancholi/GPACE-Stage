-- MASTER EMERGENCY FIX SCRIPT
-- Paste this entire file into your Supabase SQL Editor and hit RUN.

-- 1. Create the Bio column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Drop existing restrictive subgroup policies just in case
DROP POLICY IF EXISTS "Users can create subgroups" ON public.subgroups;
DROP POLICY IF EXISTS "Users can insert subgroup members" ON public.subgroup_members;

-- 3. Add explicit policy granting permission to create spaces/subgroups
CREATE POLICY "Users can create subgroups" ON public.subgroups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Add explicit policy granting permission to join/create members in a logic flow
CREATE POLICY "Users can insert subgroup members" ON public.subgroup_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Auto-Healer Trigger: Fix users who are missing from the profile database
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

-- 6. Activate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Heal orphaned users retroactively
INSERT INTO public.users (id, display_name, role, reputation)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 'user', 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
