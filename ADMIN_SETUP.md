# Admin Setup Guide for MissionFrica

## Setting Up an Admin User

To access the admin dashboard at `/admin`, you need to create an admin user in your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** > **users**
3. Find the user you want to make an admin
4. Click on the row to edit it
5. Change the `role` field from `donor` or `missionary` to `admin`
6. Save the changes

### Option 2: Using SQL in Supabase SQL Editor

```sql
-- Replace 'your-email@example.com' with the actual admin email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Option 3: Create a New Admin User

1. Register a new account at `/auth/register`
2. Choose either "Donor" or "Missionary" role
3. Verify your email by clicking the link in your inbox
4. Then run the SQL above to upgrade the account to admin

## Accessing the Admin Dashboard

Once you have an admin user:

1. Log in with your admin credentials at `/auth/login`
2. Navigate to `/admin` to access the admin dashboard

## Admin Features

The admin dashboard allows you to:

- **Manage Missionaries**: Review, approve, or reject missionary applications
- **Manage Posts**: Review and approve posts before they go live
- **Manage Withdrawals**: Approve withdrawal requests from missionaries
- **View Donations**: See all donation activity
- **View Audit Logs**: Track all admin actions

## Troubleshooting

### "Database error saving new user"

This error occurs when the Supabase trigger `handle_new_user` fails to create a user record. 

**Common causes:**

1. **Trigger not created**: Ensure the database migrations have been run
2. **RLS policies blocking insert**: Check that the trigger has `SECURITY DEFINER` set

**To fix:**

Run this SQL in your Supabase SQL Editor:

```sql
-- Recreate the trigger function with proper permissions
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
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth signup
  RAISE WARNING 'Failed to create user record: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Admin page redirects to /dashboard

This means either:
1. You're not logged in
2. Your account doesn't have the `admin` role

Check your user record in the `users` table to verify the role is set to `admin`.
