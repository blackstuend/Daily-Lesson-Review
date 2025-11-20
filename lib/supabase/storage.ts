import { createClient } from "@/lib/supabase/server"

/**
 * Upload TTS audio file to Supabase Storage
 * @param userId - User ID for folder organization
 * @param lessonId - Lesson ID for file naming
 * @param accent - Accent used for generation
 * @param audioBuffer - Audio data as ArrayBuffer
 * @returns Public URL of the uploaded file or null if failed
 */
export async function uploadTTSAudio(
  userId: string,
  lessonId: string,
  accent: string,
  audioBuffer: ArrayBuffer
): Promise<string | null> {
  try {
    const supabase = await createClient()

    // Create file path: {userId}/{lessonId}_{accent}.mp3
    const filePath = `${userId}/${lessonId}_${accent}.mp3`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('tts-audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true, // Replace if already exists
      })

    if (error) {
      console.error('Error uploading TTS audio:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tts-audio')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Exception uploading TTS audio:', error)
    return null
  }
}

/**
 * Delete TTS audio file from Supabase Storage
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @param accent - Accent of the file to delete
 * @returns true if successful, false otherwise
 */
export async function deleteTTSAudio(
  userId: string,
  lessonId: string,
  accent: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const filePath = `${userId}/${lessonId}_${accent}.mp3`

    const { error } = await supabase.storage
      .from('tts-audio')
      .remove([filePath])

    if (error) {
      console.error('Error deleting TTS audio:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception deleting TTS audio:', error)
    return false
  }
}

/**
 * Check if TTS audio exists for a lesson
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @param accent - Accent to check
 * @returns true if file exists, false otherwise
 */
export async function ttsAudioExists(
  userId: string,
  lessonId: string,
  accent: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from('tts-audio')
      .list(userId, {
        search: `${lessonId}_${accent}.mp3`
      })

    if (error) {
      console.error('Error checking TTS audio:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Exception checking TTS audio:', error)
    return false
  }
}
