-- GPACE Stage Production Database Schema (Supabase)

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE subgroup_type AS ENUM ('open', 'restricted', 'private');
CREATE TYPE post_type AS ENUM ('discussion', 'question', 'resource', 'announcement');
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected', 'deleted');
CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');

-- 2. Tables

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  reputation INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB, -- Array of rules { title: '', detail: '' }
  require_approval BOOLEAN DEFAULT false,
  type subgroup_type DEFAULT 'open'::subgroup_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.subgroup_members (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, subgroup_id)
);

CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  type post_type DEFAULT 'discussion'::post_type NOT NULL,
  status post_status DEFAULT 'pending'::post_status NOT NULL, -- Defaults to pending
  rejection_reason TEXT,
  is_pinned BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT min_content_length CHECK (char_length(content) >= 10)
);

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status post_status DEFAULT 'approved'::post_status NOT NULL,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT min_comment_length CHECK (char_length(content) >= 2)
);

CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type vote_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT check_single_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, comment_id)
);

CREATE TABLE public.reputation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- e.g., 'post_approved', 'post_rejected', 'comment_reply'
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes for Performance Optimization
CREATE INDEX idx_posts_subgroup_status ON public.posts(subgroup_id, status);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_votes_user_post ON public.votes(user_id, post_id);
CREATE INDEX idx_votes_user_comment ON public.votes(user_id, comment_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- 4. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users view" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public subgroups view" ON public.subgroups FOR SELECT USING (true);
CREATE POLICY "Public subgroup members view" ON public.subgroup_members FOR SELECT USING (true);

CREATE POLICY "Approved posts viewable by everyone" ON public.posts FOR SELECT USING (status = 'approved' OR auth.uid() = author_id);
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Approved comments viewable by everyone" ON public.comments FOR SELECT USING (status = 'approved' OR auth.uid() = author_id);
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 5. Triggers for modified timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER tr_update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_posts_modtime BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_comments_modtime BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Trigger: Self-Vote Prevention & Vote Rate Limit
CREATE OR REPLACE FUNCTION check_vote_validity() RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  recent_votes INT;
BEGIN
  -- Rate limiting: Max 5 votes per minute
  SELECT count(*) INTO recent_votes FROM public.votes 
  WHERE user_id = NEW.user_id AND created_at > NOW() - INTERVAL '1 minute';
  IF recent_votes > 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before voting again.';
  END IF;

  -- Self-vote prevention
  IF NEW.post_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM public.posts WHERE id = NEW.post_id;
  ELSIF NEW.comment_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM public.comments WHERE id = NEW.comment_id;
  END IF;

  IF target_author_id = NEW.user_id THEN
    RAISE EXCEPTION 'Self-voting is not permitted.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_check_vote_validity
BEFORE INSERT ON public.votes
FOR EACH ROW EXECUTE FUNCTION check_vote_validity();

-- 7. Trigger: Update Reputation Points
CREATE OR REPLACE FUNCTION update_user_reputation() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET reputation = reputation + NEW.points WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_user_reputation AFTER INSERT ON public.reputation_events
FOR EACH ROW EXECUTE FUNCTION update_user_reputation();
