import type { DifficultyFeedback, WorkoutSummaryData } from "@/types";

type SummaryInput = Pick<
  WorkoutSummaryData,
  | "actualSessionMinutes"
  | "totalSets"
  | "estimatedReps"
  | "exerciseCount"
  | "difficultyFeedback"
  | "level"
  | "goal"
> & {
  cleanRepPct?: number; // 0–1, from camera tracking; undefined = no camera data
};

function difficultyModifier(feedback: DifficultyFeedback) {
  if (feedback === "perfect") return 8;
  if (feedback === "too_easy") return 4;
  if (feedback === "too_hard") return 2;
  return 5;
}

export function calculateWorkoutScore(summaryInput: SummaryInput): number {
  const setScore = summaryInput.totalSets * 4;
  const repScore = Math.min(24, Math.round(summaryInput.estimatedReps * 0.18));
  const minuteScore = Math.min(14, Math.round(summaryInput.actualSessionMinutes * 1.2));
  const exerciseScore = Math.min(10, summaryInput.exerciseCount * 2);
  const levelBonus =
    summaryInput.level === "Advanced" ? 6 : summaryInput.level === "Intermediate" ? 4 : 2;
  const score =
    70 +
    setScore +
    repScore +
    minuteScore +
    exerciseScore +
    levelBonus +
    difficultyModifier(summaryInput.difficultyFeedback) -
    45;

  return Math.max(40, Math.min(100, Math.round(score)));
}

export function calculateFormScore(summaryInput: SummaryInput): number {
  const base =
    summaryInput.difficultyFeedback === "perfect"
      ? 79
      : summaryInput.difficultyFeedback === "too_easy"
        ? 74
        : summaryInput.difficultyFeedback === "too_hard"
          ? 77
          : 75;
  const consistencyBonus = Math.min(10, Math.round(summaryInput.totalSets / 2));
  const repBalancePenalty = summaryInput.estimatedReps > 160 ? 4 : 0;
  const baseScore = Math.round(base + consistencyBonus - repBalancePenalty);

  // Camera override: if we have clean rep data, blend it in (60% camera, 40% base)
  if (summaryInput.cleanRepPct != null) {
    const cameraScore = Math.round(summaryInput.cleanRepPct * 100);
    const blended = Math.round(cameraScore * 0.6 + baseScore * 0.4);
    return Math.max(50, Math.min(100, blended));
  }

  return Math.max(50, Math.min(100, baseScore));
}

export function calculateXpEarned(summaryInput: SummaryInput): number {
  const workoutScore = calculateWorkoutScore(summaryInput);
  const xp = workoutScore + summaryInput.actualSessionMinutes * 3 + summaryInput.totalSets * 4;
  return Math.max(50, Math.min(250, Math.round(xp)));
}

export function calculateCleanRepEstimate(summaryInput: SummaryInput): number {
  const formScore = calculateFormScore(summaryInput);
  const estimate = Math.round(summaryInput.estimatedReps * (formScore / 100) * 0.9);
  return Math.min(summaryInput.estimatedReps, Math.max(0, estimate));
}

export function generateCoachNote(summaryInput: SummaryInput): string {
  const workoutScore = calculateWorkoutScore(summaryInput);
  const formScore = calculateFormScore(summaryInput);

  if (summaryInput.difficultyFeedback === "too_hard") {
    return "Solid effort. We can scale slightly and build consistency.";
  }
  if (summaryInput.difficultyFeedback === "too_easy") {
    return "You handled that well. Next session can push intensity.";
  }
  if (summaryInput.difficultyFeedback === "perfect") {
    return "Great balance. That session matched your current level.";
  }
  if (workoutScore >= 88 && formScore >= 82) {
    return "Strong session. Keep stacking clean reps.";
  }
  if (formScore <= 72) {
    return "Good work. Next time, focus on control and range.";
  }
  return "Session complete. Keep building consistency.";
}

export function buildScoredWorkoutSummary(summary: WorkoutSummaryData, cleanRepPct?: number): WorkoutSummaryData {
  const scoringInput: SummaryInput = {
    goal: summary.goal,
    level: summary.level,
    actualSessionMinutes: summary.actualSessionMinutes,
    totalSets: summary.totalSets,
    estimatedReps: summary.estimatedReps,
    exerciseCount: summary.exerciseCount,
    difficultyFeedback: summary.difficultyFeedback,
    cleanRepPct,
  };

  return {
    ...summary,
    workoutScore: calculateWorkoutScore(scoringInput),
    formScore: calculateFormScore(scoringInput),
    xpEarned: calculateXpEarned(scoringInput),
    cleanRepEstimate: calculateCleanRepEstimate(scoringInput),
    coachNote: generateCoachNote(scoringInput),
  };
}
