-- ============================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- STEP 1: Temporarily disable RLS to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on users table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: Sync ALL users from auth.users to public.users BEFORE enabling RLS
INSERT INTO public.users (id, email, full_name, role, account_status, email_verified, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(
        CASE 
            WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
            WHEN au.raw_user_meta_data->>'role' = 'missionary' THEN 'missionary'::user_role
            WHEN au.raw_user_meta_data->>'role' = 'donor' THEN 'donor'::user_role
            ELSE 'donor'::user_role
        END,
        'donor'::user_role
    ),
    'pending'::account_status,
    true,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email_verified = true,
    updated_at = NOW();

-- STEP 4: Create SIMPLE non-recursive policies
-- Policy 1: Users can read their own row
CREATE POLICY "users_read_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can insert their own row  
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own row
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Service role bypass (for triggers and admin operations)
-- This uses auth.jwt() to check role from the JWT token, NOT from the users table
CREATE POLICY "service_role_all" ON public.users
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- STEP 5: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify everything is set up correctly
SELECT 'Policies on users table:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';

SELECT 'Users synced:' as info;
SELECT id, email, role, account_status, email_verified FROM public.users ORDER BY created_at DESC;

SELECT 'Auth users:' as info;
SELECT id, email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users ORDER BY created_at DESC;
