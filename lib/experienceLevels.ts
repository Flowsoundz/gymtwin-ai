import type { WorkoutSummaryData } from "@/types";

export type ExperienceLevelName =
  | "Rookie"
  | "Starter"
  | "Builder"
  | "Striker"
  | "Vanguard"
  | "Elite"
  | "Twin";

export type ExperienceLevel = {
  name: ExperienceLevelName;
  minXp: number;
};

export type ExperienceSnapshot = {
  currentLevel: ExperienceLevel;
  nextLevel: ExperienceLevel | null;
  totalXp: number;
  progressPercent: number;
  xpIntoLevel: number;
  xpSpan: number | null;
  xpToNextLevel: number;
};

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  { name: "Rookie", minXp: 0 },
  { name: "Starter", minXp: 150 },
  { name: "Builder", minXp: 375 },
  { name: "Striker", minXp: 700 },
  { name: "Vanguard", minXp: 1150 },
  { name: "Elite", minXp: 1700 },
  { name: "Twin", minXp: 2400 },
];

export function sumWorkoutXp(workoutHistory: WorkoutSummaryData[]): number {
  return workoutHistory.reduce((sum, workout) => {
    const xp = typeof workout.xpEarned === "number" && Number.isFinite(workout.xpEarned)
      ? workout.xpEarned
      : 0;
    return sum + xp;
  }, 0);
}

function clampXp(totalXp: number): number {
  if (!Number.isFinite(totalXp)) return 0;
  return Math.max(0, Math.round(totalXp));
}

export function getExperienceSnapshot(totalXp: number): ExperienceSnapshot {
  const safeXp = clampXp(totalXp);
  const currentIndex = EXPERIENCE_LEVELS.reduce((bestIndex, level, index) => (
    safeXp >= level.minXp ? index : bestIndex
  ), 0);
  const currentLevel = EXPERIENCE_LEVELS[currentIndex];
  const nextLevel = EXPERIENCE_LEVELS[currentIndex + 1] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      totalXp: safeXp,
      progressPercent: 100,
      xpIntoLevel: safeXp - currentLevel.minXp,
      xpSpan: null,
      xpToNextLevel: 0,
    };
  }

  const xpSpan = nextLevel.minXp - currentLevel.minXp;
  const xpIntoLevel = safeXp - currentLevel.minXp;

  return {
    currentLevel,
    nextLevel,
    totalXp: safeXp,
    progressPercent: Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpSpan) * 100))),
    xpIntoLevel,
    xpSpan,
    xpToNextLevel: Math.max(0, nextLevel.minXp - safeXp),
  };
}
