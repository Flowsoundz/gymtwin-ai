import { deriveProgressTrends, type ProgressTrends } from "@/lib/progressTrends";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import type {
  BodyProfile,
  CoachAdaptationRecommendation,
  TraineeStats,
  WeeklyPlan,
  WorkoutSummaryData,
} from "@/types";

type AdaptationInput = {
  bodyProfile?: BodyProfile | null;
  weeklyPlan?: WeeklyPlan | null;
  workoutHistory?: WorkoutSummaryData[] | null;
  latestWorkoutSummary?: WorkoutSummaryData | null;
  userStats?: TraineeStats | null;
  progressTrends?: ProgressTrends | null;
};

function hasBodyProfile(profile?: BodyProfile | null) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.heightInches ||
      profile.weightLbs ||
      profile.goalWeightLbs ||
      profile.age ||
      profile.sex ||
      profile.activityGoal
  );
}

function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeHistory(history?: WorkoutSummaryData[] | null) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter((session): session is WorkoutSummaryData => Boolean(session && typeof session === "object"));
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLatestWorkout(
  latestWorkoutSummary: WorkoutSummaryData | null | undefined,
  history: WorkoutSummaryData[]
) {
  if (latestWorkoutSummary && typeof latestWorkoutSummary === "object") {
    return latestWorkoutSummary;
  }

  return [...history].sort((left, right) => {
    const leftTime = parseDate(left.completedAt)?.getTime() ?? 0;
    const rightTime = parseDate(right.completedAt)?.getTime() ?? 0;
    return rightTime - leftTime;
  })[0] ?? null;
}

function buildRecommendation(
  priority: CoachAdaptationRecommendation["priority"],
  title: string,
  message: string,
  suggestedAction: string,
  reason: string
): CoachAdaptationRecommendation {
  return {
    priority,
    title,
    message,
    suggestedAction,
    reason,
  };
}

function getTrendDirection(trends: ProgressTrends) {
  const positiveSignals = [
    (trends.workoutScoreTrend.delta ?? 0) > 4,
    (trends.formScoreTrend.delta ?? 0) > 4,
    (trends.xpTrend.delta ?? 0) > 12,
  ].filter(Boolean).length;

  const negativeSignals = [
    (trends.workoutScoreTrend.delta ?? 0) < -4,
    (trends.formScoreTrend.delta ?? 0) < -4,
    (trends.xpTrend.delta ?? 0) < -12,
  ].filter(Boolean).length;

  if (positiveSignals > negativeSignals && positiveSignals > 0) {
    return "improving";
  }

  if (negativeSignals > positiveSignals && negativeSignals > 0) {
    return "declining";
  }

  return "stable";
}

export function getCoachAdaptationRecommendation(
  input: AdaptationInput
): CoachAdaptationRecommendation {
  const safeHistory = normalizeHistory(input.workoutHistory);
  const progressTrends =
    input.progressTrends ??
    deriveProgressTrends({
      workoutHistory: safeHistory,
      weeklyPlan: input.weeklyPlan,
      bodyProfile: input.bodyProfile,
      userStats: input.userStats,
    });
  const latestWorkout = getLatestWorkout(input.latestWorkoutSummary, safeHistory);
  const todayPlanLabel = getTodayWeeklyPlanLabel();
  const todayPlan =
    input.weeklyPlan?.days.find((day) => day?.dayLabel === todayPlanLabel) ??
    input.weeklyPlan?.days[0] ??
    null;
  const weeklyCompletionLow =
    progressTrends.weeklyPlanCompletion.available &&
    progressTrends.weeklyPlanCompletion.percent < 35;
  const trendDirection = getTrendDirection(progressTrends);
  const hasGoalWeight =
    typeof input.bodyProfile?.goalWeightLbs === "number" &&
    typeof input.bodyProfile?.weightLbs === "number";

  if (!hasBodyProfile(input.bodyProfile)) {
    return buildRecommendation(
      "high",
      "Complete Your Body Profile",
      "Add a few baseline body details so GymTwin can shape recommendations around your current starting point.",
      "Open Settings and save your Body Profile.",
      "Your profile is still missing, so the app has limited context for goal-aware guidance."
    );
  }

  if (!input.weeklyPlan || !Array.isArray(input.weeklyPlan.days) || input.weeklyPlan.days.length === 0) {
    return buildRecommendation(
      "high",
      "Generate a Weekly Plan",
      "Turn single workouts into a weekly rhythm so your next sessions build on each other.",
      "Generate a 7-day Weekly Plan from the home screen.",
      "There is no active weekly structure yet, so the coach cannot guide your next best training day."
    );
  }

  if (!safeHistory.length) {
    return buildRecommendation(
      "high",
      "Start Your First Guided Workout",
      "Your best next move is to finish one full guided session so the coach has real training data to adapt from.",
      "Start a guided workout and complete it end to end.",
      "Workout history is empty, so there is no signal yet for intensity, form, or consistency."
    );
  }

  if (latestWorkout?.difficultyFeedback === "too_hard") {
    return buildRecommendation(
      "high",
      "Dial Back Volume Slightly",
      "The last workout landed too hard. Reduce volume a bit and prioritize recovery so consistency stays intact.",
      "Choose a shorter or easier session next, then focus on clean reps.",
      "Your latest feedback marked the session as too hard."
    );
  }

  if ((asFiniteNumber(latestWorkout?.formScore) ?? 100) < 75) {
    return buildRecommendation(
      "high",
      "Run a Form-Focused Session",
      "Technique should lead the next workout. Keep intensity modest and aim for cleaner, more controlled reps.",
      "Start a shorter session and treat it as a form-first practice day.",
      "Your latest form score fell below 75, which suggests technique needs attention before pushing harder."
    );
  }

  if (todayPlan && !todayPlan.completed) {
    return buildRecommendation(
      "medium",
      "Hit Today’s Plan Focus",
      `Your weekly plan already points to ${todayPlan.focus.toLowerCase()} today. Staying on that track is the smartest move.`,
      `Start today’s ${todayPlan.durationMinutes}-minute ${todayPlan.focus.toLowerCase()} session.`,
      `Today’s weekly plan entry is still incomplete${todayPlan.recommendedWorkout ? ` and recommends ${todayPlan.recommendedWorkout}` : ""}.`
    );
  }

  if (latestWorkout?.difficultyFeedback === "too_easy") {
    return buildRecommendation(
      "medium",
      "Increase the Challenge Slightly",
      "The last workout felt easier than intended, so the next session can safely push a bit more.",
      "Choose a slightly harder setup or add a little more volume next workout.",
      "Your latest feedback marked the workout as too easy."
    );
  }

  if ((asFiniteNumber(latestWorkout?.workoutScore) ?? 0) >= 90) {
    return buildRecommendation(
      "medium",
      "Keep Your Momentum",
      "You just posted a strong session. Stay on plan or add a small challenge bump while your execution is sharp.",
      "Repeat your current rhythm or progress one step in difficulty.",
      "Your latest workout score reached 90 or higher."
    );
  }

  if (weeklyCompletionLow) {
    return buildRecommendation(
      "medium",
      "Restart Consistency with a Short Win",
      "A quick, finishable session is more valuable right now than waiting for a perfect training day.",
      "Do a short planned workout today and rebuild weekly momentum.",
      `Weekly plan completion is currently ${progressTrends.weeklyPlanCompletion.percent}%.`
    );
  }

  if (trendDirection === "declining") {
    return buildRecommendation(
      "medium",
      "Simplify and Rebuild Consistency",
      "Recent performance signals have dipped a bit. Pull training back to a clean, repeatable baseline for a few sessions.",
      "Choose a simpler workout and focus on showing up consistently.",
      "Recent score, form, or XP trends are trending down."
    );
  }

  if (hasGoalWeight) {
    const currentWeight = input.bodyProfile?.weightLbs ?? 0;
    const goalWeight = input.bodyProfile?.goalWeightLbs ?? 0;
    const delta = Math.abs(Number((goalWeight - currentWeight).toFixed(1)));

    return buildRecommendation(
      "low",
      "Stay Consistent with Your Goal",
      `You are ${delta} lb from your current weight target. Steady weekly training matters more than one big session.`,
      "Follow your weekly plan and protect your streak this week.",
      "A goal weight is saved, so the best next move is consistent training aligned with that target."
    );
  }

  if (trendDirection === "improving") {
    return buildRecommendation(
      "low",
      "Momentum Is Building",
      "Recent training signals are moving in the right direction. Keep stacking sessions without overcomplicating the plan.",
      "Stay with your current rhythm and complete your next scheduled workout.",
      "Workout, form, or XP trends are improving across recent sessions."
    );
  }

  return buildRecommendation(
    "low",
    "Protect the Routine",
    "Your next best move is another solid, repeatable session that keeps your baseline moving forward.",
    "Start the next planned workout and aim for steady execution.",
    "Your recent data looks stable, so consistency is the highest-value move."
  );
}
