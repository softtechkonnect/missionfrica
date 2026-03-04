-- ============================================================
-- FIX RLS POLICY FOR USERS TABLE
-- Run this in Supabase SQL Editor to fix the login issues
-- ============================================================

-- 1. First, check current policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 2. Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 3. Create proper RLS policies
-- Allow users to read their own profile
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to insert their own profile (critical for new signups)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to read all users
CREATE POLICY "admins_select_all" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update all users
CREATE POLICY "admins_update_all" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Verify the new user exists in public.users (if not, insert them)
-- Replace the email with your actual email
INSERT INTO public.users (id, email, full_name, role, account_status, email_verified, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'donor'::user_role),
    'pending'::account_status,
    true,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- 6. Verify users are synced
SELECT 
    au.email as auth_email,
    pu.email as public_email,
    pu.role,
    pu.account_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
