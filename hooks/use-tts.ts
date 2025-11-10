import { useState, useCallback, useEffect } from "react";
import { useTTSStore } from "@/stores/tts-store";
import { toast } from "sonner";

interface UseTTSOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Global audio manager to ensure only one audio plays at a time
class GlobalAudioManager {
  private static instance: GlobalAudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentText: string = "";
  private currentUrl: string = "";
  private listeners: Set<(text: string, isPlaying: boolean) => void> = new Set();

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  subscribe(listener: (text: string, isPlaying: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(text: string, isPlaying: boolean) {
    this.listeners.forEach((listener) => listener(text, isPlaying));
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // Ignore pause errors
      }
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = "";
    }
    this.notify(this.currentText, false);
    this.currentText = "";
  }

  async play(text: string, audioUrl: string, audio: HTMLAudioElement) {
    // Stop any currently playing audio and wait a bit for cleanup
    this.stop();

    // Small delay to ensure previous audio is fully stopped
    await new Promise(resolve => setTimeout(resolve, 50));

    this.currentText = text;
    this.currentUrl = audioUrl;
    this.currentAudio = audio;

    audio.onplay = () => {
      this.notify(text, true);
    };

    audio.onended = () => {
      this.stop();
    };

    audio.onerror = () => {
      this.stop();
    };

    try {
      await audio.play();
    } catch (error) {
      // If play fails, clean up
      console.error("Audio play error:", error);
      this.stop();
      throw error;
    }
  }

  getCurrentText(): string {
    return this.currentText;
  }

  isPlaying(text: string): boolean {
    return this.currentText === text && this.currentAudio !== null;
  }
}

export function useTTS(options?: UseTTSOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState("");

  const { accent, isEnabled } = useTTSStore();
  const audioManager = GlobalAudioManager.getInstance();

  // Subscribe to global audio state changes
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((text, playing) => {
      setCurrentText(text);
      setIsPlaying(playing);

      if (playing) {
        options?.onPlay?.();
      } else if (text && !playing) {
        options?.onEnd?.();
      }
    });

    return unsubscribe;
  }, [audioManager, options]);

  const stop = useCallback(() => {
    audioManager.stop();
    options?.onPause?.();
  }, [audioManager, options]);

  const speak = useCallback(
    async (text: string) => {
      if (!isEnabled) {
        toast.error("Text-to-speech is disabled in settings");
        return;
      }

      if (!text || text.trim().length === 0) {
        toast.error("No text to speak");
        return;
      }

      try {
        // If already playing the same text, pause it
        if (audioManager.isPlaying(text)) {
          stop();
          return;
        }

        setIsLoading(true);

        // Call the TTS API
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text.trim(),
            accent,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({
            error: "Failed to generate speech",
          }));
          throw new Error(error.error || "Failed to generate speech");
        }

        // Create blob from audio data
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play audio through global manager
        const audio = new Audio(audioUrl);

        setIsLoading(false);
        await audioManager.play(text, audioUrl, audio);
      } catch (error) {
        setIsLoading(false);
        const err = error instanceof Error ? error : new Error("Unknown error");
        options?.onError?.(err);
        toast.error(err.message || "Failed to generate speech");
        console.error("TTS error:", error);
      }
    },
    [accent, isEnabled, audioManager, stop, options]
  );

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
    isEnabled,
    currentText,
  };
}
