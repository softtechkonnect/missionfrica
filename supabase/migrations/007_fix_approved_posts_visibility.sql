-- Fix any approved posts that don't have visible = true
-- This is a one-time migration to fix posts approved before the visibility fix

UPDATE public.posts 
SET visible = true 
WHERE status = 'approved' AND visible = false;

-- Also ensure approved_at is set for approved posts without it
UPDATE public.posts 
SET approved_at = updated_at 
WHERE status = 'approved' AND approved_at IS NULL;
