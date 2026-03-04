-- ============================================================
-- FIX ADMIN ACCESS - Run this in Supabase SQL Editor
-- ============================================================

-- 1. First check current state
SELECT 'Auth Users:' as info;
SELECT id, email, raw_user_meta_data->>'role' as meta_role FROM auth.users;

SELECT 'Public Users:' as info;
SELECT id, email, role FROM public.users;

-- 2. Update admin1@missionfrica.com to be admin in public.users
UPDATE public.users 
SET role = 'admin'::user_role
WHERE email = 'admin1@missionfrica.com';

-- 3. If admin doesn't exist in public.users, insert them
INSERT INTO public.users (id, email, full_name, role, account_status, email_verified, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin'),
    'admin'::user_role,
    'approved'::account_status,
    true,
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email = 'admin1@missionfrica.com'
AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    account_status = 'approved'::account_status;

-- 4. Verify the fix
SELECT 'After fix - Admin user:' as info;
SELECT id, email, role, account_status FROM public.users WHERE email = 'admin1@missionfrica.com';

-- 5. Add RLS policy to allow admins to read all users
DROP POLICY IF EXISTS "admins_read_all" ON public.users;
CREATE POLICY "admins_read_all" ON public.users
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
        OR auth.uid() = id
    );

-- 6. Show all policies
SELECT 'Current policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
