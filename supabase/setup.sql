-- Supabase setup for VK Quiz
-- Run in Supabase SQL Editor after creating project

-- Storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for quiz images
CREATE POLICY "Public read quiz images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-images');

-- Authenticated users can upload
CREATE POLICY "Auth users upload quiz images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-images');

-- Optional: disable email confirmation for MVP (Authentication → Providers → Email)
-- Or keep confirmation and users complete profile after first login
