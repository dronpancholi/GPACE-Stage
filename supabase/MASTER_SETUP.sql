-- ==========================================
-- GPACE STAGE: COMPLETE DATABASE SETUP
-- Paste this ENTIRE file into your Supabase SQL Editor and hit "Run"
-- ==========================================

/* 
-- EMERGENCY: CLEAN START (Optional)
-- If your tables are broken and you want to start fresh, 
-- uncomment these lines by removing the /* and */ and run once.
-- WARNING: This deletes ALL DATA.

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reputation_events CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.subgroup_members CASCADE;
DROP TABLE IF EXISTS public.subgroups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
*/

-- 1. Custom Types
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE subgroup_type AS ENUM ('open', 'restricted', 'private'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE post_type AS ENUM ('discussion', 'question', 'resource', 'announcement'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create foundational tables if they do not exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  reputation INTEGER DEFAULT 0 NOT NULL,
  bio TEXT,
  feed_sort TEXT DEFAULT 'hot' NOT NULL,
  notify_replies BOOLEAN DEFAULT true NOT NULL,
  notify_approvals BOOLEAN DEFAULT true NOT NULL,
  allow_anonymous BOOLEAN DEFAULT false NOT NULL,
  profile_visibility BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB,
  require_approval BOOLEAN DEFAULT false,
  type subgroup_type DEFAULT 'open'::subgroup_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subgroup_members (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, subgroup_id)
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  type post_type DEFAULT 'discussion'::post_type NOT NULL,
  status post_status DEFAULT 'pending'::post_status NOT NULL,
  rejection_reason TEXT,
  is_pinned BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status post_status DEFAULT 'approved'::post_status NOT NULL,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type vote_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Row Level Security & Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing to prevent duplication errors, then re-apply
DROP POLICY IF EXISTS "Public users view" ON public.users;
DROP POLICY IF EXISTS "Users insert own" ON public.users;
DROP POLICY IF EXISTS "Users update own" ON public.users;

CREATE POLICY "Public users view" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public subgroups view" ON public.subgroups;
DROP POLICY IF EXISTS "Users can create subgroups" ON public.subgroups;
CREATE POLICY "Public subgroups view" ON public.subgroups FOR SELECT USING (true);
CREATE POLICY "Users can create subgroups" ON public.subgroups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public subgroup members view" ON public.subgroup_members;
DROP POLICY IF EXISTS "Users can insert subgroup members" ON public.subgroup_members;
CREATE POLICY "Public subgroup members view" ON public.subgroup_members FOR SELECT USING (true);
CREATE POLICY "Users can insert subgroup members" ON public.subgroup_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Approved posts viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Approved posts viewable by everyone" ON public.posts FOR SELECT USING (status = 'approved' OR auth.uid() = author_id);
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Votes viewable by everyone" ON public.votes;
DROP POLICY IF EXISTS "Users can insert own votes" ON public.votes;
CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- 3.5 Vote Synchronization Triggers
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
      ELSE UPDATE public.posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id; END IF;
    ELSIF NEW.comment_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
      ELSE UPDATE public.comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id; END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN UPDATE public.posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
      ELSE UPDATE public.posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id; END IF;
    ELSIF OLD.comment_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN UPDATE public.comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
      ELSE UPDATE public.comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id; END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.post_id IS NOT NULL THEN
        IF NEW.vote_type = 'upvote' THEN UPDATE public.posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.post_id;
        ELSE UPDATE public.posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.post_id; END IF;
      ELSIF NEW.comment_id IS NOT NULL THEN
        IF NEW.vote_type = 'upvote' THEN UPDATE public.comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.comment_id;
        ELSE UPDATE public.comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.comment_id; END IF;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_changed ON public.votes;
CREATE TRIGGER on_vote_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE PROCEDURE public.update_vote_counts();

-- 4. Auto-Sync Trigger (Creates a user dynamically the moment they Log in/Sign up via Supabase Auth)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Heal any previously logged-in identities explicitly
INSERT INTO public.users (id, display_name, role, reputation)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 'user', 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 5. Admin & Moderation Extensions
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL, -- 'open', 'resolved', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator'))
);
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

