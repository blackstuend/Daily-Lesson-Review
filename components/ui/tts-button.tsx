"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { Volume2, VolumeX, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerAsyncTTS } from "@/lib/tts-utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface TTSButtonProps {
  text: string;
  lessonId?: string;
  ttsAudioUrl?: string | null;
  ttsAudioAccent?: string | null;
  ttsAudioGeneratedAt?: string | null;
  onTTSGenerated?: (audioUrl: string, accent: string) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
}

// Timeout before showing retry button (in ms)
const GENERATION_TIMEOUT = 30000;

export function TTSButton({
  text,
  lessonId,
  ttsAudioUrl,
  ttsAudioAccent,
  ttsAudioGeneratedAt,
  onTTSGenerated,
  variant = "ghost",
  size = "icon-sm",
  className,
}: TTSButtonProps) {
  const { speak, isPlaying, isLoading, isEnabled, currentText, accent } = useTTS();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(ttsAudioGeneratedAt);

  // Check if THIS specific text is currently playing
  const isThisTextPlaying = isPlaying && currentText === text;

  // Check if TTS is cached and matches current accent
  const isCached = !!ttsAudioUrl && ttsAudioAccent === accent;

  // Show spinner if lesson exists but TTS is not yet generated (async generation in progress)
  const isGenerating = !!lessonId && !ttsAudioUrl && !showRetry;

  // Track generation timeout - if no TTS URL after timeout, show retry
  useEffect(() => {
    if (!lessonId || ttsAudioUrl) {
      setShowRetry(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowRetry(true);
    }, GENERATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [lessonId, ttsAudioUrl]);

  // Reset states when TTS URL or timestamp changes (including regeneration)
  useEffect(() => {
    if (ttsAudioUrl) {
      setShowRetry(false);
      setIsRetrying(false);
    }
  }, [ttsAudioUrl]);

  // Reset regenerating state when timestamp changes
  useEffect(() => {
    if (ttsAudioGeneratedAt && ttsAudioGeneratedAt !== lastGeneratedAt) {
      setIsRegenerating(false);
      setLastGeneratedAt(ttsAudioGeneratedAt);
    }
  }, [ttsAudioGeneratedAt, lastGeneratedAt]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text, lessonId, ttsAudioUrl, ttsAudioAccent, onTTSGenerated);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lessonId) return;

    setIsRetrying(true);
    setShowRetry(false);
    triggerAsyncTTS({ lessonId, text, accent });

    // Reset retry state after timeout if still no URL
    setTimeout(() => {
      setIsRetrying(false);
      setShowRetry(true);
    }, GENERATION_TIMEOUT);
  };

  const handleRegenerate = () => {
    if (!lessonId) return;

    setIsRegenerating(true);
    triggerAsyncTTS({ lessonId, text, accent });

    // Reset after timeout - the realtime subscription will update the URL
    setTimeout(() => {
      setIsRegenerating(false);
    }, GENERATION_TIMEOUT);
  };

  if (!isEnabled) {
    return null;
  }

  // Show retry button when generation timed out
  if (showRetry && !ttsAudioUrl) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleRetry}
        disabled={isRetrying}
        className={cn("shrink-0 relative text-amber-600 border-amber-300 hover:bg-amber-50", className)}
        title="Generation failed. Click to retry."
        aria-label="Retry audio generation"
      >
        {isRetrying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
    );
  }

  const title = isGenerating || isRegenerating
    ? "Generating..."
    : isThisTextPlaying
      ? "Stop"
      : isCached
        ? "Listen (cached). Right-click to regenerate."
        : "Listen";

  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isGenerating || isRegenerating}
      className={cn("shrink-0 relative", className)}
      title={title}
      aria-label={isRegenerating ? "Regenerating audio" : isGenerating ? "Generating audio" : isThisTextPlaying ? "Stop audio" : "Play audio"}
    >
      {isLoading || isGenerating || isRegenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isThisTextPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );

  // When TTS exists, wrap with context menu for regenerate option
  if (ttsAudioUrl && lessonId) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {buttonElement}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleRegenerate} disabled={isRegenerating}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate audio
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return buttonElement;
}
