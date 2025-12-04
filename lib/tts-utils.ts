/**
 * Utility functions for automatic TTS generation
 */

interface GenerateTTSParams {
  lessonId?: string;
  text: string;
  accent?: "american" | "british" | "australian";
  skipDatabaseUpdate?: boolean;
}

interface TTSResult {
  audioUrl: string;
  accent: string;
  generatedAt: string;
}

/**
 * Generates TTS audio and optionally stores it in the database
 * This function calls the TTS API and waits for the audio URL to be generated
 *
 * @param lessonId - The ID of the lesson (optional if skipDatabaseUpdate is true)
 * @param text - The text content to convert to speech
 * @param accent - The accent to use (defaults to "american")
 * @param skipDatabaseUpdate - If true, generates audio but doesn't update the lesson record
 * @returns The TTS result with audioUrl, accent, and generatedAt, or null if generation failed
 */
export async function generateTTSForLesson({
  lessonId,
  text,
  accent = "american",
  skipDatabaseUpdate = false,
}: GenerateTTSParams): Promise<TTSResult | null> {
  try {
    // Call the TTS API which will generate audio and optionally update the database
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        accent,
        lessonId,
        skipDatabaseUpdate,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate TTS:", await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.audioUrl) {
      return null;
    }

    return {
      audioUrl: data.audioUrl,
      accent: data.accent || accent,
      generatedAt: data.generatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating TTS:", error);
    return null;
  }
}
