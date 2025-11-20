"use client";

import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TTSButtonProps {
  text: string;
  lessonId?: string;
  ttsAudioUrl?: string | null;
  ttsAudioAccent?: string | null;
  onTTSGenerated?: (audioUrl: string, accent: string) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
}

export function TTSButton({
  text,
  lessonId,
  ttsAudioUrl,
  ttsAudioAccent,
  onTTSGenerated,
  variant = "ghost",
  size = "icon-sm",
  className,
}: TTSButtonProps) {
  const { speak, isPlaying, isLoading, isEnabled, currentText, accent } = useTTS();

  // Check if THIS specific text is currently playing
  const isThisTextPlaying = isPlaying && currentText === text;

  // Check if TTS is cached and matches current accent
  const isCached = !!ttsAudioUrl && ttsAudioAccent === accent;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text, lessonId, ttsAudioUrl, ttsAudioAccent, onTTSGenerated);
  };

  if (!isEnabled) {
    return null;
  }

  const title = isThisTextPlaying
    ? "Stop"
    : isCached
      ? "Listen (cached)"
      : "Listen";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn("shrink-0 relative", className)}
      title={title}
      aria-label={isThisTextPlaying ? "Stop audio" : "Play audio"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isThisTextPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {isCached && !isThisTextPlaying && !isLoading && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
      )}
    </Button>
  );
}
