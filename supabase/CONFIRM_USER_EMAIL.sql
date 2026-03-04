-- ============================================================
-- Manually Confirm User Email in Supabase
-- Run this in Supabase SQL Editor after creating a user
-- ============================================================

-- Option 1: Confirm a SPECIFIC user by email
-- Replace 'your-email@example.com' with the actual email
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'Justlikeadream1@gmail.com';

-- Also update the public.users table if it exists
UPDATE public.users 
SET 
  email_verified = true,
  account_status = 'pending'
WHERE email = 'Justlikeadream1@gmail.com';

-- ============================================================
-- Option 2: Confirm ALL unconfirmed users (use with caution!)
-- ============================================================
-- UPDATE auth.users 
-- SET 
--   email_confirmed_at = NOW(),
--   confirmed_at = NOW(),
--   updated_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- ============================================================
-- Option 3: Check current user status
-- ============================================================
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check if user exists in public.users table
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 10;
