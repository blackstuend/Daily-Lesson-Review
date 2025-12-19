/**
 * Utility functions for TTS generation
 */

import { createClient } from "@/lib/supabase/client";

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
 * Triggers TTS regeneration by calling the Edge Function directly.
 * Used for retry and regenerate functionality.
 * For new lessons, the database trigger handles TTS generation automatically.
 */
export async function triggerAsyncTTS({
  lessonId,
  text,
  accent = "american",
}: {
  lessonId: string;
  text: string;
  accent?: "american" | "british" | "australian";
}): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error("No session found for TTS regeneration");
      return;
    }

    // Build webhook-like payload for the Edge Function
    const payload = {
      type: "INSERT",
      table: "lessons",
      schema: "public",
      record: {
        id: lessonId,
        user_id: session.user.id,
        title: text,
        content: null,
        lesson_type: "word",
        tts_audio_url: null, // Force regeneration
        tts_audio_accent: accent,
      },
      old_record: null,
    };

    // Call Edge Function directly
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-tts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error("Failed to trigger TTS:", await response.text());
    }
  } catch (error) {
    console.error("Failed to trigger async TTS:", error);
  }
}

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
