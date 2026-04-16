-- 0004_add_bio.sql
-- Add bio column to public.users for profile rendering

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT;
