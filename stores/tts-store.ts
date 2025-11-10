import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Accent = "american" | "british" | "australian";

interface TTSState {
  accent: Accent;
  isEnabled: boolean;
  setAccent: (accent: Accent) => void;
  setIsEnabled: (enabled: boolean) => void;
}

export const useTTSStore = create<TTSState>()(
  persist(
    (set) => ({
      accent: "american",
      isEnabled: true,
      setAccent: (accent) => set({ accent }),
      setIsEnabled: (enabled) => set({ isEnabled: enabled }),
    }),
    {
      name: "tts-settings",
    }
  )
);
