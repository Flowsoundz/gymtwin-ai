import { TWIN_BASELINE_KEY } from "@/lib/storageKeys";
import type { ActiveProgramState, TrainingProgram } from "@/lib/programs";
import type { WorkoutSummaryData } from "@/types";

// ─── Beat Your Twin ───────────────────────────────────────────────────────────
// The "twin" is your past self. The first workout of a program snapshots a
// pace baseline (reps per minute). During the program's FINAL week — Test
// Week — the player shows a live race against that baseline, and finishing
// stores the improvement delta for the completion celebration + share card.

export interface TwinBaseline {
  programId: string;
  capturedAt: string;
  totalReps: number;
  minutes: number;
  repsPerMin: number;
  /** Set when a final-week workout beats (or misses) the baseline. */
  lastDeltaPct?: number;
}

function ls(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readTwinBaseline(): TwinBaseline | null {
  try {
    const raw = ls()?.getItem(TWIN_BASELINE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TwinBaseline>;
    if (typeof parsed.programId !== "string" || typeof parsed.repsPerMin !== "number") return null;
    return parsed as TwinBaseline;
  } catch {
    return null;
  }
}

export function saveTwinBaseline(baseline: TwinBaseline): void {
  try { ls()?.setItem(TWIN_BASELINE_KEY, JSON.stringify(baseline)); } catch { /* ignore */ }
}

export function clearTwinBaseline(): void {
  try { ls()?.removeItem(TWIN_BASELINE_KEY); } catch { /* ignore */ }
}

export function isTestWeek(program: TrainingProgram, state: ActiveProgramState): boolean {
  return state.currentWeek >= program.weeks.length;
}

function paceOf(summary: WorkoutSummaryData): { reps: number; minutes: number; repsPerMin: number } | null {
  const reps = summary.estimatedReps ?? 0;
  const minutes = Math.max(1, summary.actualSessionMinutes ?? 0);
  if (reps <= 0) return null;
  return { reps, minutes, repsPerMin: reps / minutes };
}

/**
 * Call after every completed workout while a program is active.
 * Week 1: captures the baseline (first workout only).
 * Final week: computes the improvement delta vs. the baseline.
 * Returns the delta percentage when one was just computed, else null.
 */
export function recordTwinProgress(
  program: TrainingProgram,
  state: ActiveProgramState,
  summary: WorkoutSummaryData
): number | null {
  const pace = paceOf(summary);
  if (!pace) return null;

  const existing = readTwinBaseline();

  if (state.currentWeek === 1) {
    if (existing?.programId === program.id) return null; // first workout already captured
    saveTwinBaseline({
      programId: program.id,
      capturedAt: new Date().toISOString(),
      totalReps: pace.reps,
      minutes: pace.minutes,
      repsPerMin: pace.repsPerMin,
    });
    return null;
  }

  if (isTestWeek(program, state) && existing?.programId === program.id) {
    const deltaPct = Math.round(((pace.repsPerMin - existing.repsPerMin) / existing.repsPerMin) * 100);
    saveTwinBaseline({ ...existing, lastDeltaPct: deltaPct });
    return deltaPct;
  }

  return null;
}

/** Live race numbers for the workout player HUD. */
export interface TwinRaceHud {
  twinReps: number;
  yourReps: number;
  ahead: boolean;
}

export function getTwinRaceHud(
  baseline: TwinBaseline,
  elapsedMinutes: number,
  yourReps: number
): TwinRaceHud {
  const twinReps = Math.max(0, Math.round(baseline.repsPerMin * Math.max(elapsedMinutes, 0)));
  return { twinReps, yourReps, ahead: yourReps >= twinReps };
}
