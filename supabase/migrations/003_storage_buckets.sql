-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('certificates', 'certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('media', 'media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CERTIFICATES BUCKET POLICIES (Private)
-- ============================================

-- Missionaries can upload their own certificates
CREATE POLICY "Missionaries can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Missionaries can view their own certificates
CREATE POLICY "Missionaries can view own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all certificates
CREATE POLICY "Admins can view all certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND public.is_admin(auth.uid())
  );

-- Missionaries can update their own certificates
CREATE POLICY "Missionaries can update own certificates"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Missionaries can delete their own certificates
CREATE POLICY "Missionaries can delete own certificates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- MEDIA BUCKET POLICIES (Public read)
-- ============================================

-- Missionaries can upload media
CREATE POLICY "Missionaries can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'missionary'
    )
  );

-- Public can view media
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Missionaries can update their own media
CREATE POLICY "Missionaries can update own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Missionaries can delete their own media
CREATE POLICY "Missionaries can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- AVATARS BUCKET POLICIES (Public read)
-- ============================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public can view avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
