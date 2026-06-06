import { create } from "zustand";
import { CHARACTERS, MIXAMO_IDLE_CLIP } from "@/lib/characters";
import type { CharacterId } from "@/lib/characters";
import type { AvatarDisplayMode } from "@/types";

export type CoachSize = "compact" | "balanced" | "immersive";

type CoachStore = {
  // Identity
  characterId: CharacterId;
  // Animation
  currentAnimation: string;
  isModelLoaded: boolean;
  // Layout (mirrors AvatarDisplaySettings)
  displayLayout: AvatarDisplayMode;
  coachSize: CoachSize;

  // Actions
  setCharacter: (id: CharacterId) => void;
  setAnimation: (name: string) => void;
  setLoaded: (loaded: boolean) => void;
  setDisplayLayout: (layout: AvatarDisplayMode) => void;
  setCoachSize: (size: CoachSize) => void;
};

export const useCoachStore = create<CoachStore>()((set) => ({
  characterId: "atlas",
  currentAnimation: MIXAMO_IDLE_CLIP,
  isModelLoaded: false,
  displayLayout: "coach_card",
  coachSize: "balanced",

  setCharacter: (id) => {
    if (!CHARACTERS[id]?.available) return;
    set({ characterId: id, isModelLoaded: false });
  },
  setAnimation: (name) => set({ currentAnimation: name }),
  setLoaded: (loaded) => set({ isModelLoaded: loaded }),
  setDisplayLayout: (layout) => set({ displayLayout: layout }),
  setCoachSize: (size) => set({ coachSize: size }),
}));
