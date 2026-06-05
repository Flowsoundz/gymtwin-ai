import type { Equipment, WorkoutGoal, WorkoutLevel } from "@/types";

// ─── Phase Union ──────────────────────────────────────────────────────────────
// "loaded warning" is a soft computed state, not a true transition — it sits
// between accumulation/intensification and a full deload trigger (AFI 13–17).

export type MacrocyclePhase =
  | "accumulation"
  | "intensification"
  | "realization"
  | "deload"
  | "loaded warning";

// ─── AFI Interpretation Band ──────────────────────────────────────────────────

export type AFIBand = "fresh" | "building" | "loaded" | "overloaded" | "critical";

// ─── Per-Session Fatigue Record ───────────────────────────────────────────────

export interface FatigueSnapshot {
  sessionId: string;
  completedAt: string;           // ISO date string (from completedAt on WorkoutSummaryData)
  difficultyScore: number;       // mapped: too_easy=-1, perfect=0, too_hard=+2
  energyScore: number;           // mapped: high=-1, moderate=0, low=+2
  sorenessScore: number;         // mapped: none=0, mild=+1, moderate=+2, severe=+4
  rawAFIContribution: number;    // difficultyScore + energyScore + sorenessScore (-2 to +8)
  weekNumber: number;            // 1-indexed position within the macrocycle block
  phase: MacrocyclePhase;        // phase that was active when this session occurred
}

// ─── Full Block State Machine ─────────────────────────────────────────────────

export interface Macrocycle {
  id: string;                            // "macrocycle-{timestamp}"
  startedAt: string;                     // ISO date of the first session in this block
  targetWeeks: number;                   // 4 (Beginner) | 5 (Intermediate) | 6 (Advanced)
  currentWeek: number;                   // 1-indexed, incremented every 7 days
  currentPhase: MacrocyclePhase;
  phaseHistory: MacrocyclePhase[];       // one entry pushed per completed week
  fatigueSnapshots: FatigueSnapshot[];   // all sessions in this block, chronological
  accumulatedFatigueIndex: number;       // recomputed with decay after every session
  deloadTriggeredAt: string | null;      // ISO date when deload was first triggered
  deloadReason: string | null;           // human-readable explanation
  deloadSkipped: boolean;               // true if user overrode the deload recommendation
  completedAt: string | null;            // set when the block finishes (after deload week)
  baselineVolume: number;                // 1.0 on first block, ±5% inherited from prior block
  previousBlockAFI: number | null;       // final AFI of the completed prior block
  goal: WorkoutGoal;
  level: WorkoutLevel;
  equipment: Equipment;
}

// ─── Deload Trigger Result ────────────────────────────────────────────────────

export type DeloadTriggerCategory =
  | "afi_threshold"
  | "emergency_override"
  | "calendar_scheduled";

export interface DeloadTriggerResult {
  shouldDeload: boolean;
  isNearingDeload: boolean;                // soft warning only — AFI 13–17
  reason: string | null;
  triggerCategory: DeloadTriggerCategory | null;
}

// ─── Phase-Level Modifiers ────────────────────────────────────────────────────

export interface MacrocyclePhaseModifiers {
  volumeModifier: number;
  repModifier: number;
  restModifier: number;
}

// ─── Compiled Final Modifiers (stacked with AdaptiveProfile) ─────────────────

export interface CompiledWorkoutModifiers {
  volumeModifier: number;
  repModifier: number;
  restModifier: number;
  isDeload: boolean;
  isNearingDeload: boolean;
  phase: MacrocyclePhase;
  weekNumber: number;
  afiBand: AFIBand;
}

// ─── Deload Exercise Constraints ─────────────────────────────────────────────

export interface DeloadPlanConstraints {
  maxSetsPerExercise: number;
  repReductionFactor: number;
  restExtensionFactor: number;
  maxMainBlockExercises: number;
  holdDurationExtensionSeconds: number;
  sessionLengthCapFactor: number;
}
