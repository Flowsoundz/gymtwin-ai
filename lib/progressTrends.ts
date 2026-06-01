import { calculateBMI, getBodyProfileSummary } from "@/lib/bodyMetrics";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import type { BodyProfile, TraineeStats, WeeklyPlan, WorkoutSummaryData } from "@/types";

export type TrendPoint = {
  label: string;
  value: number;
};

export type TrendSeries = {
  available: boolean;
  points: TrendPoint[];
  latestValue: number | null;
  averageValue: number | null;
  delta: number | null;
  emptyMessage: string;
};

export type RepQualityTrend = {
  available: boolean;
  cleanReps: number;
  needsWorkReps: number;
  cleanRate: number | null;
  sourceSessions: number;
  emptyMessage: string;
};

export type WeeklyPlanCompletionTrend = {
  available: boolean;
  completedCount: number;
  totalCount: number;
  percent: number;
  todayLabel: string;
};

export type ConsistencyTrend = {
  available: boolean;
  streakCount: number;
  activeDaysLast7: number;
  sessionsLast7: number;
  sessionsLast14: number;
  recentDayBars: TrendPoint[];
  emptyMessage: string;
};

export type BodyMetricsTrend = {
  hasProfile: boolean;
  completionPercent: number;
  bmi: number | null;
  weightDeltaLabel: string;
  summary: string;
};

export type ProgressTrends = {
  safeHistory: WorkoutSummaryData[];
  workoutScoreTrend: TrendSeries;
  formScoreTrend: TrendSeries;
  xpTrend: TrendSeries;
  weeklyPlanCompletion: WeeklyPlanCompletionTrend;
  consistency: ConsistencyTrend;
  repQuality: RepQualityTrend;
  bodyMetrics: BodyMetricsTrend;
};

const TREND_EMPTY_MESSAGE = "Complete more workouts to unlock trends.";

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "narrow" });
}

function parseSessionDate(session: WorkoutSummaryData): Date | null {
  if (typeof session.completedAt !== "string" || !session.completedAt.trim()) {
    return null;
  }

  const parsed = new Date(session.completedAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeHistory(history: WorkoutSummaryData[] | null | undefined) {
  if (!Array.isArray(history)) {
    return [];
  }

  return [...history]
    .filter((session): session is WorkoutSummaryData => Boolean(session && typeof session === "object"))
    .sort((left, right) => {
      const leftTime = parseSessionDate(left)?.getTime() ?? 0;
      const rightTime = parseSessionDate(right)?.getTime() ?? 0;
      return leftTime - rightTime;
    });
}

function buildSeries(
  history: WorkoutSummaryData[],
  getValue: (session: WorkoutSummaryData) => number | null
): TrendSeries {
  const points = history
    .map((session) => {
      const value = getValue(session);
      const date = parseSessionDate(session);

      if (value === null || !date) {
        return null;
      }

      return {
        label: formatShortDate(date),
        value,
      };
    })
    .filter((point): point is TrendPoint => point !== null)
    .slice(-6);

  if (points.length < 2) {
    return {
      available: false,
      points,
      latestValue: points[0]?.value ?? null,
      averageValue: points[0]?.value ?? null,
      delta: null,
      emptyMessage: TREND_EMPTY_MESSAGE,
    };
  }

  const latestValue = points[points.length - 1]?.value ?? null;
  const averageValue = Number(
    (points.reduce((sum, point) => sum + point.value, 0) / points.length).toFixed(1)
  );
  const delta = latestValue === null ? null : Number((latestValue - points[0].value).toFixed(1));

  return {
    available: true,
    points,
    latestValue,
    averageValue,
    delta,
    emptyMessage: TREND_EMPTY_MESSAGE,
  };
}

function buildRepQuality(history: WorkoutSummaryData[]): RepQualityTrend {
  const sessionsWithRepData = history.filter((session) => {
    const estimatedReps = asFiniteNumber(session.estimatedReps);
    const cleanRepEstimate = asFiniteNumber(session.cleanRepEstimate);
    return estimatedReps !== null && estimatedReps > 0 && cleanRepEstimate !== null;
  });

  if (!sessionsWithRepData.length) {
    return {
      available: false,
      cleanReps: 0,
      needsWorkReps: 0,
      cleanRate: null,
      sourceSessions: 0,
      emptyMessage: "Clean rep estimates are not available in this history yet.",
    };
  }

  const cleanReps = sessionsWithRepData.reduce((sum, session) => {
    const cleanRepEstimate = asFiniteNumber(session.cleanRepEstimate) ?? 0;
    return sum + cleanRepEstimate;
  }, 0);

  const totalEstimatedReps = sessionsWithRepData.reduce((sum, session) => {
    const estimatedReps = asFiniteNumber(session.estimatedReps) ?? 0;
    return sum + estimatedReps;
  }, 0);

  const needsWorkReps = Math.max(0, totalEstimatedReps - cleanReps);
  const cleanRate =
    totalEstimatedReps > 0 ? Number(((cleanReps / totalEstimatedReps) * 100).toFixed(1)) : null;

  return {
    available: true,
    cleanReps,
    needsWorkReps,
    cleanRate,
    sourceSessions: sessionsWithRepData.length,
    emptyMessage: "Clean rep estimates are not available in this history yet.",
  };
}

function buildWeeklyPlanCompletion(weeklyPlan?: WeeklyPlan | null): WeeklyPlanCompletionTrend {
  const days = Array.isArray(weeklyPlan?.days) ? weeklyPlan.days : [];
  const totalCount = days.length;
  const completedCount = days.filter((day) => day?.completed).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    available: totalCount > 0,
    completedCount,
    totalCount,
    percent,
    todayLabel: getTodayWeeklyPlanLabel(),
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function buildConsistency(
  history: WorkoutSummaryData[],
  userStats?: TraineeStats | null
): ConsistencyTrend {
  const sessionDates = history.map(parseSessionDate).filter((date): date is Date => date !== null);
  if (!sessionDates.length) {
    return {
      available: false,
      streakCount: userStats?.streak ?? 0,
      activeDaysLast7: 0,
      sessionsLast7: 0,
      sessionsLast14: 0,
      recentDayBars: [],
      emptyMessage: TREND_EMPTY_MESSAGE,
    };
  }

  const normalizedDates = sessionDates.map(startOfDay);
  const uniqueDayKeys = new Set(normalizedDates.map(dayKey));
  const today = startOfDay(new Date());

  const recentDayBars = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = dayKey(date);
    const sessionsForDay = normalizedDates.filter((sessionDate) => dayKey(sessionDate) === key).length;
    return {
      label: formatDayLabel(date),
      value: sessionsForDay,
    };
  });

  const sessionsLast7 = normalizedDates.filter((date) => {
    const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 7;
  }).length;

  const sessionsLast14 = normalizedDates.filter((date) => {
    const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 14;
  }).length;

  const activeDaysLast7 = recentDayBars.filter((bar) => bar.value > 0).length;

  let derivedStreak = 0;
  for (let offset = 0; offset < 60; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    if (uniqueDayKeys.has(dayKey(date))) {
      derivedStreak += 1;
      continue;
    }

    break;
  }

  return {
    available: true,
    streakCount: Math.max(userStats?.streak ?? 0, derivedStreak),
    activeDaysLast7,
    sessionsLast7,
    sessionsLast14,
    recentDayBars,
    emptyMessage: TREND_EMPTY_MESSAGE,
  };
}

function buildBodyMetrics(profile?: BodyProfile | null): BodyMetricsTrend {
  const safeProfile = profile ?? {};
  const filledFields = [
    safeProfile.heightInches,
    safeProfile.weightLbs,
    safeProfile.goalWeightLbs,
    safeProfile.age,
    safeProfile.sex,
    safeProfile.activityGoal,
  ].filter((value) => value !== undefined && value !== null && value !== "").length;

  const completionPercent = Math.round((filledFields / 6) * 100);
  const bmi = calculateBMI(safeProfile.heightInches, safeProfile.weightLbs);
  const weightDeltaLabel =
    typeof safeProfile.weightLbs === "number" && typeof safeProfile.goalWeightLbs === "number"
      ? `${Math.abs(Number((safeProfile.goalWeightLbs - safeProfile.weightLbs).toFixed(1)))} lb ${
          safeProfile.goalWeightLbs >= safeProfile.weightLbs ? "to goal" : "ahead of goal"
        }`
      : "Set current and goal weight to compare";

  return {
    hasProfile: filledFields > 0,
    completionPercent,
    bmi,
    weightDeltaLabel,
    summary: getBodyProfileSummary(safeProfile),
  };
}

export function deriveProgressTrends({
  workoutHistory,
  weeklyPlan,
  bodyProfile,
  userStats,
}: {
  workoutHistory: WorkoutSummaryData[] | null | undefined;
  weeklyPlan?: WeeklyPlan | null;
  bodyProfile?: BodyProfile | null;
  userStats?: TraineeStats | null;
}): ProgressTrends {
  const safeHistory = normalizeHistory(workoutHistory);
  const workoutScoreTrend = buildSeries(safeHistory, (session) => {
    const value = asFiniteNumber(session.workoutScore);
    return value === null ? null : clamp(value, 0, 100);
  });
  const formScoreTrend = buildSeries(safeHistory, (session) => {
    const value = asFiniteNumber(session.formScore);
    return value === null ? null : clamp(value, 0, 100);
  });
  const xpTrend = buildSeries(safeHistory, (session) => asFiniteNumber(session.xpEarned));

  return {
    safeHistory,
    workoutScoreTrend,
    formScoreTrend,
    xpTrend,
    weeklyPlanCompletion: buildWeeklyPlanCompletion(weeklyPlan),
    consistency: buildConsistency(safeHistory, userStats),
    repQuality: buildRepQuality(safeHistory),
    bodyMetrics: buildBodyMetrics(bodyProfile),
  };
}
