import { ADAPTIVE_PROFILE_KEY } from "@/lib/storageKeys";
import type {
  AdaptiveProfile,
  EnergyRating,
  PostWorkoutFeedback,
  WorkoutAdjustments,
} from "@/types";

// ─── Default / Empty Profile ──────────────────────────────────────────────────

export const defaultAdaptiveProfile: AdaptiveProfile = {
  recentDifficultyFeedback: [],
  recentEnergyRatings: [],
  recentSorenessRatings: [],
  activeSorenessAreas: [],
  lastWorkoutDate: null,
  consecutiveTooHardSessions: 0,
  consecutiveTooEasySessions: 0,
  totalFeedbackSubmissions: 0,
};

// ─── Storage ──────────────────────────────────────────────────────────────────

export function readAdaptiveProfile(): AdaptiveProfile {
  if (typeof window === "undefined") return { ...defaultAdaptiveProfile };
  const raw = window.localStorage.getItem(ADAPTIVE_PROFILE_KEY);
  if (!raw) return { ...defaultAdaptiveProfile };
  try {
    return JSON.parse(raw) as AdaptiveProfile;
  } catch {
    window.localStorage.removeItem(ADAPTIVE_PROFILE_KEY);
    return { ...defaultAdaptiveProfile };
  }
}

export function saveAdaptiveProfile(profile: AdaptiveProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADAPTIVE_PROFILE_KEY, JSON.stringify(profile));
}

// ─── Profile Update ───────────────────────────────────────────────────────────

export function updateAdaptiveProfile(
  profile: AdaptiveProfile,
  feedback: PostWorkoutFeedback,
  workoutDate: string
): AdaptiveProfile {
  const newDifficulty = [...profile.recentDifficultyFeedback, feedback.difficultyFeedback].slice(-4);
  const newEnergy = [...profile.recentEnergyRatings, feedback.energyRating].slice(-4);
  const newSoreness = [...profile.recentSorenessRatings, feedback.sorenessRating].slice(-4);

  // Soreness areas: clear if user says "none", otherwise accumulate
  const activeSorenessAreas =
    feedback.sorenessRating === "none"
      ? []
      : [...new Set([...profile.activeSorenessAreas, ...feedback.sorenessAreas])];

  const consecutiveTooHard =
    feedback.difficultyFeedback === "too_hard" ? profile.consecutiveTooHardSessions + 1 : 0;
  const consecutiveTooEasy =
    feedback.difficultyFeedback === "too_easy" ? profile.consecutiveTooEasySessions + 1 : 0;

  return {
    recentDifficultyFeedback: newDifficulty,
    recentEnergyRatings: newEnergy,
    recentSorenessRatings: newSoreness,
    activeSorenessAreas,
    lastWorkoutDate: workoutDate,
    consecutiveTooHardSessions: consecutiveTooHard,
    consecutiveTooEasySessions: consecutiveTooEasy,
    totalFeedbackSubmissions: profile.totalFeedbackSubmissions + 1,
  };
}

// ─── Adjustments Derivation ───────────────────────────────────────────────────

export function deriveWorkoutAdjustments(profile: AdaptiveProfile): WorkoutAdjustments {
  let volumeModifier = 1.0;
  let repModifier = 1.0;
  let restModifier = 1.0;
  const excludedMuscleGroups: string[] = [];
  const deprioritizedGroups: string[] = [];
  const notes: string[] = [];
  let isRecoverySession = false;

  // ── Difficulty feedback trend ─────────────────────────────────────────────
  if (profile.consecutiveTooHardSessions >= 2) {
    isRecoverySession = true;
    volumeModifier *= 0.72;
    repModifier *= 0.85;
    restModifier *= 1.3;
    notes.push("Recovery session: 2+ consecutive hard sessions");
  } else if (profile.consecutiveTooHardSessions === 1) {
    volumeModifier *= 0.9;
    repModifier *= 0.93;
    restModifier *= 1.18;
    notes.push("Volume eased after a tough session");
  } else if (profile.consecutiveTooEasySessions >= 2) {
    volumeModifier *= 1.1;
    repModifier *= 1.12;
    restModifier *= 0.9;
    notes.push("Intensity stepping up — consistent easy feedback");
  } else if (profile.consecutiveTooEasySessions === 1) {
    repModifier *= 1.06;
    notes.push("Rep count nudged up");
  }

  // ── Energy rating ─────────────────────────────────────────────────────────
  const latestEnergy: EnergyRating | undefined =
    profile.recentEnergyRatings[profile.recentEnergyRatings.length - 1];
  const recentLowCount = profile.recentEnergyRatings.filter((e) => e === "low").length;

  if (latestEnergy === "low") {
    volumeModifier *= 0.85;
    restModifier *= 1.15;
    notes.push("Extra rest added — energy was low last session");
  } else if (recentLowCount >= 2) {
    volumeModifier *= 0.8;
    notes.push("Volume reduced — repeated low energy signals");
  } else if (latestEnergy === "high" && profile.consecutiveTooHardSessions === 0) {
    volumeModifier = Math.min(1.2, volumeModifier * 1.06);
    notes.push("Slight volume boost — good energy reported");
  }

  // ── Soreness exclusions ───────────────────────────────────────────────────
  const latestSoreness = profile.recentSorenessRatings[profile.recentSorenessRatings.length - 1];
  for (const area of profile.activeSorenessAreas) {
    if (latestSoreness === "severe") {
      excludedMuscleGroups.push(area);
      notes.push(`${area} excluded — severe soreness`);
    } else if (latestSoreness === "moderate") {
      deprioritizedGroups.push(area);
      notes.push(`${area} de-prioritized — moderate soreness`);
    } else if (latestSoreness === "mild") {
      deprioritizedGroups.push(area);
    }
  }

  // ── Missed workout recovery ───────────────────────────────────────────────
  if (profile.lastWorkoutDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSince = Math.floor((Date.now() - new Date(profile.lastWorkoutDate).getTime()) / msPerDay);

    if (daysSince >= 7) {
      isRecoverySession = true;
      volumeModifier *= 0.75;
      notes.push("Eased back in — 7+ days since last session");
    } else if (daysSince >= 4) {
      volumeModifier *= 0.88;
      restModifier *= 1.1;
      notes.push("Slight volume reduction after a short break");
    }
  }

  // Clamp all modifiers to sane ranges
  volumeModifier = Math.max(0.6, Math.min(1.25, volumeModifier));
  repModifier = Math.max(0.7, Math.min(1.3, repModifier));
  restModifier = Math.max(0.75, Math.min(1.4, restModifier));

  const intensityNote =
    notes.length > 0
      ? notes.join(". ") + "."
      : "Training load is balanced — no adjustments needed.";

  return {
    volumeModifier,
    repModifier,
    restModifier,
    excludedMuscleGroups,
    deprioritizedGroups,
    intensityNote,
    isRecoverySession,
  };
}

// ─── Human-Readable Feedback Preview ─────────────────────────────────────────
// Computes a plain-language summary from just-submitted feedback (no history required).
// Used to show the "Your next workout has been calibrated" preview in the summary screen.

export function buildFeedbackPreview(feedback: PostWorkoutFeedback): string[] {
  const lines: string[] = [];

  if (feedback.difficultyFeedback === "too_hard") {
    lines.push("Volume reduced for your next session");
  } else if (feedback.difficultyFeedback === "too_easy") {
    lines.push("Intensity stepping up next session");
  } else {
    lines.push("Training load maintained — great balance");
  }

  if (feedback.energyRating === "low") {
    lines.push("Extra rest periods added between sets");
  } else if (feedback.energyRating === "high") {
    lines.push("Slight volume boost queued up");
  }

  if (feedback.sorenessAreas.length > 0) {
    const areaList = feedback.sorenessAreas.join(", ");
    if (feedback.sorenessRating === "severe") {
      lines.push(`${areaList} excluded from next workout`);
    } else if (feedback.sorenessRating === "moderate") {
      lines.push(`${areaList} de-prioritized in next selection`);
    } else {
      lines.push(`Light load on ${areaList} next session`);
    }
  }

  return lines;
}
