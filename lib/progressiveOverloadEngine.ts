import { EXERCISE_LOG_KEY, EXERCISE_PR_KEY } from "@/lib/storageKeys";
import type { ExerciseLogEntry, ExercisePR } from "@/types";

// Max entries kept — prunes oldest when exceeded
const MAX_LOG_ENTRIES = 600;

// ─── IndexedDB async persistence (non-blocking during camera tracking) ────────
// Writes go to IndexedDB asynchronously; reads stay synchronous from localStorage
// for backward-compat until a future init-from-IDB migration is added.

async function idbSet(key: string, value: unknown): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { set } = await import("idb-keyval");
    await set(key, value);
  } catch {
    // IDB unavailable — fall through, localStorage write already done
  }
}

async function idbDel(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { del } = await import("idb-keyval");
    await del(key);
  } catch { /* ignore */ }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function readExerciseLog(): ExerciseLogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(EXERCISE_LOG_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ExerciseLogEntry[]; }
  catch { window.localStorage.removeItem(EXERCISE_LOG_KEY); return []; }
}

function saveExerciseLog(entries: ExerciseLogEntry[]): void {
  if (typeof window === "undefined") return;
  const pruned = entries.length > MAX_LOG_ENTRIES
    ? entries.slice(entries.length - MAX_LOG_ENTRIES)
    : entries;
  // Sync write to localStorage keeps reads fast; async write to IDB for capacity
  window.localStorage.setItem(EXERCISE_LOG_KEY, JSON.stringify(pruned));
  void idbSet(EXERCISE_LOG_KEY, pruned);
}

export function readExercisePRs(): Record<string, ExercisePR> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(EXERCISE_PR_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, ExercisePR>; }
  catch { window.localStorage.removeItem(EXERCISE_PR_KEY); return {}; }
}

function saveExercisePRs(prs: Record<string, ExercisePR>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXERCISE_PR_KEY, JSON.stringify(prs));
  void idbSet(EXERCISE_PR_KEY, prs);
}

export function clearExerciseLog(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EXERCISE_LOG_KEY);
  window.localStorage.removeItem(EXERCISE_PR_KEY);
  void idbDel(EXERCISE_LOG_KEY);
  void idbDel(EXERCISE_PR_KEY);
}

// ─── Epley 1RM Formula ────────────────────────────────────────────────────────
// Only meaningful when weight > 0 and reps > 1.
// Returns null for bodyweight-only sets (weightLbs = null or 0) or single-rep maxes.

export function computeEpley1RM(weightLbs: number, reps: number): number | null {
  if (weightLbs <= 0 || reps <= 1) return null;
  return Math.round(weightLbs * (1 + reps / 30));
}

// ─── Name Normalization ───────────────────────────────────────────────────────
// Strips instance suffixes added by the workout engine (e.g. "-instance-2")
// and lowercases for consistent keying.

function normalizeExerciseName(name: string): string {
  return name.replace(/-instance-\d+$/i, "").trim().toLowerCase();
}

// ─── PR Detection ─────────────────────────────────────────────────────────────

type PRType = "weight" | "reps" | "estimated_1rm" | null;

function checkAndUpdatePR(
  entry: ExerciseLogEntry,
  existingPR: ExercisePR | undefined
): { isPR: boolean; prType: PRType; updatedPR: ExercisePR } {
  const base: ExercisePR = existingPR ?? {
    exerciseName: entry.exerciseName,
    bestReps: 0,
    bestWeightLbs: null,
    bestEstimated1RM: null,
    achievedAt: entry.completedAt,
  };

  let isPR = false;
  let prType: PRType = null;
  let { bestReps, bestWeightLbs, bestEstimated1RM, achievedAt } = base;

  // Weight PR
  if (entry.weightLbs !== null && entry.weightLbs > 0) {
    if (bestWeightLbs === null || entry.weightLbs > bestWeightLbs) {
      bestWeightLbs = entry.weightLbs;
      isPR = true;
      prType = "weight";
      achievedAt = entry.completedAt;
    }
  }

  // Reps PR (at same or heavier weight — avoid rewarding drop-sets)
  if (entry.repsCompleted > bestReps) {
    const weightOk =
      entry.weightLbs === null ||          // bodyweight always counts
      bestWeightLbs === null ||            // no prior weight
      entry.weightLbs >= bestWeightLbs;    // same or heavier
    if (weightOk) {
      bestReps = entry.repsCompleted;
      if (!isPR) { isPR = true; prType = "reps"; achievedAt = entry.completedAt; }
    }
  }

  // Estimated 1RM PR
  if (entry.estimatedOneRepMax !== null) {
    if (bestEstimated1RM === null || entry.estimatedOneRepMax > bestEstimated1RM) {
      bestEstimated1RM = entry.estimatedOneRepMax;
      if (!isPR) { isPR = true; prType = "estimated_1rm"; achievedAt = entry.completedAt; }
    }
  }

  return {
    isPR,
    prType,
    updatedPR: { ...base, bestReps, bestWeightLbs, bestEstimated1RM, achievedAt },
  };
}

// ─── Append Set ───────────────────────────────────────────────────────────────
// Main write path called from the player when the user logs a completed set.
// Returns whether a new PR was achieved so the UI can celebrate.

export function appendSetLog(
  entry: Omit<ExerciseLogEntry, "id" | "estimatedOneRepMax">
): { isPR: boolean; prType: PRType; prLabel: string | null } {
  const estimated1RM =
    entry.weightLbs !== null
      ? computeEpley1RM(entry.weightLbs, entry.repsCompleted)
      : null;

  const fullEntry: ExerciseLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    estimatedOneRepMax: estimated1RM,
  };

  const entries = readExerciseLog();
  entries.push(fullEntry);
  saveExerciseLog(entries);

  const prs = readExercisePRs();
  const key = normalizeExerciseName(entry.exerciseName);
  const { isPR, prType, updatedPR } = checkAndUpdatePR(fullEntry, prs[key]);

  if (isPR) {
    prs[key] = updatedPR;
    saveExercisePRs(prs);
  }

  const prLabel = isPR
    ? prType === "weight" && entry.weightLbs
      ? `New Weight PR — ${entry.weightLbs} lbs`
      : prType === "estimated_1rm" && estimated1RM
        ? `New 1RM PR — ~${estimated1RM} lbs`
        : `New Rep PR — ${entry.repsCompleted} reps`
    : null;

  return { isPR, prType, prLabel };
}

// ─── Read Helpers ─────────────────────────────────────────────────────────────

export function getExerciseHistory(exerciseName: string, limit = 20): ExerciseLogEntry[] {
  const key = normalizeExerciseName(exerciseName);
  return readExerciseLog()
    .filter((e) => normalizeExerciseName(e.exerciseName) === key)
    .slice(-limit);
}

export function getLastLoggedWeight(exerciseName: string): number | null {
  const history = getExerciseHistory(exerciseName, 10);
  const withWeight = history.filter((e) => e.weightLbs !== null && e.weightLbs > 0);
  return withWeight.length > 0 ? withWeight[withWeight.length - 1].weightLbs! : null;
}

export function getExercisePR(exerciseName: string): ExercisePR | null {
  const prs = readExercisePRs();
  return prs[normalizeExerciseName(exerciseName)] ?? null;
}

export type ExerciseSummary = {
  name: string;
  count: number;
  pr: ExercisePR | null;
  lastEntry: ExerciseLogEntry | null;
};

export function getTopLoggedExercises(limit = 12): ExerciseSummary[] {
  const entries = readExerciseLog();
  const prs = readExercisePRs();

  const countMap = new Map<string, { count: number; displayName: string; lastEntry: ExerciseLogEntry }>();
  for (const entry of entries) {
    const key = normalizeExerciseName(entry.exerciseName);
    const existing = countMap.get(key);
    if (!existing || entry.completedAt > existing.lastEntry.completedAt) {
      countMap.set(key, {
        count: (existing?.count ?? 0) + 1,
        displayName: entry.exerciseName,
        lastEntry: entry,
      });
    } else {
      countMap.set(key, { ...existing, count: existing.count + 1 });
    }
  }

  return [...countMap.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([key, { count, displayName, lastEntry }]) => ({
      name: displayName,
      count,
      pr: prs[key] ?? null,
      lastEntry,
    }));
}

// ─── Progression Suggestion ───────────────────────────────────────────────────
// Generates a short actionable next-session cue based on the last 3 entries
// for this exercise.

export function getProgressionSuggestion(exerciseName: string): string {
  const history = getExerciseHistory(exerciseName, 3);
  if (history.length === 0) return "First session — establish your baseline today.";

  const last = history[history.length - 1];
  const pr = getExercisePR(exerciseName);

  // Bodyweight: rep-based progression
  if (last.weightLbs === null || last.weightLbs === 0) {
    const trend = history.every((e) => e.repsCompleted === last.repsCompleted);
    return trend
      ? `Target ${last.repsCompleted + 2} reps next session.`
      : `Aim to match or beat ${last.repsCompleted} reps.`;
  }

  // Weighted: suggest small weight increase if at or above PR reps
  if (pr?.bestReps !== undefined && last.repsCompleted >= pr.bestReps) {
    const nextWeight = Math.round((last.weightLbs + 2.5) / 2.5) * 2.5;
    return `Try ${nextWeight} lbs next session — you've hit the top of your rep range.`;
  }

  return `Hit ${pr?.bestReps ?? last.repsCompleted + 2} clean reps before increasing weight.`;
}
