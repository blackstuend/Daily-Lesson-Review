// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Voice mapping for different accents
const VOICE_MAPPING: Record<string, string> = {
  american: "alloy",
  british: "shimmer",
  australian: "coral",
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Webhook payload type from Supabase
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    content: string | null;
    lesson_type: "word" | "sentence" | "link";
    tts_audio_url: string | null;
    tts_audio_accent: string | null;
  };
  old_record: null | Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    console.log(
      `Processing lesson: ${record.id}, type: ${record.lesson_type}`
    );

    // Only process word and sentence types
    if (!["word", "sentence"].includes(record.lesson_type)) {
      console.log(`Skipping TTS for lesson type: ${record.lesson_type}`);
      return new Response(JSON.stringify({ skipped: true, reason: "not word/sentence" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if TTS already exists
    if (record.tts_audio_url) {
      console.log(`TTS already exists for lesson: ${record.id}`);
      return new Response(JSON.stringify({ skipped: true, reason: "already exists" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const text = record.title;
    const accent = "american";
    const voice = VOICE_MAPPING[accent];

    console.log(
      `Generating TTS for: "${text.substring(0, 50)}..." with voice: ${voice}`
    );

    // Call OpenAI TTS API
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: text.trim(),
        voice: voice,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("OpenAI TTS error:", errorText);
      return new Response(
        JSON.stringify({ error: "TTS generation failed", details: errorText }),
        {
          status: ttsResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get audio data
    const audioData = await ttsResponse.arrayBuffer();
    const generatedAt = new Date().toISOString();
    const filePath = `${record.user_id}/${record.id}_${accent}.mp3`;

    console.log(`Uploading audio to storage: ${filePath}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("tts-audio")
      .upload(filePath, audioData, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload audio",
          details: uploadError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("tts-audio")
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    console.log(`Updating lesson with audio URL: ${audioUrl}`);

    // Update the lesson record
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        tts_audio_url: audioUrl,
        tts_audio_accent: accent,
        tts_audio_generated_at: generatedAt,
      })
      .eq("id", record.id);

    if (updateError) {
      console.error("Lesson update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update lesson",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully generated TTS for lesson: ${record.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        lessonId: record.id,
        audioUrl,
        accent,
        generatedAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
