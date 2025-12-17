"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TTSRealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        console.log("[TTS Realtime] User authenticated:", user.id);
      }
    });
  }, []);

  // Subscribe to realtime updates when user is authenticated
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    console.log("[TTS Realtime] Setting up subscription for user:", userId);

    const channel = supabase
      .channel(`tts-updates`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lessons",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[TTS Realtime] Received update:", payload);
          const { new: newRow, old: oldRow } = payload;
          // Refresh if tts_audio_url changed OR if tts_audio_generated_at changed (for regeneration)
          const urlChanged = newRow.tts_audio_url && newRow.tts_audio_url !== oldRow.tts_audio_url;
          const timestampChanged = newRow.tts_audio_generated_at && newRow.tts_audio_generated_at !== oldRow.tts_audio_generated_at;

          if (urlChanged || timestampChanged) {
            console.log("[TTS Realtime] TTS updated, refreshing...", { urlChanged, timestampChanged });
            router.refresh();
          }
        }
      )
      .subscribe((status, err) => {
        console.log("[TTS Realtime] Subscription status:", status);
        if (err) {
          console.error("[TTS Realtime] Subscription error:", err);
        }
      });

    return () => {
      console.log("[TTS Realtime] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return <>{children}</>;
}
