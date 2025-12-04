import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadTTSAudio } from "@/lib/supabase/storage";

export const runtime = "edge";

// Voice mapping for different accents
const VOICE_MAPPING = {
  american: "alloy", // Clear American accent
  british: "shimmer", // British-sounding accent
  australian: "coral", // Australian/International accent
} as const;

export type Accent = keyof typeof VOICE_MAPPING;

export async function POST(request: NextRequest) {
  try {
    const { text, accent = "american", lessonId, skipDatabaseUpdate } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 4096 characters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // If lessonId provided and not skipping database check, see if TTS already exists
    if (lessonId && !skipDatabaseUpdate) {
      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("tts_audio_url, tts_audio_accent")
        .eq("id", lessonId)
        .single();

      // If TTS exists and accent matches, return the stored URL
      if (!lessonError && lesson?.tts_audio_url && lesson.tts_audio_accent === accent) {
        return NextResponse.json({
          audioUrl: lesson.tts_audio_url,
          accent: lesson.tts_audio_accent,
          generatedAt: new Date().toISOString(),
          cached: true
        });
      }
    }

    // Get the voice based on accent preference
    const voice = VOICE_MAPPING[accent as Accent] || VOICE_MAPPING.american;

    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts", // Use tts-1 for faster, real-time use cases
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI TTS error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status }
      );
    }

    // Get the audio data as array buffer
    const audioData = await response.arrayBuffer();
    const generatedAt = new Date().toISOString();

    // If lessonId provided, store in Supabase Storage
    if (lessonId && userId) {
      const audioUrl = await uploadTTSAudio(userId, lessonId, accent, audioData);

      if (audioUrl) {
        // Only update database if not skipping
        if (!skipDatabaseUpdate) {
          await supabase
            .from("lessons")
            .update({
              tts_audio_url: audioUrl,
              tts_audio_accent: accent,
              tts_audio_generated_at: generatedAt
            })
            .eq("id", lessonId);
        }

        // Return JSON with audio URL and metadata
        return NextResponse.json({
          audioUrl,
          accent,
          generatedAt,
          cached: false
        });
      }
    }

    // Return the audio data with appropriate headers (backward compatibility)
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
