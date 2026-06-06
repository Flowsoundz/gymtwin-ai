import { create } from "zustand";
import { CHARACTERS, MIXAMO_IDLE_CLIP } from "@/lib/characters";
import type { CharacterId } from "@/lib/characters";

type CoachStore = {
  characterId: CharacterId;
  currentAnimation: string;
  setCharacter: (id: CharacterId) => void;
  setAnimation: (name: string) => void;
};

export const useCoachStore = create<CoachStore>()((set) => ({
  characterId: "atlas",
  currentAnimation: MIXAMO_IDLE_CLIP,
  setCharacter: (id) => {
    if (!CHARACTERS[id]?.available) return;
    set({ characterId: id });
  },
  setAnimation: (name) => set({ currentAnimation: name }),
}));
