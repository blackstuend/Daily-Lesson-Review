-- Add TTS audio storage columns to lessons table
-- This allows us to permanently store TTS audio URLs from Supabase Storage
-- instead of regenerating audio on every request

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS tts_audio_url text,
ADD COLUMN IF NOT EXISTS tts_audio_accent text,
ADD COLUMN IF NOT EXISTS tts_audio_generated_at timestamptz;

-- Add comment to document the purpose
COMMENT ON COLUMN public.lessons.tts_audio_url IS 'Supabase Storage URL for the generated TTS audio file';
COMMENT ON COLUMN public.lessons.tts_audio_accent IS 'Accent used for TTS generation (american, british, australian)';
COMMENT ON COLUMN public.lessons.tts_audio_generated_at IS 'Timestamp when the TTS audio was generated';
