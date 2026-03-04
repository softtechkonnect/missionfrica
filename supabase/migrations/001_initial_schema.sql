-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (ENUMs)
CREATE TYPE account_status AS ENUM (
  'email_unverified',
  'pending',
  'under_review',
  'approved',
  'rejected',
  'suspended'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'missionary',
  'donor'
);

CREATE TYPE organization_type AS ENUM (
  'church_extension',
  'independent'
);

CREATE TYPE post_status AS ENUM (
  'pending_review',
  'approved',
  'rejected'
);

CREATE TYPE donation_status AS ENUM (
  'pending',
  'completed',
  'refunded',
  'failed'
);

CREATE TYPE withdrawal_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'donor',
  account_status account_status NOT NULL DEFAULT 'email_unverified',
  public_visible BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Missionary profiles table
CREATE TABLE public.missionary_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type organization_type NOT NULL,
  is_church_registered BOOLEAN,
  registration_number TEXT,
  certificate_url TEXT,
  mission_location TEXT NOT NULL,
  role_in_org TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  total_raised BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missionary_id UUID NOT NULL REFERENCES public.missionary_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status post_status NOT NULL DEFAULT 'pending_review',
  rejection_reason TEXT,
  visible BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  missionary_id UUID NOT NULL REFERENCES public.missionary_profiles(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  platform_fee BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL,
  status donation_status NOT NULL DEFAULT 'pending',
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  available_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missionary_id UUID NOT NULL REFERENCES public.missionary_profiles(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status withdrawal_status NOT NULL DEFAULT 'pending',
  stripe_payout_id TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_account_status ON public.users(account_status);
CREATE INDEX idx_users_public_visible ON public.users(public_visible);
CREATE INDEX idx_missionary_profiles_user_id ON public.missionary_profiles(user_id);
CREATE INDEX idx_missionary_profiles_stripe_account ON public.missionary_profiles(stripe_account_id);
CREATE INDEX idx_posts_missionary_id ON public.posts(missionary_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_visible ON public.posts(visible);
CREATE INDEX idx_donations_missionary_id ON public.donations(missionary_id);
CREATE INDEX idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_available_at ON public.donations(available_at);
CREATE INDEX idx_withdrawals_missionary_id ON public.withdrawals(missionary_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missionary_profiles_updated_at
  BEFORE UPDATE ON public.missionary_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value
  FROM public.users
  WHERE id = user_id;
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available balance for missionary
CREATE OR REPLACE FUNCTION public.get_available_balance(p_missionary_id UUID)
RETURNS BIGINT AS $$
DECLARE
  available BIGINT;
  withdrawn BIGINT;
BEGIN
  -- Get completed donations that are now available
  SELECT COALESCE(SUM(net_amount), 0) INTO available
  FROM public.donations
  WHERE missionary_id = p_missionary_id
    AND status = 'completed'
    AND available_at <= NOW();

  -- Get completed withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO withdrawn
  FROM public.withdrawals
  WHERE missionary_id = p_missionary_id
    AND status = 'completed';

  RETURN available - withdrawn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending balance for missionary
CREATE OR REPLACE FUNCTION public.get_pending_balance(p_missionary_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(net_amount), 0)
    FROM public.donations
    WHERE missionary_id = p_missionary_id
      AND status = 'completed'
      AND available_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count approved posts for missionary
CREATE OR REPLACE FUNCTION public.count_approved_posts(p_missionary_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.posts
    WHERE missionary_id = p_missionary_id
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce max 10 approved posts per missionary
CREATE OR REPLACE FUNCTION public.check_post_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF (SELECT public.count_approved_posts(NEW.missionary_id)) >= 10 THEN
      RAISE EXCEPTION 'Maximum of 10 approved posts allowed per missionary';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_post_limit
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_post_limit();

-- Trigger to update total_raised on missionary profile
CREATE OR REPLACE FUNCTION public.update_total_raised()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    UPDATE public.missionary_profiles
    SET total_raised = total_raised + NEW.net_amount
    WHERE id = NEW.missionary_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_missionary_total_raised
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_total_raised();

-- Handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, account_status, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donor'),
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending'::account_status
      ELSE 'email_unverified'::account_status
    END,
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET 
      email_verified = true,
      account_status = CASE 
        WHEN account_status = 'email_unverified' THEN 'pending'::account_status
        ELSE account_status
      END
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmed();
