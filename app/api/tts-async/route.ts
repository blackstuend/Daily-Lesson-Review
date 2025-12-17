import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadTTSAudio } from "@/lib/supabase/storage";

export const runtime = "edge";

// Voice mapping for different accents
const VOICE_MAPPING = {
  american: "alloy",
  british: "shimmer",
  australian: "coral",
} as const;

type Accent = keyof typeof VOICE_MAPPING;

export async function POST(request: NextRequest) {
  try {
    const { lessonId, text, accent = "american" } = await request.json();

    if (!lessonId || !text) {
      return NextResponse.json(
        { error: "lessonId and text are required" },
        { status: 400 }
      );
    }

    if (typeof text !== "string" || text.length > 4096) {
      return NextResponse.json(
        { error: "Text must be a string with max 4096 characters" },
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

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify lesson belongs to user
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, user_id")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson || lesson.user_id !== user.id) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
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
        model: "gpt-4o-mini-tts",
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

    // Upload to Supabase Storage
    const audioUrl = await uploadTTSAudio(user.id, lessonId, accent, audioData);

    if (!audioUrl) {
      return NextResponse.json(
        { error: "Failed to upload audio" },
        { status: 500 }
      );
    }

    // Update the lesson record - this triggers the Realtime notification
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        tts_audio_url: audioUrl,
        tts_audio_accent: accent,
        tts_audio_generated_at: generatedAt,
      })
      .eq("id", lessonId);

    if (updateError) {
      console.error("Failed to update lesson with TTS URL:", updateError);
      return NextResponse.json(
        { error: "Failed to update lesson" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      accent,
      generatedAt,
    });
  } catch (error) {
    console.error("Async TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
