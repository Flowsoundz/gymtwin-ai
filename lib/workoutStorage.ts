import {
  HISTORY_KEY,
  LAST_SUMMARY_KEY,
  STATS_KEY,
} from "@/lib/storageKeys";
import type { TraineeStats, WorkoutSummaryData } from "@/types";

export function readUserStats(): TraineeStats | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STATS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TraineeStats;
  } catch {
    window.localStorage.removeItem(STATS_KEY);
    return null;
  }
}

export function saveUserStats(stats: TraineeStats): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function readLastWorkoutSummary(): WorkoutSummaryData | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(LAST_SUMMARY_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WorkoutSummaryData;
  } catch {
    window.localStorage.removeItem(LAST_SUMMARY_KEY);
    return null;
  }
}

export function saveLastWorkoutSummary(summary: WorkoutSummaryData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SUMMARY_KEY, JSON.stringify(summary));
}

export function readWorkoutHistory(): WorkoutSummaryData[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as WorkoutSummaryData[];
  } catch {
    window.localStorage.removeItem(HISTORY_KEY);
    return [];
  }
}

export function saveWorkoutHistory(history: WorkoutSummaryData[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearWorkoutStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATS_KEY);
  window.localStorage.removeItem(LAST_SUMMARY_KEY);
  window.localStorage.removeItem(HISTORY_KEY);
}
