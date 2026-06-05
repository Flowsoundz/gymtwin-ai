import { ADAPTIVE_PROFILE_KEY } from "@/lib/storageKeys";
import type {
  AdaptiveProfile,
  DifficultyFeedback,
  EnergyRating,
  Equipment,
  PostWorkoutFeedback,
  SorenessRating,
  WorkoutAdjustments,
  WorkoutGoal,
  WorkoutLevel,
} from "@/types";
import type {
  AFIBand,
  CompiledWorkoutModifiers,
  DeloadPlanConstraints,
  DeloadTriggerResult,
  FatigueSnapshot,
  Macrocycle,
  MacrocyclePhase,
  MacrocyclePhaseModifiers,
} from "@/types/macrocycle";

// ─── Storage Key ──────────────────────────────────────────────────────────────

export const MACROCYCLE_KEY = "gymtwin_macrocycle";

// ─── Constants ────────────────────────────────────────────────────────────────

const AFI_DECAY_FACTOR = 0.85;

// AFI band thresholds — used in multiple places so defined once
const AFI_BANDS = {
  FRESH_MAX: 6,
  BUILDING_MAX: 12,
  LOADED_MAX: 17,
  OVERLOADED_MAX: 22,
  // >= 23 → CRITICAL
} as const;

// Per-phase volume / rep / rest multipliers. Applied first before AdaptiveProfile
// micro-adjustments stack on top multiplicatively.
const PHASE_MODIFIERS: Record<MacrocyclePhase, MacrocyclePhaseModifiers> = {
  accumulation:     { volumeModifier: 1.00, repModifier: 1.00, restModifier: 1.00 },
  intensification:  { volumeModifier: 1.15, repModifier: 1.10, restModifier: 0.95 },
  realization:      { volumeModifier: 1.25, repModifier: 1.15, restModifier: 0.90 },
  deload:           { volumeModifier: 0.55, repModifier: 0.90, restModifier: 1.35 },
  "loaded warning": { volumeModifier: 0.90, repModifier: 1.00, restModifier: 1.10 },
};

// Deload week exercise parameter constraints under Nova's coaching persona
const DELOAD_CONSTRAINTS: DeloadPlanConstraints = {
  maxSetsPerExercise: 2,
  repReductionFactor: 0.90,           // reduce reps 10%, floor at 3
  restExtensionFactor: 1.35,          // extend rest 35%
  maxMainBlockExercises: 4,
  holdDurationExtensionSeconds: 10,   // holds become restorative — add 10s
  sessionLengthCapFactor: 0.65,       // cap session at 65% of normal length
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── A. Fatigue Scoring ───────────────────────────────────────────────────────

export function mapDifficultyToScore(feedback: DifficultyFeedback): number {
  switch (feedback) {
    case "too_easy": return -1;
    case "perfect":  return  0;
    case "too_hard": return  2;
    default:         return  0; // null → neutral
  }
}

export function mapEnergyToScore(rating: EnergyRating | undefined): number {
  switch (rating) {
    case "high":     return -1;
    case "moderate": return  0;
    case "low":      return  2;
    default:         return  0;
  }
}

export function mapSorenessToScore(rating: SorenessRating | undefined): number {
  switch (rating) {
    case "none":     return 0;
    case "mild":     return 1;
    case "moderate": return 2;
    case "severe":   return 4; // double weight — acute injury risk signal
    default:         return 0;
  }
}

// Exponentially decayed sum across all snapshots in the current block.
//
// sessionsAgo = 0 for the most recent snapshot (full weight = 0.85^0 = 1.0).
// Older sessions contribute less as the decay compounds backward.
//
//   AFI = Σ (rawAFIContribution[i] × 0.85^sessionsAgo)
//
// Snapshots are stored chronologically (oldest index 0). For a block of n
// sessions, index i has sessionsAgo = (n - 1) - i.

export function computeAFI(snapshots: FatigueSnapshot[]): number {
  if (snapshots.length === 0) return 0;

  const n = snapshots.length;

  const weighted = snapshots.reduce((sum, snapshot, index) => {
    const sessionsAgo = n - 1 - index;
    const decayWeight = Math.pow(AFI_DECAY_FACTOR, sessionsAgo);
    return sum + snapshot.rawAFIContribution * decayWeight;
  }, 0);

  // Round to 2 decimal places to avoid floating-point noise in comparisons
  return Math.round(weighted * 100) / 100;
}

export function getAFIBand(afi: number): AFIBand {
  if (afi <= AFI_BANDS.FRESH_MAX)    return "fresh";
  if (afi <= AFI_BANDS.BUILDING_MAX) return "building";
  if (afi <= AFI_BANDS.LOADED_MAX)   return "loaded";
  if (afi <= AFI_BANDS.OVERLOADED_MAX) return "overloaded";
  return "critical";
}

// ─── B. Deload Trigger Logic ──────────────────────────────────────────────────

// Evaluates three cascading trigger categories in priority order:
//   1. AFI threshold — chronic overload signal
//   2. Emergency override — acute distress signal
//   3. Calendar scheduled — block completion rule
// Returns a soft warning when AFI is elevated but not yet critical.

export function checkDeloadTriggers(
  macrocycle: Macrocycle,
  adaptiveProfile: AdaptiveProfile
): DeloadTriggerResult {
  const { accumulatedFatigueIndex: afi, currentPhase, currentWeek, targetWeeks, fatigueSnapshots, level } = macrocycle;

  // ── Priority 1: AFI Threshold ──────────────────────────────────────────────

  if (afi >= 23) {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: "Critical fatigue accumulated across the training block.",
      triggerCategory: "afi_threshold",
    };
  }

  // High-intensity phases amplify injury risk — lower the deload threshold
  const isIntensivePhase = currentPhase === "intensification" || currentPhase === "realization";
  if (afi >= 18 && isIntensivePhase) {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: "High fatigue detected during an intensive phase — deload protects adaptation gains.",
      triggerCategory: "afi_threshold",
    };
  }

  // ── Priority 2: Emergency Overrides ───────────────────────────────────────

  if (adaptiveProfile.consecutiveTooHardSessions >= 3) {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: "Three consecutive sessions rated too hard — auto-deload to prevent overtraining.",
      triggerCategory: "emergency_override",
    };
  }

  // Persistent high soreness across the last 3 sessions regardless of difficulty rating
  const recentThree = fatigueSnapshots.slice(-3);
  const persistentSoreness =
    recentThree.length === 3 && recentThree.every((s) => s.sorenessScore >= 2);
  if (persistentSoreness) {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: "Persistent elevated soreness across 3 consecutive sessions — deload to flush accumulated stress.",
      triggerCategory: "emergency_override",
    };
  }

  // ── Priority 3: Calendar Scheduled ────────────────────────────────────────

  // Deload is always the final week of the block
  if (currentWeek >= targetWeeks) {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: `Training block completed — scheduled deload before the next macrocycle.`,
      triggerCategory: "calendar_scheduled",
    };
  }

  // Advanced athletes follow a strict week-4 deload regardless of block length,
  // since their training density causes fatigue to compound faster
  if (level === "Advanced" && currentWeek >= 4 && currentPhase !== "deload") {
    return {
      shouldDeload: true,
      isNearingDeload: false,
      reason: "Week 4 scheduled deload — standard periodization rule for advanced athletes.",
      triggerCategory: "calendar_scheduled",
    };
  }

  // ── Soft Warning: AFI in LOADED band (13–17) ──────────────────────────────

  if (afi >= AFI_BANDS.BUILDING_MAX + 1 && afi <= AFI_BANDS.LOADED_MAX) {
    return {
      shouldDeload: false,
      isNearingDeload: true,
      reason: "Elevated fatigue is building — approaching deload threshold.",
      triggerCategory: null,
    };
  }

  return {
    shouldDeload: false,
    isNearingDeload: false,
    reason: null,
    triggerCategory: null,
  };
}

// ─── C. Multiplicative Modifier Compilation ───────────────────────────────────

// Stacking order (outer to inner):
//   baselineVolume × phaseModifier × adaptiveProfileModifier
//
// The macrocycle sets the block-level and phase-level multipliers.
// The AdaptiveProfile handles session-level micro-adjustments on top.
// All other fields from WorkoutAdjustments (excluded groups, notes, etc.) are
// preserved — only the numeric modifiers are affected.

export function compileFinalModifiers(
  macrocycle: Macrocycle,
  adaptiveAdjustments: WorkoutAdjustments
): WorkoutAdjustments {
  const phase = PHASE_MODIFIERS[macrocycle.currentPhase];
  const isDeload = macrocycle.currentPhase === "deload";

  const rawVolume =
    macrocycle.baselineVolume *
    phase.volumeModifier *
    adaptiveAdjustments.volumeModifier;

  const rawRep = phase.repModifier * adaptiveAdjustments.repModifier;
  const rawRest = phase.restModifier * adaptiveAdjustments.restModifier;

  const intensityNote = isDeload
    ? `Deload week active. ${adaptiveAdjustments.intensityNote}`
    : macrocycle.currentPhase === "loaded warning"
      ? `Elevated fatigue — volume pulled back. ${adaptiveAdjustments.intensityNote}`
      : macrocycle.currentPhase === "intensification"
        ? `Week ${macrocycle.currentWeek} intensification block. ${adaptiveAdjustments.intensityNote}`
        : adaptiveAdjustments.intensityNote;

  return {
    ...adaptiveAdjustments,
    volumeModifier: clamp(rawVolume, 0.40, 1.50),
    repModifier:    clamp(rawRep, 0.50, 1.50),
    restModifier:   clamp(rawRest, 0.60, 1.60),
    isRecoverySession: isDeload || adaptiveAdjustments.isRecoverySession,
    intensityNote,
  };
}

// Read-only helper used by display components that need phase metadata
export function getMacrocycleModifiers(macrocycle: Macrocycle): CompiledWorkoutModifiers {
  const afi = macrocycle.accumulatedFatigueIndex;
  const isDeload = macrocycle.currentPhase === "deload";
  const isNearingDeload = macrocycle.currentPhase === "loaded warning";
  const phase = PHASE_MODIFIERS[macrocycle.currentPhase];

  return {
    volumeModifier: clamp(macrocycle.baselineVolume * phase.volumeModifier, 0.40, 1.50),
    repModifier:    clamp(phase.repModifier, 0.50, 1.50),
    restModifier:   clamp(phase.restModifier, 0.60, 1.60),
    isDeload,
    isNearingDeload,
    phase: macrocycle.currentPhase,
    weekNumber: macrocycle.currentWeek,
    afiBand: getAFIBand(afi),
  };
}

// ─── D. Deload Parameter Mutations ───────────────────────────────────────────

export interface DeloadExerciseParams {
  sets: number;
  reps?: number;
  duration?: number;   // seconds
  rest: number;        // seconds
}

// Applies hard caps to exercise parameters during a deload week.
// Caller is responsible for also limiting mainBlock exercise count to
// DELOAD_CONSTRAINTS.maxMainBlockExercises.

export function applyDeloadConstraints(params: DeloadExerciseParams): DeloadExerciseParams {
  const { maxSetsPerExercise, repReductionFactor, restExtensionFactor, holdDurationExtensionSeconds } =
    DELOAD_CONSTRAINTS;

  return {
    sets: Math.min(params.sets, maxSetsPerExercise),
    reps: params.reps !== undefined
      ? Math.max(3, Math.floor(params.reps * repReductionFactor))
      : undefined,
    duration: params.duration !== undefined
      ? params.duration + holdDurationExtensionSeconds
      : undefined,
    rest: Math.round(params.rest * restExtensionFactor),
  };
}

export function getDeloadConstraints(): Readonly<DeloadPlanConstraints> {
  return DELOAD_CONSTRAINTS;
}

// ─── D. Nova Deload Coach Note Generator ─────────────────────────────────────

// Nova's voice: focused, form-first, calm precision — not apologetic, not hype.
// Frames the deload as tactical, references the work already done, and
// future-paces the next block based on how well the current block was handled.

export function generateNovaDeloadNote(macrocycle: Macrocycle): string {
  const weeksCompleted = Math.max(0, macrocycle.currentWeek - 1);
  const weekLabel = weeksCompleted === 1 ? "1 week" : `${weeksCompleted} weeks`;
  const afiBand = getAFIBand(macrocycle.accumulatedFatigueIndex);
  const isEmergency = macrocycle.deloadReason?.includes("consecutive") ||
                      macrocycle.deloadReason?.includes("soreness");

  // Tailor the forward-looking sentence based on how the block ended
  const nextBlockProjection = (() => {
    if (afiBand === "fresh" || afiBand === "building") {
      return "Your next block opens with 5% more volume — the adaptation from this block is locked in.";
    }
    if (afiBand === "loaded") {
      return "Your next block holds at the same intensity level. Consistency compounds over time.";
    }
    // overloaded or critical
    return "Your next block resets slightly lighter to rebuild from a cleaner baseline. That is the correct call.";
  })();

  const openingLine = isEmergency
    ? `The data said stop pushing — so we pivot, not retreat.`
    : `${weekLabel} of structured work is complete.`;

  return (
    `${openingLine} ` +
    `This week we do not back off — we shift the target. ` +
    `Every rep should be deliberate: slower descent, full range, zero momentum. ` +
    `Your tendons, fascia, and nervous system are consolidating the gains right now. ` +
    `Muscle adapts fast. Connective tissue adapts slowly. Give it the week it needs. ` +
    `${nextBlockProjection}`
  );
}

export function getNovaDeloadProgressionIntent(macrocycle: Macrocycle): string {
  const nextBaselineVolume = computeNextBaselineVolume(macrocycle);
  const changeLabel =
    nextBaselineVolume > macrocycle.baselineVolume
      ? "5% higher baseline"
      : nextBaselineVolume < macrocycle.baselineVolume
        ? "slightly lighter baseline"
        : "same baseline";

  return (
    `This deload completes Macrocycle Block ${macrocycle.id.replace("macrocycle-", "").slice(-4)}. ` +
    `A new training block starts next week with a ${changeLabel}. ` +
    `Sleep more than usual this week — recovery happens off the mat.`
  );
}

// ─── E. Phase Derivation ──────────────────────────────────────────────────────

// Returns the canonical phase for a given week number, level, and block length.
// "loaded warning" is NOT derived here — it is set in recordSessionFeedback
// based on AFI, overriding this value when AFI enters the 13–17 band.

function derivePhaseForWeek(
  weekNumber: number,
  level: WorkoutLevel,
  targetWeeks: number
): MacrocyclePhase {
  // The final week is always the scheduled deload
  if (weekNumber >= targetWeeks) return "deload";

  if (level === "Advanced") {
    if (weekNumber <= 2) return "accumulation";
    if (weekNumber <= 4) return "intensification";
    return "realization"; // week 5 in a 6-week block
  }

  if (level === "Intermediate") {
    if (weekNumber <= 2) return "accumulation";
    return "intensification"; // weeks 3–4
  }

  // Beginner — 4-week block
  if (weekNumber <= 2) return "accumulation";
  return "intensification"; // week 3
}

// ─── E. Week & Phase Advancement ─────────────────────────────────────────────

// Should be called by the app when 7 days have elapsed since the start of the
// current week. Pure function — does not write to storage.

export function advanceMacrocycleWeek(macrocycle: Macrocycle): Macrocycle {
  const nextWeek = macrocycle.currentWeek + 1;
  const nextPhase = derivePhaseForWeek(nextWeek, macrocycle.level, macrocycle.targetWeeks);

  return {
    ...macrocycle,
    currentWeek: nextWeek,
    currentPhase: nextPhase,
    phaseHistory: [...macrocycle.phaseHistory, macrocycle.currentPhase],
  };
}

// Returns true when 7 or more days have elapsed since the current week started.
// Callers should check this on app load and call advanceMacrocycleWeek if true.

export function shouldAdvanceWeek(macrocycle: Macrocycle): boolean {
  const weekStartDate = new Date(macrocycle.startedAt);
  weekStartDate.setDate(weekStartDate.getDate() + (macrocycle.currentWeek - 1) * 7);
  const daysSinceWeekStart = Math.floor(
    (Date.now() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceWeekStart >= 7;
}

// ─── E. Session Feedback Recording ───────────────────────────────────────────

// Appends a FatigueSnapshot, recomputes AFI, and re-evaluates the phase
// (to handle "loaded warning" transitions cleanly without needing a separate call).

export function recordSessionFeedback(
  macrocycle: Macrocycle,
  sessionId: string,
  feedback: PostWorkoutFeedback
): Macrocycle {
  const difficultyScore = mapDifficultyToScore(feedback.difficultyFeedback);
  const energyScore     = mapEnergyToScore(feedback.energyRating);
  const sorenessScore   = mapSorenessToScore(feedback.sorenessRating);
  const rawAFIContribution = difficultyScore + energyScore + sorenessScore;

  const snapshot: FatigueSnapshot = {
    sessionId,
    completedAt: new Date().toISOString(),
    difficultyScore,
    energyScore,
    sorenessScore,
    rawAFIContribution,
    weekNumber: macrocycle.currentWeek,
    phase: macrocycle.currentPhase,
  };

  const updatedSnapshots = [...macrocycle.fatigueSnapshots, snapshot];
  const newAFI = computeAFI(updatedSnapshots);

  // Re-evaluate whether the "loaded warning" soft state should apply.
  // Never override an active deload phase — only toggle between normal and warning.
  const currentPhase: MacrocyclePhase = (() => {
    if (macrocycle.currentPhase === "deload") return "deload";

    const basePhase = derivePhaseForWeek(
      macrocycle.currentWeek,
      macrocycle.level,
      macrocycle.targetWeeks
    );

    const band = getAFIBand(newAFI);
    if (band === "loaded") return "loaded warning";
    return basePhase;
  })();

  return {
    ...macrocycle,
    currentPhase,
    fatigueSnapshots: updatedSnapshots,
    accumulatedFatigueIndex: newAFI,
  };
}

// ─── E. Baseline Volume Inheritance ──────────────────────────────────────────

// The next block's starting volume is derived from how fatigued the body was
// at the completion of this block. The intent: reward athletes who handled the
// block cleanly with a small step-up; protect athletes who overtrained with
// a small step-down so the next block begins from a cleaner position.

export function computeNextBaselineVolume(completedMacrocycle: Macrocycle): number {
  const finalAFI = completedMacrocycle.accumulatedFatigueIndex;
  const current = completedMacrocycle.baselineVolume;
  const band = getAFIBand(finalAFI);

  switch (band) {
    case "fresh":
    case "building":
      // Body handled the load well — safe to step up 5%
      return clamp(current * 1.05, 0.70, 1.35);
    case "loaded":
      // Body was stressed but managed — hold steady
      return current;
    case "overloaded":
    case "critical":
      // Chronic overload — reduce 5% to start the next block from a cleaner base
      return clamp(current * 0.95, 0.70, 1.35);
  }
}

// ─── Macrocycle Lifecycle ─────────────────────────────────────────────────────

export function initNewMacrocycle(
  goal: WorkoutGoal,
  level: WorkoutLevel,
  equipment: Equipment,
  prevMacrocycle?: Macrocycle | null
): Macrocycle {
  const targetWeeks: number =
    level === "Advanced" ? 6 :
    level === "Intermediate" ? 5 :
    4;

  const baselineVolume = prevMacrocycle
    ? computeNextBaselineVolume(prevMacrocycle)
    : 1.0;

  return {
    id: `macrocycle-${Date.now()}`,
    startedAt: new Date().toISOString(),
    targetWeeks,
    currentWeek: 1,
    currentPhase: "accumulation",
    phaseHistory: [],
    fatigueSnapshots: [],
    accumulatedFatigueIndex: 0,
    deloadTriggeredAt: null,
    deloadReason: null,
    deloadSkipped: false,
    completedAt: null,
    baselineVolume,
    previousBlockAFI: prevMacrocycle?.accumulatedFatigueIndex ?? null,
    goal,
    level,
    equipment,
  };
}

// Stamps a deload onto the macrocycle state. Call this when checkDeloadTriggers
// returns shouldDeload: true and the user has not opted to skip.

export function applyDeloadTrigger(
  macrocycle: Macrocycle,
  reason: string
): Macrocycle {
  return {
    ...macrocycle,
    currentPhase: "deload",
    deloadTriggeredAt: new Date().toISOString(),
    deloadReason: reason,
  };
}

// Marks the current block as completed and returns it (for archival).
// After calling this, create the next block with initNewMacrocycle(prevMacrocycle).

export function completeMacrocycle(macrocycle: Macrocycle): Macrocycle {
  return {
    ...macrocycle,
    completedAt: new Date().toISOString(),
  };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function getPhaseLabel(phase: MacrocyclePhase): string {
  const labels: Record<MacrocyclePhase, string> = {
    accumulation:     "Base",
    intensification:  "Push",
    realization:      "Peak",
    deload:           "Deload",
    "loaded warning": "Heavy",
  };
  return labels[phase];
}

export function getPhaseBadgeColor(phase: MacrocyclePhase): string {
  switch (phase) {
    case "accumulation":     return "border-blue-900/50 bg-blue-950/40 text-blue-300";
    case "intensification":  return "border-purple-900/50 bg-purple-950/40 text-purple-300";
    case "realization":      return "border-orange-900/50 bg-orange-950/40 text-orange-300";
    case "deload":           return "border-teal-900/50 bg-teal-950/40 text-teal-300";
    case "loaded warning":   return "border-yellow-900/50 bg-yellow-950/40 text-yellow-300";
  }
}

export type MacrocycleArcWeek = {
  week: number;
  phase: MacrocyclePhase;
  status: "completed" | "current" | "upcoming";
  afiBand: AFIBand | null;  // only set for completed weeks
};

export function getMacrocycleArc(macrocycle: Macrocycle): MacrocycleArcWeek[] {
  return Array.from({ length: macrocycle.targetWeeks }, (_, i) => {
    const week = i + 1;
    const phase = (() => {
      if (week >= macrocycle.targetWeeks) return "deload" as MacrocyclePhase;
      const { level, targetWeeks } = macrocycle;
      if (level === "Advanced") {
        if (week <= 2) return "accumulation" as MacrocyclePhase;
        if (week <= 4) return "intensification" as MacrocyclePhase;
        return "realization" as MacrocyclePhase;
      }
      if (level === "Intermediate") {
        return week <= 2 ? "accumulation" as MacrocyclePhase : "intensification" as MacrocyclePhase;
      }
      return week <= 2 ? "accumulation" as MacrocyclePhase : "intensification" as MacrocyclePhase;
    })();

    const snapshotsForWeek = macrocycle.fatigueSnapshots.filter((s) => s.weekNumber === week);
    const weekAFI = snapshotsForWeek.reduce((sum, s) => sum + s.rawAFIContribution, 0);

    return {
      week,
      phase,
      status:
        week < macrocycle.currentWeek ? "completed"
        : week === macrocycle.currentWeek ? "current"
        : "upcoming",
      afiBand: week < macrocycle.currentWeek ? getAFIBand(weekAFI) : null,
    };
  });
}

// ─── localStorage Persistence ─────────────────────────────────────────────────

export function readMacrocycle(): Macrocycle | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(MACROCYCLE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Macrocycle;
  } catch {
    window.localStorage.removeItem(MACROCYCLE_KEY);
    return null;
  }
}

export function saveMacrocycle(macrocycle: Macrocycle): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MACROCYCLE_KEY, JSON.stringify(macrocycle));
}

export function clearMacrocycle(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MACROCYCLE_KEY);
}

// ─── Integration Helpers ──────────────────────────────────────────────────────

// Convenience function that covers the full post-session update sequence:
//   1. Records feedback snapshot
//   2. Checks deload triggers
//   3. Applies deload state if triggered (unless user skipped)
//   4. Saves to localStorage
//   5. Returns the updated macrocycle + trigger result for UI surfacing
//
// Call this inside submitAdaptiveFeedback() in page.tsx after updateAdaptiveProfile().

export function processMacrocyclePostSession(
  macrocycle: Macrocycle,
  adaptiveProfile: AdaptiveProfile,
  sessionId: string,
  feedback: PostWorkoutFeedback,
  userSkippedDeload = false
): { macrocycle: Macrocycle; triggerResult: DeloadTriggerResult } {
  let updated = recordSessionFeedback(macrocycle, sessionId, feedback);

  const triggerResult = checkDeloadTriggers(updated, adaptiveProfile);

  if (triggerResult.shouldDeload && !userSkippedDeload && updated.currentPhase !== "deload") {
    updated = applyDeloadTrigger(updated, triggerResult.reason ?? "Deload triggered.");
  }

  // Advance week if calendar warrants it (checked after recording the session)
  if (shouldAdvanceWeek(updated) && updated.currentPhase !== "deload") {
    updated = advanceMacrocycleWeek(updated);
  }

  saveMacrocycle(updated);
  return { macrocycle: updated, triggerResult };
}

// Returns the full modifier set ready to pass to generatePersonalizedPlan().
// Combines macrocycle phase modifiers with the AdaptiveProfile micro-adjustments.
// Call this inside initializeTrainingSession() in page.tsx.

export function getMacrocycleAdjustments(
  adaptiveAdjustments: WorkoutAdjustments
): WorkoutAdjustments {
  const macrocycle = readMacrocycle();
  if (!macrocycle) return adaptiveAdjustments;

  // Ensure the week is current before deriving modifiers
  const current = shouldAdvanceWeek(macrocycle)
    ? advanceMacrocycleWeek(macrocycle)
    : macrocycle;

  return compileFinalModifiers(current, adaptiveAdjustments);
}
