import type {
  BodyProfile,
  DifficultyAdjustmentRecommendation,
  TraineeStats,
  WeeklyPlan,
  WorkoutSummaryData,
} from "@/types";

type DifficultyAdjustmentInput = {
  latestWorkoutSummary?: WorkoutSummaryData | null;
  workoutHistory?: WorkoutSummaryData[] | null;
  userStats?: TraineeStats | null;
  bodyProfile?: BodyProfile | null;
  weeklyPlan?: WeeklyPlan | null;
};

function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeHistory(history?: WorkoutSummaryData[] | null) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((session): session is WorkoutSummaryData => Boolean(session && typeof session === "object"))
    .sort((left, right) => {
      const leftTime = parseDate(left.completedAt)?.getTime() ?? 0;
      const rightTime = parseDate(right.completedAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    });
}

function buildRecommendation(
  direction: DifficultyAdjustmentRecommendation["direction"],
  title: string,
  message: string,
  adjustmentLabel: string,
  reason: string
): DifficultyAdjustmentRecommendation {
  return {
    direction,
    title,
    message,
    adjustmentLabel,
    reason,
  };
}

function getLatestWorkout(
  latestWorkoutSummary: WorkoutSummaryData | null | undefined,
  history: WorkoutSummaryData[]
) {
  if (latestWorkoutSummary && typeof latestWorkoutSummary === "object") {
    return latestWorkoutSummary;
  }

  return history[0] ?? null;
}

export function getDifficultyAdjustmentRecommendation(
  input: DifficultyAdjustmentInput
): DifficultyAdjustmentRecommendation {
  const safeHistory = normalizeHistory(input.workoutHistory);
  const latestWorkout = getLatestWorkout(input.latestWorkoutSummary, safeHistory);

  if (!latestWorkout && safeHistory.length === 0) {
    return buildRecommendation(
      "maintain",
      "Establish Your Baseline",
      "Complete one full workout first so GymTwin can calibrate difficulty from real session data.",
      "Finish your first baseline workout.",
      "There is no saved workout history yet."
    );
  }

  const recentSessions = safeHistory.slice(0, 3);
  const hardSessionCount = recentSessions.filter(
    (session) => session.difficultyFeedback === "too_hard"
  ).length;
  const latestFormScore = asFiniteNumber(latestWorkout?.formScore);
  const latestWorkoutScore = asFiniteNumber(latestWorkout?.workoutScore);
  const latestCleanReps = asFiniteNumber(latestWorkout?.cleanRepEstimate);

  if (hardSessionCount >= 2) {
    return buildRecommendation(
      "recovery",
      "Take an Active Recovery Pivot",
      "Recent sessions have stacked up on the hard side. A lighter day will protect consistency better than pushing through fatigue.",
      "Recovery day or reduce 1 set next session.",
      "Two or more recent workouts were marked too hard."
    );
  }

  if (latestWorkout?.difficultyFeedback === "too_easy") {
    return buildRecommendation(
      "increase",
      "Increase the Challenge Slightly",
      "The session came in easier than intended. A small bump is enough for the next round.",
      "+1 set or +2 reps next time.",
      "Your latest workout feedback was too easy."
    );
  }

  if (latestWorkout?.difficultyFeedback === "too_hard") {
    return buildRecommendation(
      hardSessionCount >= 1 ? "recovery" : "decrease",
      hardSessionCount >= 1 ? "Bias Toward Recovery" : "Reduce the Load Slightly",
      hardSessionCount >= 1
        ? "Back off for the next workout and let recovery restore cleaner output."
        : "Trim volume a little so you can finish stronger and keep form steady.",
      hardSessionCount >= 1 ? "Active recovery or shorter session." : "-1 set or -2 reps next time.",
      "Your latest workout feedback was too hard."
    );
  }

  if (latestFormScore !== null && latestFormScore < 75) {
    return buildRecommendation(
      "form_focus",
      "Keep Intensity, Shift to Form",
      "Don’t chase more volume yet. The better move is cleaner control, slower tempo, and sharper reps.",
      "Same intensity, slower tempo and form focus.",
      "Latest form score is below 75."
    );
  }

  if (
    latestWorkoutScore !== null &&
    latestWorkoutScore >= 90 &&
    latestFormScore !== null &&
    latestFormScore >= 85
  ) {
    return buildRecommendation(
      "increase",
      "Progress by One Small Step",
      "You handled the session well with strong form. A modest increase is justified.",
      "+1 set or +2 reps next time.",
      "Latest workout score is 90+ and form score is 85+."
    );
  }

  if (latestWorkoutScore !== null && latestWorkoutScore < 65) {
    return buildRecommendation(
      "maintain",
      "Favor Consistency Over Intensity",
      "The session result suggests the next win is finishing cleanly, not making the workout bigger.",
      "Repeat a manageable session before increasing difficulty.",
      "Latest workout score is below 65."
    );
  }

  if (latestCleanReps !== null && latestCleanReps < 10) {
    return buildRecommendation(
      "form_focus",
      "Clean Up Rep Quality",
      "Use the next workout to improve rep quality before adding more load.",
      "Same plan, but prioritize cleaner reps.",
      "Clean rep estimate was low in the latest workout."
    );
  }

  return buildRecommendation(
    "maintain",
    "Hold the Current Load",
    "Your recent training looks stable enough to keep the same difficulty and build consistency.",
    "Maintain current sets and reps.",
    "No strong signal suggests a bigger increase or decrease right now."
  );
}
