import { ACTIVE_PROGRAM_KEY } from "@/lib/storageKeys";
import { generateWeeklyPlan } from "@/lib/weeklyPlanEngine";
import type { Equipment, WeeklyPlan, WorkoutGoal, WorkoutLevel } from "@/types";

// ─── Program catalog ──────────────────────────────────────────────────────────
// Multi-week structured programs layered on top of the weekly plan engine.
// Each week reuses generateWeeklyPlan() for the split, then applies the week's
// theme: a session-length offset and (optionally) a goal override. Progression
// state lives in localStorage; the active week's plan IS the normal WeeklyPlan,
// so Today's Plan, day completion, and cloud sync all keep working unchanged.

export interface ProgramWeekTheme {
  theme: string;
  /** Minutes added to every non-rest session this week. */
  sessionOffset: number;
  /** Coach line shown when the week begins. */
  coachNote: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  tagline: string;
  weeks: ProgramWeekTheme[];
  goal: WorkoutGoal;
  recommendedLevel: WorkoutLevel;
  accent: "cyan" | "fuchsia" | "violet";
  emoji: string;
}

export const PROGRAMS: TrainingProgram[] = [
  {
    id: "foundation-4",
    name: "Foundation 4",
    tagline: "Four weeks to a rock-solid base",
    goal: "Tone",
    recommendedLevel: "Beginner",
    accent: "cyan",
    emoji: "🧱",
    weeks: [
      { theme: "Learn the patterns", sessionOffset: -5, coachNote: "Week 1 is about clean reps, not heavy effort. Own every movement." },
      { theme: "Build the habit", sessionOffset: 0, coachNote: "Week 2 — same movements, a little longer. Consistency beats intensity." },
      { theme: "Push the pace", sessionOffset: 5, coachNote: "Week 3 we turn it up. You know the patterns — now chase the burn." },
      { theme: "Prove it", sessionOffset: 5, coachNote: "Final week. Show yourself how far four weeks can take you." },
    ],
  },
  {
    id: "shred-30",
    name: "Shred 30",
    tagline: "A month of conditioning that compounds",
    goal: "Lose weight",
    recommendedLevel: "Intermediate",
    accent: "fuchsia",
    emoji: "🔥",
    weeks: [
      { theme: "Ignition", sessionOffset: 0, coachNote: "Week 1 lights the fuse. Finish every circuit — pace yourself, don't sprint." },
      { theme: "Burn", sessionOffset: 5, coachNote: "Week 2 adds minutes. Your engine is bigger than last week — use it." },
      { theme: "Peak burn", sessionOffset: 10, coachNote: "Week 3 is the hardest week of the program. Everything after this feels easier." },
      { theme: "Afterburn", sessionOffset: 5, coachNote: "Final week — slightly shorter, full intent. Finish strong and measure the difference." },
    ],
  },
  {
    id: "strong-6",
    name: "Strong 6",
    tagline: "Six weeks of progressive strength",
    goal: "Build muscle",
    recommendedLevel: "Intermediate",
    accent: "violet",
    emoji: "⚡",
    weeks: [
      { theme: "Base volume", sessionOffset: 0, coachNote: "Week 1 sets your baseline. Log everything — we build on these numbers." },
      { theme: "Volume up", sessionOffset: 5, coachNote: "Week 2 adds work. Same control, more total reps." },
      { theme: "Load up", sessionOffset: 5, coachNote: "Week 3 — if you have weights, go heavier; if not, slow the tempo down." },
      { theme: "Deload", sessionOffset: -10, coachNote: "Week 4 is a deload on purpose. Growth happens in recovery — keep moving, stay light." },
      { theme: "Overreach", sessionOffset: 10, coachNote: "Week 5 is the big push. Rested and ready — this is where strength jumps." },
      { theme: "Peak", sessionOffset: 5, coachNote: "Final week. Tie it together and beat week 1's numbers." },
    ],
  },
];

export function getProgram(id: string): TrainingProgram | null {
  return PROGRAMS.find((p) => p.id === id) ?? null;
}

// ─── Progression state ────────────────────────────────────────────────────────

export interface ActiveProgramState {
  programId: string;
  startedAt: string;
  /** 1-based current week. */
  currentWeek: number;
  completedWeeks: number;
}

function ls(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readActiveProgram(): ActiveProgramState | null {
  try {
    const raw = ls()?.getItem(ACTIVE_PROGRAM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveProgramState>;
    if (typeof parsed.programId !== "string" || typeof parsed.currentWeek !== "number") return null;
    if (!getProgram(parsed.programId)) return null;
    return {
      programId: parsed.programId,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : new Date().toISOString(),
      currentWeek: Math.max(1, Math.round(parsed.currentWeek)),
      completedWeeks: typeof parsed.completedWeeks === "number" ? parsed.completedWeeks : 0,
    };
  } catch {
    return null;
  }
}

export function saveActiveProgram(state: ActiveProgramState): void {
  try { ls()?.setItem(ACTIVE_PROGRAM_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function clearActiveProgram(): void {
  try { ls()?.removeItem(ACTIVE_PROGRAM_KEY); } catch { /* ignore */ }
}

// ─── Plan generation ──────────────────────────────────────────────────────────

export function generateProgramWeekPlan(
  program: TrainingProgram,
  week: number,
  level: WorkoutLevel,
  equipment: Equipment
): WeeklyPlan {
  const themeIndex = Math.min(Math.max(week - 1, 0), program.weeks.length - 1);
  const weekTheme = program.weeks[themeIndex];
  const base = generateWeeklyPlan(program.goal, level, equipment);

  const days = base.days.map((day) => {
    if (day.isRestDay || !day.workoutConfig) return day;
    const minutes = Math.max(10, day.durationMinutes + weekTheme.sessionOffset);
    return {
      ...day,
      durationMinutes: minutes,
      workoutConfig: { ...day.workoutConfig, sessionLength: String(minutes) },
    };
  });

  return {
    ...base,
    id: `${program.id}-w${week}-${Date.now()}`,
    days,
    splitName: `${program.name} · Week ${week} — ${weekTheme.theme}`,
    isDeloadWeek: /deload/i.test(weekTheme.theme),
  };
}

/** A program week counts as complete when every training day is done. */
export function isProgramWeekComplete(plan: WeeklyPlan | null | undefined): boolean {
  if (!plan) return false;
  const trainingDays = plan.days.filter((d) => !d.isRestDay);
  return trainingDays.length > 0 && trainingDays.every((d) => d.completed);
}
