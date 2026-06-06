import { create } from "zustand";
import { CHARACTERS, MIXAMO_IDLE_CLIP } from "@/lib/characters";
import type { CharacterId } from "@/lib/characters";
import type { AvatarDisplayMode } from "@/types";

export type CoachSize = "compact" | "balanced" | "immersive";
export type WorkoutPhase = "ready" | "active" | "peak" | "rest" | "celebrating";

type CoachStore = {
  // Identity
  characterId: CharacterId;
  // Animation
  currentAnimation: string;
  isModelLoaded: boolean;
  // Layout
  displayLayout: AvatarDisplayMode;
  coachSize: CoachSize;
  // Workout pulse — drives dynamic environment
  workoutPhase: WorkoutPhase;
  repProgress: number; // 0–1 within the current set
  // External animation GLB — null = use embedded idle
  animationGLBPath: string | null;

  // Actions
  setCharacter: (id: CharacterId) => void;
  setAnimation: (name: string) => void;
  setLoaded: (loaded: boolean) => void;
  setDisplayLayout: (layout: AvatarDisplayMode) => void;
  setCoachSize: (size: CoachSize) => void;
  setWorkoutPhase: (phase: WorkoutPhase) => void;
  setRepProgress: (progress: number) => void;
  setAnimationGLBPath: (path: string | null) => void;
};

export const useCoachStore = create<CoachStore>()((set) => ({
  characterId: "atlas",
  currentAnimation: MIXAMO_IDLE_CLIP,
  isModelLoaded: false,
  displayLayout: "coach_card",
  coachSize: "balanced",
  workoutPhase: "ready",
  repProgress: 0,
  animationGLBPath: null,

  setCharacter: (id) => {
    if (!CHARACTERS[id]?.available) return;
    set({ characterId: id, isModelLoaded: false });
  },
  setAnimation: (name) => set({ currentAnimation: name }),
  setLoaded: (loaded) => set({ isModelLoaded: loaded }),
  setDisplayLayout: (layout) => set({ displayLayout: layout }),
  setCoachSize: (size) => set({ coachSize: size }),
  setWorkoutPhase: (phase) => set({ workoutPhase: phase }),
  setRepProgress: (repProgress) => set({ repProgress: Math.max(0, Math.min(1, repProgress)) }),
  setAnimationGLBPath: (path) => set({ animationGLBPath: path }),
}));
