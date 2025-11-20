-- Create Supabase Storage bucket for TTS audio files
-- Files will be stored as: {user_id}/{lesson_id}_{accent}.mp3

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for TTS audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'tts-audio');

-- Allow authenticated users to insert their own files
CREATE POLICY "Users can upload their own TTS audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tts-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own TTS audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tts-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own TTS audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tts-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
