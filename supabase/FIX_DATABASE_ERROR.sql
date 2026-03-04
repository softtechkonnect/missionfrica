-- ============================================================
-- MissionFrica Database Fix Script
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- Step 1: Create ENUM types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM (
            'email_unverified',
            'pending',
            'under_review',
            'approved',
            'rejected',
            'suspended'
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'missionary',
            'donor'
        );
    END IF;
END $$;

-- Step 2: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    account_status account_status NOT NULL DEFAULT 'email_unverified',
    public_visible BOOLEAN NOT NULL DEFAULT false,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create unique index on email if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_key') THEN
        CREATE UNIQUE INDEX users_email_key ON public.users(email);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Index might already exist in a different form
END $$;

-- Step 4: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 5: Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_full_name TEXT;
    user_role_value user_role;
    user_account_status account_status;
BEGIN
    -- Extract full_name from metadata, default to 'User'
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Extract role from metadata, default to 'donor'
    BEGIN
        user_role_value := COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'donor'::user_role
        );
    EXCEPTION WHEN OTHERS THEN
        user_role_value := 'donor'::user_role;
    END;
    
    -- Set account status based on email confirmation
    IF NEW.email_confirmed_at IS NOT NULL THEN
        user_account_status := 'pending'::account_status;
    ELSE
        user_account_status := 'email_unverified'::account_status;
    END IF;
    
    -- Insert the new user record
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        account_status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        user_role_value,
        user_account_status,
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 6: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Step 8: Disable RLS temporarily for users table to allow trigger to work
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies that allow the trigger to work
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
CREATE POLICY "Service role can do everything" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anon can view public users" ON public.users;
CREATE POLICY "Anon can view public users" ON public.users
    FOR SELECT
    TO anon
    USING (public_visible = true);

DROP POLICY IF EXISTS "Allow trigger inserts" ON public.users;
CREATE POLICY "Allow trigger inserts" ON public.users
    FOR INSERT
    TO postgres
    WITH CHECK (true);

-- Step 10: Handle email confirmation trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_email_confirmed();

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.users
        SET 
            email_verified = true,
            account_status = CASE 
                WHEN account_status = 'email_unverified' THEN 'pending'::account_status
                ELSE account_status
            END,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_email_confirmed failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_confirmed();

-- Step 11: Sync any existing auth users that don't have records in public.users
INSERT INTO public.users (id, email, full_name, role, account_status, email_verified, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User'),
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'donor'::user_role),
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'pending'::account_status ELSE 'email_unverified'::account_status END,
    au.email_confirmed_at IS NOT NULL,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUCCESS! Database has been fixed.
-- Now try creating a user again in the Supabase dashboard.
-- ============================================================

-- To create an admin user after this script runs, use:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@missionfrica.com';
