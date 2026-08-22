-- ============================================================================
-- SPORTSFORALL SUPABASE MIGRATION: PUBLIC ASSETS STORAGE BUCKET
-- Creates:
-- 1. 'public-assets' storage bucket for logos and static assets
-- 2. Public read RLS policy so Razorpay checkout & web app can load images
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Allow insert access for asset uploads
DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
CREATE POLICY "Allow Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-assets');
