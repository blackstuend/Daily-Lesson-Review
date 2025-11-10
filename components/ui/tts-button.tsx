"use client";

import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TTSButtonProps {
  text: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
  showLabel?: boolean;
}

export function TTSButton({
  text,
  variant = "ghost",
  size = "icon-sm",
  className,
  showLabel = false,
}: TTSButtonProps) {
  const { speak, isPlaying, isLoading, isEnabled, currentText } = useTTS();

  // Check if THIS specific text is currently playing
  const isThisTextPlaying = isPlaying && currentText === text;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn("shrink-0", className)}
      title={isThisTextPlaying ? "Stop" : "Listen"}
      aria-label={isThisTextPlaying ? "Stop audio" : "Play audio"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isThisTextPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
