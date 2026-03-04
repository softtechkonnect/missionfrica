-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missionary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public can view approved missionaries
CREATE POLICY "Public can view approved missionaries"
  ON public.users FOR SELECT
  USING (
    role = 'missionary' 
    AND account_status = 'approved' 
    AND public_visible = true
  );

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all users
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- MISSIONARY PROFILES TABLE POLICIES
-- ============================================

-- Missionaries can view their own profile
CREATE POLICY "Missionaries can view own profile"
  ON public.missionary_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Missionaries can insert their own profile
CREATE POLICY "Missionaries can insert own profile"
  ON public.missionary_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Missionaries can update their own profile
CREATE POLICY "Missionaries can update own profile"
  ON public.missionary_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public can view approved missionary profiles
CREATE POLICY "Public can view approved missionary profiles"
  ON public.missionary_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = missionary_profiles.user_id
        AND u.account_status = 'approved'
        AND u.public_visible = true
    )
  );

-- Admins can view all missionary profiles
CREATE POLICY "Admins can view all missionary profiles"
  ON public.missionary_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all missionary profiles
CREATE POLICY "Admins can update all missionary profiles"
  ON public.missionary_profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POSTS TABLE POLICIES
-- ============================================

-- Missionaries can view their own posts
CREATE POLICY "Missionaries can view own posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = posts.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Missionaries can insert their own posts
CREATE POLICY "Missionaries can insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = posts.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Missionaries can update their own posts
CREATE POLICY "Missionaries can update own posts"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = posts.missionary_id
        AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = posts.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Missionaries can delete their own pending/rejected posts
CREATE POLICY "Missionaries can delete own pending posts"
  ON public.posts FOR DELETE
  USING (
    status IN ('pending_review', 'rejected')
    AND EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = posts.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Public can view approved and visible posts
CREATE POLICY "Public can view approved posts"
  ON public.posts FOR SELECT
  USING (status = 'approved' AND visible = true);

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
  ON public.posts FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all posts
CREATE POLICY "Admins can update all posts"
  ON public.posts FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- DONATIONS TABLE POLICIES
-- ============================================

-- Donors can view their own donations
CREATE POLICY "Donors can view own donations"
  ON public.donations FOR SELECT
  USING (donor_id = auth.uid());

-- Missionaries can view donations to them
CREATE POLICY "Missionaries can view donations to them"
  ON public.donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = donations.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Anyone can insert donations (for guest donations)
CREATE POLICY "Anyone can insert donations"
  ON public.donations FOR INSERT
  WITH CHECK (true);

-- Admins can view all donations
CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all donations
CREATE POLICY "Admins can update all donations"
  ON public.donations FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- WITHDRAWALS TABLE POLICIES
-- ============================================

-- Missionaries can view their own withdrawals
CREATE POLICY "Missionaries can view own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = withdrawals.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Missionaries can insert withdrawal requests
CREATE POLICY "Missionaries can insert withdrawal requests"
  ON public.withdrawals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missionary_profiles mp
      WHERE mp.id = withdrawals.missionary_id
        AND mp.user_id = auth.uid()
    )
  );

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all withdrawals
CREATE POLICY "Admins can update all withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- System can insert audit logs (using service role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Note: These need to be applied via Supabase Dashboard or separate SQL
-- Certificates bucket (private - admin only access)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Media bucket (public read for approved content)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Avatars bucket (public read)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
