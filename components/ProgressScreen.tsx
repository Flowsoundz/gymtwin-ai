"use client";

import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { FeedbackBadge } from "@/components/ui/FeedbackBadge";
import { StatCard } from "@/components/ui/StatCard";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import { getAvatarCoachLayerState } from "@/lib/avatarCoachLayer";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { readBodyProfileHistory, type BodyProfileHistoryEntry } from "@/lib/bodyProfileStorage";
import { calculateBMI, getBMICategory, getBodyProfileSummary } from "@/lib/bodyMetrics";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import { getDifficultyAdjustmentRecommendation } from "@/lib/difficultyAdjustmentEngine";
import { deriveProgressTrends, type TrendPoint, type TrendSeries } from "@/lib/progressTrends";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import { useMemo, useState, type ReactNode } from "react";
import { deriveWorkoutAdjustments } from "@/lib/adaptiveProfileEngine";
import {
  getProgressionSuggestion,
  getTopLoggedExercises,
  type ExerciseSummary,
} from "@/lib/progressiveOverloadEngine";
import {
  getAFIBand,
  getMacrocycleArc,
  getPhaseBadgeColor,
  getPhaseLabel,
} from "@/lib/macrocycleEngine";
import type { AdaptiveProfile, AchievementBadge, BodyProfile, CoachAvatar, TraineeStats, WeeklyPlan, WeeklyPlanDayConfig, WorkoutSummaryData } from "@/types";
import type { Macrocycle } from "@/types/macrocycle";

type ProgressScreenProps = {
  selectedAvatar?: CoachAvatar;
  badges: AchievementBadge[];
  bodyProfile?: BodyProfile | null;
  weeklyPlan?: WeeklyPlan | null;
  userStats: TraineeStats;
  workoutHistory: WorkoutSummaryData[];
  adaptiveProfile?: AdaptiveProfile | null;
  macrocycle?: Macrocycle | null;
  onStartAnotherWorkout: () => void;
  onStartPlanDay?: (config: WeeklyPlanDayConfig) => void;
  onReturnHome: () => void;
  onViewWorkoutDetail: (workout: WorkoutSummaryData) => void;
  primaryButton: string;
  secondaryButton: string;
};

function recentWorkoutFromHistory(workoutHistory: WorkoutSummaryData[]) {
  return Array.isArray(workoutHistory) && workoutHistory.length > 0 ? workoutHistory[0] : null;
}

function EmptyTrendState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-slate-950/45 px-4 py-6 text-center text-xs leading-relaxed text-slate-500">
      {message}
    </div>
  );
}

function EmptyDashboardState({
  title,
  message,
  chips,
}: {
  title: string;
  message: string;
  chips: string[];
}) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-blue-400/16 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(2,6,23,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">New Athlete View</p>
      <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/8 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// Cold-start projection — instead of hiding the chart for new users, render a
// low-opacity dashed target trajectory derived from their profile so they can
// see exactly what tracking will look like once they start logging.
function BaselineProjection({
  target,
  caption,
  color,
}: {
  target: number;
  caption: string;
  color: string;
}) {
  const STEPS = [0.16, 0.32, 0.48, 0.64, 0.8, 0.95];
  const LABELS = ["W1", "W2", "W3", "W4", "W5", "Goal"];
  const polyPoints = STEPS.map((f, i) => `${(i / (STEPS.length - 1)) * 100},${(1 - f) * 100}`).join(" ");

  return (
    <div className="mt-4">
      <div className="relative h-24">
        {/* Target ceiling label */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2">
          <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em]" style={{ color }}>
            Target {target}
          </span>
          <div className="h-px flex-1 border-t border-dashed" style={{ borderColor: color, opacity: 0.45 }} />
        </div>

        {/* Chart area */}
        <div className="absolute inset-x-0 bottom-6 top-4">
          {/* Ghost rising bars */}
          <div className="absolute inset-0 flex items-end gap-2">
            {STEPS.map((f, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${f * 100}%`,
                  background: `linear-gradient(to top, ${color}2e, ${color}0a)`,
                }}
              />
            ))}
          </div>
          {/* Dashed projected trajectory line */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={polyPoints}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.7}
            />
            {STEPS.map((f, i) => (
              <circle
                key={i}
                cx={(i / (STEPS.length - 1)) * 100}
                cy={(1 - f) * 100}
                r={1.4}
                fill={color}
                vectorEffect="non-scaling-stroke"
                opacity={0.85}
              />
            ))}
          </svg>
        </div>

        {/* Week labels */}
        <div className="absolute inset-x-0 bottom-0 flex gap-2">
          {LABELS.map((label, i) => (
            <span
              key={label}
              className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: i === LABELS.length - 1 ? color : undefined }}
            >
              <span className={i === LABELS.length - 1 ? "" : "text-slate-600"}>{label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]"
          style={{ borderColor: `${color}55`, color }}>
          Projected
        </span>
        <p className="text-[11px] leading-relaxed text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

function MiniBarChart({
  points,
  colorClass,
}: {
  points: TrendPoint[];
  colorClass: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-4">
      <div className="relative flex h-24 items-end gap-2">
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/[0.08]" style={{ bottom: "25%" }} />
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/[0.10]" style={{ bottom: "50%" }} />
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/[0.08]" style={{ bottom: "75%" }} />
        {points.map((point) => (
          <div key={`${point.label}-${point.value}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-20 w-full items-end rounded-full bg-white/[0.05] px-1 py-1">
              <div
                className={`w-full rounded-full bg-gradient-to-t ${colorClass}`}
                style={{ height: `${Math.max(12, Math.round((point.value / maxValue) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklineRow({
  points,
  activeClass,
}: {
  points: TrendPoint[];
  activeClass: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-4 flex items-end gap-2">
      {points.map((point) => (
        <div key={`${point.label}-${point.value}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-12 w-full items-end rounded-full bg-white/[0.05] px-1 py-1">
            <div
              className={`w-full rounded-full ${point.value > 0 ? activeClass : "bg-white/10"}`}
              style={{ height: `${Math.max(8, Math.round((point.value / maxValue) * 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricDeltaPill({
  delta,
  suffix = "",
}: {
  delta: number | null;
  suffix?: string;
}) {
  if (delta === null) {
    return (
      <span className="rounded-full border border-white/8 bg-slate-900/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        No baseline
      </span>
    );
  }

  const toneClass =
    delta < 0
      ? "border-emerald-400/22 bg-emerald-500/12 text-emerald-200"
      : delta > 0
        ? "border-red-400/22 bg-red-500/12 text-red-200"
        : "border-blue-400/22 bg-blue-500/12 text-blue-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${toneClass}`}>
      {delta > 0 ? "+" : ""}
      {delta}
      {suffix}
      {" · 7D"}
    </span>
  );
}

function MetricSparkline({
  points,
  stroke,
  fill,
}: {
  points: TrendPoint[];
  stroke: string;
  fill: string;
}) {
  if (points.length === 0) {
    return <div className="mt-3 h-12 rounded-xl border border-white/8 bg-slate-900/60" />;
  }

  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const coordinates = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const areaCoordinates = `0,100 ${coordinates} 100,100`;

  return (
    <div className="mt-3">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-12 w-full overflow-visible">
        <polyline
          points="0,8 100,8"
          fill="none"
          stroke="rgba(148,163,184,0.10)"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points="0,16 100,16"
          fill="none"
          stroke="rgba(148,163,184,0.10)"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points="0,24 100,24"
          fill="none"
          stroke="rgba(148,163,184,0.16)"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <polygon points={areaCoordinates} fill={fill} opacity="0.24" transform="scale(1,0.3)" transform-origin="center" />
        <polyline
          points={coordinates}
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point, index) => {
          const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
          const y = 100 - ((point.value - min) / range) * 100;
          return <circle key={`${point.label}-${point.value}`} cx={x} cy={y} r="2" fill={stroke} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="mt-1 grid grid-cols-7 gap-1 text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">
        {points.map((point) => (
          <span key={point.label} className="truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({
  percent,
  trackClassName = "bg-white/5",
  fillClassName,
}: {
  percent: number;
  trackClassName?: string;
  fillClassName: string;
}) {
  return (
    <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${trackClassName}`}>
      <div
        className={`h-full rounded-full ${fillClassName}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function buildMetricTrend(
  history: BodyProfileHistoryEntry[],
  accessor: (entry: BodyProfileHistoryEntry) => number | null,
  fallbackValue: number | null
): { points: TrendPoint[]; delta: number | null } {
  const recentPoints = history
    .map((entry) => {
      const value = accessor(entry);
      if (value === null || !Number.isFinite(value)) {
        return null;
      }

      const labelDate = new Date(`${entry.date}T12:00:00`);
      return {
        label: Number.isNaN(labelDate.getTime())
          ? entry.date.slice(5).replace("-", "/")
          : labelDate.toLocaleDateString("en-US", { weekday: "narrow" }),
        value,
      };
    })
    .filter((point): point is TrendPoint => point !== null)
    .slice(-7);

  const points =
    recentPoints.length > 0
      ? recentPoints
      : fallbackValue !== null
        ? Array.from({ length: 7 }, (_, index) => ({
            label: ["M", "T", "W", "T", "F", "S", "S"][index] ?? "",
            value: fallbackValue,
          }))
        : [];

  const delta =
    points.length >= 2
      ? Number((points[points.length - 1].value - points[0].value).toFixed(1))
      : null;

  return { points, delta };
}

function TrendCard({
  eyebrow,
  title,
  pill,
  series,
  accentTextClass,
  barColorClass,
  footer,
  children,
  projection,
  glow,
}: {
  eyebrow: string;
  title: string;
  pill: string;
  series: TrendSeries;
  accentTextClass: string;
  barColorClass: string;
  footer?: string;
  children?: ReactNode;
  projection?: { target: number; caption: string; color: string };
  glow?: string;
}) {
  return (
    <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${accentTextClass}`}>{eyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
          {pill}
        </div>
      </div>

      {series.available ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div
              className="rounded-2xl border bg-[linear-gradient(145deg,rgba(24,24,27,0.9),rgba(2,6,23,0.92))] px-3 py-3"
              style={glow ? { borderColor: `${glow}66`, boxShadow: `0 0 18px ${glow}33, inset 0 1px 0 ${glow}1f` } : undefined}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Latest</p>
              <p className="mt-1 text-lg font-black" style={glow ? { color: glow } : undefined}>{series.latestValue ?? "--"}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Average</p>
              <p className="mt-1 text-lg font-black text-white">{series.averageValue ?? "--"}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Trend</p>
              <p className="mt-1 text-lg font-black text-white">
                {series.delta === null ? "--" : `${series.delta > 0 ? "+" : ""}${series.delta}`}
              </p>
            </div>
          </div>
          <MiniBarChart points={series.points} colorClass={barColorClass} />
          {children}
          {footer ? <p className="mt-4 text-xs leading-relaxed text-slate-400">{footer}</p> : null}
        </>
      ) : (
        <>
          {projection ? (
            <BaselineProjection
              target={projection.target}
              caption={projection.caption}
              color={projection.color}
            />
          ) : (
            <EmptyTrendState message={series.emptyMessage} />
          )}
          {children}
        </>
      )}
    </div>
  );
}

export function ProgressScreen({
  selectedAvatar = "Nova",
  badges,
  bodyProfile,
  weeklyPlan,
  userStats,
  workoutHistory,
  adaptiveProfile,
  macrocycle,
  onStartAnotherWorkout,
  onStartPlanDay,
  onReturnHome,
  onViewWorkoutDetail,
  primaryButton,
  secondaryButton,
}: ProgressScreenProps) {
  const trendData = useMemo(
    () =>
      deriveProgressTrends({
        workoutHistory,
        weeklyPlan,
        bodyProfile,
        userStats,
      }),
    [bodyProfile, userStats, weeklyPlan, workoutHistory]
  );
  const coachInsight = useMemo(
    () =>
      getCoachAdaptationRecommendation({
        bodyProfile,
        weeklyPlan,
        workoutHistory,
        latestWorkoutSummary: recentWorkoutFromHistory(workoutHistory),
        userStats,
        progressTrends: trendData,
      }),
    [bodyProfile, trendData, userStats, weeklyPlan, workoutHistory]
  );
  const difficultyAdjustment = useMemo(
    () =>
      getDifficultyAdjustmentRecommendation({
        latestWorkoutSummary: recentWorkoutFromHistory(workoutHistory),
        workoutHistory,
        userStats,
        bodyProfile,
        weeklyPlan,
      }),
    [bodyProfile, userStats, weeklyPlan, workoutHistory]
  );
  const recentWorkoutsToDisplay = trendData.safeHistory.slice(-5).reverse();
  const topExercises = useMemo<ExerciseSummary[]>(() => getTopLoggedExercises(10), [workoutHistory.length]);
  const adaptiveAdjustments = useMemo(
    () => (adaptiveProfile ? deriveWorkoutAdjustments(adaptiveProfile) : null),
    [adaptiveProfile]
  );
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const bodyProfileHistory = useMemo(() => readBodyProfileHistory(), [bodyProfile?.lastUpdated]);

  const progressCoachBrain = useMemo(
    () =>
      getCoachBrainResponse({
        selectedAvatarName: getAvatarLabel(selectedAvatar),
        screenContext: "progress",
      }),
    [selectedAvatar]
  );
  const progressCoachState = useMemo(
    () =>
      getAvatarCoachLayerState({
        surface: "progress",
        selectedAvatar,
        coachBrain: progressCoachBrain,
        isWorkoutComplete: workoutHistory.length > 0,
      }),
    [selectedAvatar, progressCoachBrain, workoutHistory.length]
  );
  const unlockedBadgeCount = badges.filter((badge) => badge.unlocked).length;
  const nextBadge = badges.find((badge) => !badge.unlocked) ?? null;
  const todayPlanLabel = getTodayWeeklyPlanLabel();
  const completedWeeklyDays = weeklyPlan?.days.filter((day) => day.completed).length ?? 0;
  const bmi = calculateBMI(bodyProfile?.heightInches, bodyProfile?.weightLbs);
  const bmiCategory = getBMICategory(bmi);
  const bodyProfileSummary = getBodyProfileSummary(bodyProfile ?? {});
  const weightTrend = useMemo(
    () => buildMetricTrend(bodyProfileHistory, (entry) => entry.weightLbs ?? null, bodyProfile?.weightLbs ?? null),
    [bodyProfile?.weightLbs, bodyProfileHistory]
  );
  const bmiTrend = useMemo(
    () => buildMetricTrend(bodyProfileHistory, (entry) => entry.bmi, bmi),
    [bmi, bodyProfileHistory]
  );

  // Cold-start baseline projections — profile-driven target trajectories shown
  // in the trend cards before any sessions are logged.
  const projectionGoal = bodyProfile?.activityGoal?.trim() || "Lean Muscle";
  const projectionWeight = bodyProfile?.weightLbs ?? 180;
  const advancedLevel = (bmi ?? 0) > 0 && (bmi ?? 25) < 25;
  const workoutScoreProjection = {
    target: advancedLevel ? 88 : 82,
    color: "#60a5fa",
    caption: `Projected path for your ${projectionGoal} goal at ${projectionWeight} lbs. Log a session to start tracking.`,
  };
  const formScoreProjection = {
    target: 90,
    color: "#34d399",
    caption: `Clean-rep form target for ${projectionGoal}. Your real form scores will fill this in.`,
  };
  const xpProjection = {
    target: 150,
    color: "#e879f9",
    caption: `Estimated XP ramp over your first 5 sessions at this intensity.`,
  };
  const motivationalLine =
    userStats.workoutsCompleted === 0
      ? "Complete your first workout to start earning badges and building momentum."
      : userStats.streak > 0
        ? "Complete another workout to keep your streak alive."
        : "Start another session to keep your progress moving.";
  const consistencyScore = trendData.consistency.available
    ? Math.round((trendData.consistency.activeDaysLast7 / 7) * 100)
    : 0;
  const recoveryFocusLabel =
    difficultyAdjustment.direction === "recovery"
      ? "Recovery bias"
      : difficultyAdjustment.direction === "form_focus"
        ? "Form bias"
        : difficultyAdjustment.direction === "increase"
          ? "Momentum bias"
          : "Consistency bias";
  const coachInsightTone =
    coachInsight.priority === "high"
      ? "border-red-400/18 bg-red-500/10 text-red-200"
      : coachInsight.priority === "medium"
        ? "border-blue-400/18 bg-blue-500/10 text-blue-200"
        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";
  const difficultyTone =
    difficultyAdjustment.direction === "increase"
      ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : difficultyAdjustment.direction === "decrease"
        ? "border-red-400/18 bg-red-500/10 text-red-200"
        : difficultyAdjustment.direction === "form_focus"
          ? "border-cyan-400/18 bg-cyan-500/10 text-cyan-200"
          : difficultyAdjustment.direction === "recovery"
            ? "border-fuchsia-400/18 bg-fuchsia-500/10 text-fuchsia-200"
            : "border-blue-400/18 bg-blue-500/10 text-blue-200";

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Training Archive</p>
                <h2 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                  Progress
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                  Keep your streak alive, review recent sessions, and track how your training adapts over time.
                </p>
              </div>
              <div className="rounded-full border border-blue-400/14 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                {trendData.safeHistory.length} total logs
              </div>
            </div>
          </header>

          {userStats.workoutsCompleted === 0 ? (
            <section className="mb-6">
              <EmptyDashboardState
                title="Your progress hub will populate after your first sessions."
                message="As soon as you complete workouts, GymTwin will start surfacing score trends, body-metric deltas, streak movement, and adaptive recommendations here."
                chips={["Workout score", "Form trend", "Body delta", "Weekly streak", "Coach insights"]}
              />
            </section>
          ) : null}

          <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
            <div className="rounded-[1.75rem] border border-blue-400/22 bg-[linear-gradient(135deg,rgba(59,130,246,0.1),rgba(15,23,42,0.88))] p-5 text-center shadow-[0_0_28px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(59,130,246,0.14)]">
              <StatCard value={userStats.workoutsCompleted} label="Workouts" colorClass="text-blue-400" />
            </div>
            <div className="rounded-[1.75rem] border border-fuchsia-400/22 bg-[linear-gradient(135deg,rgba(217,70,239,0.1),rgba(15,23,42,0.88))] p-5 text-center shadow-[0_0_28px_rgba(217,70,239,0.1),inset_0_1px_0_rgba(217,70,239,0.14)]">
              <StatCard value={userStats.streak} label="Day Streak" colorClass="text-fuchsia-400" suffix="🔥" />
            </div>
            <div className="col-span-2 rounded-[1.75rem] border border-indigo-400/22 bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(15,23,42,0.88))] p-5 text-center shadow-[0_0_28px_rgba(99,102,241,0.1),inset_0_1px_0_rgba(99,102,241,0.14)] lg:col-span-1">
              <StatCard value={userStats.totalMinutes} label="Real Training Minutes" colorClass="text-indigo-400" />
            </div>
          </section>

          <section className="mb-6 rounded-[1.7rem] border border-blue-400/12 bg-slate-950/58 p-5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Last Workout Date</p>
            <p className="mt-2 text-base font-semibold text-slate-200">
              {userStats.lastWorkoutDate || "No workout completed yet"}
            </p>
          </section>

          {/* ── Progressive Overload — Exercise History ─────────────────── */}
          {topExercises.length > 0 && (
            <section className="mb-6 overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="border-b border-white/6 px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-400">Progressive Overload</p>
                <p className="mt-0.5 text-sm font-black text-white">Exercise History & PRs</p>
              </div>
              <div className="divide-y divide-white/5">
                {topExercises.map((ex) => {
                  const suggestion = getProgressionSuggestion(ex.name);
                  return (
                    <div key={ex.name} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-100 truncate">{ex.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">{ex.count} set{ex.count !== 1 ? "s" : ""} logged</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {ex.pr?.bestWeightLbs != null && ex.pr.bestWeightLbs > 0 ? (
                            <>
                              <p className="text-base font-black text-emerald-300">{ex.pr.bestWeightLbs} lbs</p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Best weight</p>
                            </>
                          ) : ex.pr?.bestReps != null ? (
                            <>
                              <p className="text-base font-black text-blue-300">{ex.pr.bestReps} reps</p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Best reps</p>
                            </>
                          ) : null}
                          {ex.pr?.bestEstimated1RM != null && (
                            <p className="text-[9px] text-slate-500">~{ex.pr.bestEstimated1RM} lbs 1RM</p>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400 italic">
                        Next: {suggestion}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Personal Records ─────────────────────────────────────────── */}
          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-yellow-400">Personal Records</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Best Score", value: trendData.personalRecords.bestWorkoutScore != null ? `${trendData.personalRecords.bestWorkoutScore}` : "—", color: "text-fuchsia-300" },
                { label: "Best Form", value: trendData.personalRecords.bestFormScore != null ? `${trendData.personalRecords.bestFormScore}` : "—", color: "text-emerald-300" },
                { label: "Peak Streak", value: `${trendData.personalRecords.bestStreak}d`, color: "text-orange-300" },
                { label: "Total Sets", value: trendData.personalRecords.totalSets > 0 ? `${trendData.personalRecords.totalSets}` : "—", color: "text-blue-300" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-slate-900/60 px-3 py-3 text-center">
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 35-Day Activity Heatmap ───────────────────────────────────── */}
          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-400">Activity — Last 5 Weeks</p>
              <span className="text-[10px] font-bold text-slate-500">
                {trendData.activityHeatmap.filter(d => d.count > 0).length} active days
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <p key={i} className="text-center text-[8px] font-black uppercase tracking-wider text-slate-600">{d}</p>
              ))}
              {trendData.activityHeatmap.map((day, i) => (
                <div
                  key={i}
                  title={`${day.dayLabel}: ${day.count > 0 ? "Worked out" : "Rest"}`}
                  className={`aspect-square rounded-md transition-colors ${
                    day.count > 0
                      ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      : "bg-white/5"
                  }`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-sm bg-white/5" />
              <span className="text-[9px] text-slate-600">Rest</span>
              <div className="ml-2 h-2.5 w-2.5 rounded-sm bg-purple-500" />
              <span className="text-[9px] text-slate-600">Workout</span>
            </div>
          </section>

          {/* ── Volume per Week + Energy Trend ───────────────────────────── */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {/* Volume per week */}
            <section className="rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-blue-400">Sets per Week</p>
              {trendData.volumePerWeek.every(p => p.value === 0) ? (
                <p className="text-xs text-slate-500">Complete workouts to see weekly volume.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-20">
                  {trendData.volumePerWeek.map((point, i) => {
                    const max = Math.max(...trendData.volumePerWeek.map(p => p.value), 1);
                    const pct = Math.round((point.value / max) * 100);
                    const isLatest = i === trendData.volumePerWeek.length - 1;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[8px] font-bold text-slate-500">{point.value > 0 ? point.value : ""}</span>
                        <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(4, pct)}%`, background: isLatest ? "linear-gradient(to top, rgb(99,102,241), rgb(168,85,247))" : "rgba(255,255,255,0.08)" }} />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Energy trend */}
            <section className="rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-teal-400">Energy — Last 8 Sessions</p>
              {trendData.energyBars.length === 0 ? (
                <p className="text-xs text-slate-500">Rate your energy after workouts to see trends.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-20">
                  {trendData.energyBars.map((bar, i) => {
                    const pct = bar.value === 3 ? 100 : bar.value === 2 ? 66 : 33;
                    const color = bar.rating === "high" ? "rgba(52,211,153,0.8)" : bar.rating === "moderate" ? "rgba(99,102,241,0.7)" : "rgba(251,146,60,0.7)";
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${bar.label}: ${bar.rating ?? "—"}`}>
                        <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}%`, background: color }} />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">{bar.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: "Low", color: "bg-orange-400/70" },
                  { label: "Moderate", color: "bg-indigo-400/70" },
                  { label: "High", color: "bg-emerald-400/70" },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                    <span className={`h-2 w-2 rounded-sm ${color}`} />{label}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* ── Difficulty Distribution ───────────────────────────────────── */}
          {trendData.difficultyDistribution.total > 0 && (
            <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-400">Difficulty Breakdown</p>
                <span className="text-[10px] text-slate-500">{trendData.difficultyDistribution.total} rated sessions</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full">
                {trendData.difficultyDistribution.tooEasy > 0 && (
                  <div className="bg-blue-500/70 transition-all" style={{ width: `${(trendData.difficultyDistribution.tooEasy / trendData.difficultyDistribution.total) * 100}%` }} />
                )}
                {trendData.difficultyDistribution.perfect > 0 && (
                  <div className="bg-emerald-500/70 transition-all" style={{ width: `${(trendData.difficultyDistribution.perfect / trendData.difficultyDistribution.total) * 100}%` }} />
                )}
                {trendData.difficultyDistribution.tooHard > 0 && (
                  <div className="bg-red-500/70 transition-all" style={{ width: `${(trendData.difficultyDistribution.tooHard / trendData.difficultyDistribution.total) * 100}%` }} />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {[
                  { label: "Too Easy", count: trendData.difficultyDistribution.tooEasy, color: "text-blue-300" },
                  { label: "Just Right", count: trendData.difficultyDistribution.perfect, color: "text-emerald-300" },
                  { label: "Too Hard", count: trendData.difficultyDistribution.tooHard, color: "text-red-300" },
                ].filter(d => d.count > 0).map(({ label, count, color }) => (
                  <span key={label} className={`text-[10px] font-black ${color}`}>
                    {label} <span className="text-slate-500 font-bold">×{count}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Macrocycle Training Arc ──────────────────────────────────── */}
          {macrocycle && (
            <section className="mb-6 overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="border-b border-white/6 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-indigo-400">
                      Training Arc
                    </p>
                    <p className="mt-0.5 text-sm font-black text-white">
                      Block {macrocycle.id.slice(-6)} · Week {macrocycle.currentWeek} of {macrocycle.targetWeeks}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getPhaseBadgeColor(macrocycle.currentPhase)}`}>
                    {getPhaseLabel(macrocycle.currentPhase)}
                  </span>
                </div>
              </div>

              {/* Phase timeline */}
              <div className="p-5">
                <div className="flex gap-1.5">
                  {getMacrocycleArc(macrocycle).map((week) => (
                    <div key={week.week} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={`w-full rounded-lg py-2 text-center text-[8px] font-black uppercase tracking-wider transition-all ${
                          week.status === "completed"
                            ? "bg-white/10 text-slate-400"
                            : week.status === "current"
                              ? `${getPhaseBadgeColor(week.phase)} shadow-[0_0_12px_rgba(99,102,241,0.3)]`
                              : "bg-white/4 text-slate-600"
                        }`}
                      >
                        {getPhaseLabel(week.phase)}
                      </div>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        week.status === "completed" ? "bg-white/40"
                        : week.status === "current" ? "bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                        : "bg-white/10"
                      }`} />
                      <span className="text-[8px] font-bold text-slate-600">W{week.week}</span>
                    </div>
                  ))}
                </div>

                {/* AFI bar chart — one bar per session */}
                {macrocycle.fatigueSnapshots.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Fatigue per Session
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        getAFIBand(macrocycle.accumulatedFatigueIndex) === "critical" ? "text-red-400"
                        : getAFIBand(macrocycle.accumulatedFatigueIndex) === "overloaded" ? "text-orange-400"
                        : getAFIBand(macrocycle.accumulatedFatigueIndex) === "loaded" ? "text-yellow-400"
                        : "text-emerald-400"
                      }`}>
                        AFI {macrocycle.accumulatedFatigueIndex.toFixed(1)} · {getAFIBand(macrocycle.accumulatedFatigueIndex)}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {macrocycle.fatigueSnapshots.map((snap, i) => {
                        const maxContrib = 8; // rawAFIContribution max
                        const pct = Math.max(8, (Math.max(0, snap.rawAFIContribution) / maxContrib) * 100);
                        const band = getAFIBand(snap.rawAFIContribution);
                        const barColor =
                          band === "critical" ? "bg-red-500/70"
                          : band === "overloaded" ? "bg-orange-400/70"
                          : band === "loaded" ? "bg-yellow-400/70"
                          : snap.rawAFIContribution < 0 ? "bg-emerald-400/70"
                          : "bg-indigo-400/70";
                        return (
                          <div
                            key={i}
                            title={`Session ${i + 1}: AFI contribution ${snap.rawAFIContribution > 0 ? "+" : ""}${snap.rawAFIContribution}`}
                            className={`flex-1 rounded-t-sm transition-all ${barColor}`}
                            style={{ height: `${pct}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-1 flex justify-between text-[8px] text-slate-600">
                      <span>Session 1</span>
                      <span>Session {macrocycle.fatigueSnapshots.length}</span>
                    </div>
                  </div>
                )}

                {macrocycle.fatigueSnapshots.length === 0 && (
                  <p className="mt-4 text-xs text-slate-500">
                    Complete your first session and rate it to start tracking fatigue across this block.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Adaptive Engine Status ────────────────────────────────────── */}
          {adaptiveProfile && adaptiveProfile.totalFeedbackSubmissions > 0 && adaptiveAdjustments && (
            <section className="mb-6 overflow-hidden rounded-[1.8rem] border border-purple-900/30 bg-[linear-gradient(135deg,rgba(88,28,135,0.1),rgba(15,23,42,0.7))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="border-b border-white/6 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-400">Adaptive Engine</p>
                  <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                    {adaptiveProfile.totalFeedbackSubmissions} sessions calibrated
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">
                  {adaptiveAdjustments.isRecoverySession ? "Recovery Mode Active" : "Calibrated & Running"}
                </p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Volume", value: `${Math.round(adaptiveAdjustments.volumeModifier * 100)}%`, positive: adaptiveAdjustments.volumeModifier >= 1 },
                    { label: "Reps", value: `${Math.round(adaptiveAdjustments.repModifier * 100)}%`, positive: adaptiveAdjustments.repModifier >= 1 },
                    { label: "Rest", value: `${Math.round(adaptiveAdjustments.restModifier * 100)}%`, positive: adaptiveAdjustments.restModifier <= 1 },
                  ].map(({ label, value, positive }) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-slate-900/60 px-3 py-3 text-center">
                      <p className={`text-xl font-black ${positive ? "text-emerald-300" : "text-orange-300"}`}>{value}</p>
                      <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                {adaptiveAdjustments.excludedMuscleGroups.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {adaptiveAdjustments.excludedMuscleGroups.map((g) => (
                      <span key={g} className="rounded-full border border-red-900/40 bg-red-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-300">
                        {g} — resting
                      </span>
                    ))}
                  </div>
                )}
                {adaptiveAdjustments.deprioritizedGroups.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {adaptiveAdjustments.deprioritizedGroups.map((g) => (
                      <span key={g} className="rounded-full border border-orange-900/40 bg-orange-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-orange-300">
                        {g} — light
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] leading-relaxed text-slate-400 italic">
                  &ldquo;{adaptiveAdjustments.intensityNote}&rdquo;
                </p>
              </div>
            </section>
          )}

          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-violet-300">Performance Trends</p>
                <h3 className="mt-1 text-xl font-black text-white">Session Signals</h3>
              </div>
              <div className="rounded-full border border-violet-400/14 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
                Local only
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <TrendCard
                eyebrow="Workout Score"
                title="Workout Score Trend"
                pill="Last 6"
                series={trendData.workoutScoreTrend}
                accentTextClass="text-blue-300"
                barColorClass="from-blue-400 via-cyan-300 to-blue-500"
                footer="Tracks recent scored sessions without changing your scoring model."
                projection={workoutScoreProjection}
                glow="#60a5fa"
              />

              <TrendCard
                eyebrow="Form Quality"
                title="Form Score Trend"
                pill="Last 6"
                series={trendData.formScoreTrend}
                accentTextClass="text-emerald-300"
                barColorClass="from-emerald-400 via-lime-300 to-emerald-500"
                projection={formScoreProjection}
                glow="#34d399"
                footer={
                  trendData.repQuality.available
                    ? `Rep quality estimated from ${trendData.repQuality.sourceSessions} saved session${
                        trendData.repQuality.sourceSessions === 1 ? "" : "s"
                      }.`
                    : trendData.repQuality.emptyMessage
                }
              >
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Clean</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {trendData.repQuality.available ? trendData.repQuality.cleanReps : "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Needs Work</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {trendData.repQuality.available ? trendData.repQuality.needsWorkReps : "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Clean Rate</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {trendData.repQuality.cleanRate !== null ? `${trendData.repQuality.cleanRate}%` : "--"}
                    </p>
                  </div>
                </div>
              </TrendCard>

              <TrendCard
                eyebrow="XP Output"
                title="XP Progress"
                pill="Recent"
                series={trendData.xpTrend}
                accentTextClass="text-fuchsia-300"
                barColorClass="from-fuchsia-400 via-violet-300 to-pink-500"
                footer="Shows how much XP your recent sessions are contributing."
                projection={xpProjection}
              />

              <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Weekly Plan</p>
                    <h3 className="mt-2 text-lg font-black text-white">Weekly Plan Completion</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                    {trendData.weeklyPlanCompletion.available ? "7 Day" : "Waiting"}
                  </div>
                </div>
                {trendData.weeklyPlanCompletion.available ? (
                  <>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-3xl font-black text-white">
                        {trendData.weeklyPlanCompletion.completedCount}
                        <span className="text-base text-slate-400">/{trendData.weeklyPlanCompletion.totalCount}</span>
                      </p>
                      <p className="text-sm font-semibold text-slate-300">
                        {trendData.weeklyPlanCompletion.percent}% complete
                      </p>
                    </div>
                    <ProgressBar
                      percent={trendData.weeklyPlanCompletion.percent}
                      fillClassName="bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-500"
                    />
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                      Today is <span className="font-black text-white">{trendData.weeklyPlanCompletion.todayLabel}</span>. Keep checking off plan days to tighten weekly consistency.
                    </p>
                  </>
                ) : (
                  <EmptyTrendState message="Generate a weekly plan to unlock completion tracking." />
                )}
              </div>

              <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Consistency</p>
                    <h3 className="mt-2 text-lg font-black text-white">Consistency / Streak</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                    {trendData.consistency.streakCount} day streak
                  </div>
                </div>
                {trendData.consistency.available ? (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Active Days</p>
                        <p className="mt-1 text-lg font-black text-white">{trendData.consistency.activeDaysLast7}/7</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sessions 7D</p>
                        <p className="mt-1 text-lg font-black text-white">{trendData.consistency.sessionsLast7}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sessions 14D</p>
                        <p className="mt-1 text-lg font-black text-white">{trendData.consistency.sessionsLast14}</p>
                      </div>
                    </div>
                    <SparklineRow
                      points={trendData.consistency.recentDayBars}
                      activeClass="bg-gradient-to-t from-cyan-500 to-blue-400"
                    />
                    <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Consistency Score</p>
                        <p className="text-sm font-black text-white">{consistencyScore}%</p>
                      </div>
                      <ProgressBar
                        percent={consistencyScore}
                        fillClassName="bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-500"
                      />
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-slate-400">
                      Daily activity bars show how often you trained across the last week.
                    </p>
                  </>
                ) : (
                  <EmptyTrendState message={trendData.consistency.emptyMessage} />
                )}
              </div>

              {trendData.bodyMetrics.hasProfile ? (
                <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-300">Body Profile</p>
                      <h3 className="mt-2 text-lg font-black text-white">Body Metrics Summary</h3>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                      {trendData.bodyMetrics.completionPercent}% filled
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">BMI</p>
                      <p className="mt-1 text-lg font-black text-white">{trendData.bodyMetrics.bmi ?? "--"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Weight Goal</p>
                      <p className="mt-1 text-sm font-black text-white">{trendData.bodyMetrics.weightDeltaLabel}</p>
                    </div>
                  </div>
                  <ProgressBar
                    percent={trendData.bodyMetrics.completionPercent}
                    fillClassName="bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-500"
                  />
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{trendData.bodyMetrics.summary}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mb-6 rounded-[1.75rem] border border-cyan-400/14 bg-[linear-gradient(135deg,rgba(8,47,73,0.52),rgba(2,6,23,0.92))] p-5 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
            <FloatingCoachAvatar
              selectedAvatar={selectedAvatar}
              mood={progressCoachState.mood}
              message={coachInsight.message}
              position="inline"
              compact
              emphasis="standard"
            />
            <div className="mt-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300">Coach Insight</p>
                <h3 className="mt-2 text-xl font-black text-white">{coachInsight.title}</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${coachInsightTone}`}>
                {coachInsight.priority}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{coachInsight.message}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Suggested Action</p>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{coachInsight.suggestedAction}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Reason</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{coachInsight.reason}</p>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Training Adjustment</p>
                <h3 className="mt-2 text-lg font-black text-white">{difficultyAdjustment.title}</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${difficultyTone}`}>
                {difficultyAdjustment.direction.replace("_", " ")}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{difficultyAdjustment.message}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Adjustment</p>
                <p className="mt-1 text-sm font-semibold text-fuchsia-100">{difficultyAdjustment.adjustmentLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Reason</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{difficultyAdjustment.reason}</p>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Recovery & Consistency</p>
                <h3 className="mt-2 text-lg font-black text-white">Momentum Guardrails</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${difficultyTone}`}>
                {recoveryFocusLabel}
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">7 Day Activity</p>
                <p className="mt-1 text-xl font-black text-white">
                  {trendData.consistency.available ? `${trendData.consistency.activeDaysLast7}/7 days` : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Current Streak</p>
                <p className="mt-1 text-xl font-black text-white">{trendData.consistency.streakCount} days</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Next Focus</p>
                <p className="mt-1 text-sm font-semibold text-white">{difficultyAdjustment.adjustmentLabel}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              {difficultyAdjustment.direction === "recovery"
                ? "Recent load looks heavy. A lighter day protects consistency better than forcing intensity."
                : difficultyAdjustment.direction === "form_focus"
                  ? "Keep intensity stable and spend the next session cleaning up tempo and positioning."
                  : trendData.workoutScoreTrend.delta !== null && trendData.workoutScoreTrend.delta > 0
                    ? "Recent scores are trending in the right direction. Build on that with small, repeatable wins."
                    : "Your best long-term move is stacking another clean session instead of chasing a spike day."}
            </p>
          </section>

          <section className="mb-6 rounded-[1.8rem] border border-blue-400/12 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Body Metrics</p>
                <h3 className="mt-1 text-xl font-black text-white">Manual Profile</h3>
              </div>
              <div className="rounded-full border border-blue-400/14 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                {bodyProfile?.lastUpdated ? "Saved" : "Optional"}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Current Weight</p>
                  <MetricDeltaPill delta={weightTrend.delta} suffix=" lb" />
                </div>
                <p className="mt-1 text-xl font-black text-white">{bodyProfile?.weightLbs ? `${bodyProfile.weightLbs} lb` : "--"}</p>
                <MetricSparkline points={weightTrend.points} stroke="#60a5fa" fill="#60a5fa" />
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Goal Weight</p>
                <p className="mt-1 text-xl font-black text-white">{bodyProfile?.goalWeightLbs ? `${bodyProfile.goalWeightLbs} lb` : "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">BMI</p>
                  <MetricDeltaPill delta={bmiTrend.delta} />
                </div>
                <p className="mt-1 text-xl font-black text-white">{bmi ?? "--"}</p>
                <MetricSparkline points={bmiTrend.points} stroke="#34d399" fill="#34d399" />
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">BMI Category</p>
                <p className="mt-1 text-base font-black text-white">{bmiCategory}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{bodyProfileSummary}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              BMI is a general fitness screening metric only and is not a medical diagnosis.
            </p>
          </section>

          <section className="mb-6 rounded-[1.8rem] border border-emerald-400/12 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-300">Achievements</p>
                <h3 className="mt-1 text-xl font-black text-white">Badges</h3>
              </div>
              <div className="rounded-full border border-emerald-400/14 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                {unlockedBadgeCount}/{badges.length} unlocked
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              {motivationalLine}
            </p>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-[1.5rem] border p-4 shadow-[0_18px_48px_rgba(15,23,42,0.2)] transition ${
                    badge.unlocked
                      ? "border-emerald-300/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(15,23,42,0.72))] shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                      : "border-slate-700/80 bg-slate-950/75"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xl ${
                        badge.unlocked
                          ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
                          : "border-slate-700/70 bg-slate-900/90 text-slate-300"
                      }`}
                    >
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-black ${badge.unlocked ? "text-white" : "text-slate-200"}`}>
                        {badge.title}
                      </p>
                      <p className={`mt-1 text-xs leading-relaxed ${badge.unlocked ? "text-emerald-100/80" : "text-slate-400"}`}>
                        {badge.description}
                      </p>
                      {!badge.unlocked ? (
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                          Locked
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {nextBadge ? (
                <div className="rounded-[1.5rem] border border-blue-400/16 bg-gradient-to-br from-blue-500/10 via-slate-950/70 to-fuchsia-500/10 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Next Badge</p>
                  <div className="mt-4 flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/18 bg-slate-900/80 text-2xl text-slate-200">
                      {nextBadge.icon}
                    </div>
                    <div>
                      <p className="text-base font-black text-white">{nextBadge.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{nextBadge.description}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-slate-400">
                    Keep stacking sessions and scores to unlock your next milestone.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mb-6 rounded-[1.8rem] border border-blue-400/12 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Weekly Plan</p>
                <h3 className="mt-1 text-xl font-black text-white">7-Day Training Flow</h3>
              </div>
              <div className="rounded-full border border-blue-400/14 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                {weeklyPlan ? `${completedWeeklyDays}/7 complete` : "Not generated"}
              </div>
            </div>
            {weeklyPlan ? (
              <>
                {weeklyPlan.splitName && (
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-purple-400">
                    {weeklyPlan.splitName}{weeklyPlan.isDeloadWeek ? " · Deload Week" : ""}
                  </p>
                )}
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {weeklyPlan.days.map((day) => {
                    const isToday = day.dayLabel === todayPlanLabel;
                    const isRest = day.isRestDay;
                    const splitLabel = day.splitType
                      ? {
                          push: "Push", pull: "Pull", legs: "Legs", full_body: "Full Body",
                          conditioning: "Circuit", core_mobility: "Mobility",
                          recovery: "Recovery", rest: "Rest",
                        }[day.splitType]
                      : null;
                    const splitColor = day.splitType
                      ? {
                          push: "border-blue-900/40 bg-blue-950/30 text-blue-300",
                          pull: "border-fuchsia-900/40 bg-fuchsia-950/30 text-fuchsia-300",
                          legs: "border-orange-900/40 bg-orange-950/30 text-orange-300",
                          full_body: "border-purple-900/40 bg-purple-950/30 text-purple-300",
                          conditioning: "border-yellow-900/40 bg-yellow-950/30 text-yellow-300",
                          core_mobility: "border-teal-900/40 bg-teal-950/30 text-teal-300",
                          recovery: "border-emerald-900/40 bg-emerald-950/30 text-emerald-300",
                          rest: "border-slate-700/40 bg-slate-900/40 text-slate-500",
                        }[day.splitType]
                      : "border-white/8 bg-white/4 text-slate-400";

                    return (
                      <div
                        key={day.id}
                        className={`rounded-[1.4rem] border p-4 ${
                          day.completed
                            ? "border-emerald-400/18 bg-emerald-500/10"
                            : isToday
                              ? "border-blue-400/24 bg-blue-950/30 shadow-[0_0_24px_rgba(59,130,246,0.12)]"
                              : isRest
                                ? "border-white/5 bg-slate-950/40 opacity-60"
                                : "border-white/8 bg-slate-950/55"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-black text-white">{day.dayLabel}</p>
                            {splitLabel && (
                              <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${splitColor}`}>
                                {splitLabel}
                              </span>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                            day.completed ? "text-emerald-300" : isToday ? "text-blue-300" : "text-slate-500"
                          }`}>
                            {day.completed ? "✓ Done" : isToday ? "Today" : isRest ? "Rest" : `${day.durationMinutes}m`}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-200">{day.focus}</p>

                        {!isRest && day.workoutConfig && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {day.workoutConfig.muscleGroups.slice(0, 3).map((g) => (
                              <span key={g} className="rounded-full border border-white/8 bg-white/4 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        {isToday && !day.completed && !isRest && day.workoutConfig && onStartPlanDay && (
                          <button
                            onClick={() => onStartPlanDay(day.workoutConfig!)}
                            className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_16px_rgba(99,102,241,0.3)] transition hover:brightness-110 active:scale-95"
                          >
                            Start Today’s Session →
                          </button>
                        )}

                        {!isToday && !day.completed && !isRest && day.workoutConfig && onStartPlanDay && (
                          <button
                            onClick={() => onStartPlanDay(day.workoutConfig!)}
                            className="mt-3 w-full rounded-xl border border-white/8 bg-white/4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-white/16 hover:text-slate-200 active:scale-95"
                          >
                            Start This Day
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {completedWeeklyDays === 0
                    ? "Start your first planned day to build weekly consistency."
                    : `You’ve completed ${completedWeeklyDays} planned day${completedWeeklyDays === 1 ? "" : "s"} this week. Keep the streak moving.`}
                </p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-slate-300">
                Generate a weekly plan from the home screen to turn one-off workouts into a full 7-day rhythm.
              </p>
            )}
          </section>

          <div className="mb-8 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] xl:gap-6">
          <section className="mb-8 xl:mb-0">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Recent Logs</p>
                <h3 className="mt-1 text-xl font-black text-white">Workout History</h3>
              </div>
              <div className="rounded-full border border-fuchsia-400/14 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">
                {recentWorkoutsToDisplay.length} shown
              </div>
            </div>

            {recentWorkoutsToDisplay.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center text-xs text-slate-500">
                No workout history yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkoutsToDisplay.map((session) => {
                  const isExpanded = expandedSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-slate-950/60 shadow-[0_18px_48px_rgba(15,23,42,0.26)] transition hover:border-purple-500/25"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />

                      {/* Row header — toggles expansion */}
                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                            {session.completedAt}
                          </p>
                          <h4 className="mt-0.5 text-sm font-black text-slate-100">
                            {session.goal} <span className="text-fuchsia-300">• {session.level}</span>
                          </h4>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                            {session.equipment} · {session.actualSessionMinutes}m · {session.estimatedReps} reps
                          </p>
                        </div>
                        {session.difficultyFeedback ? (
                          <FeedbackBadge feedback={session.difficultyFeedback} />
                        ) : null}
                        <span className={`text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                          ▾
                        </span>
                      </button>

                      {/* Expanded drill-down */}
                      {isExpanded ? (
                        <div className="border-t border-white/6 px-4 pb-4 pt-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "Score", value: session.workoutScore ?? "--", color: "text-blue-300" },
                              { label: "Form", value: session.formScore ?? "--", color: "text-emerald-300" },
                              { label: "XP", value: session.xpEarned ?? "--", color: "text-fuchsia-300" },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2.5 text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
                                <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                          {session.coachNote ? (
                            <p className="mt-3 rounded-xl border border-white/8 bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-300">
                              <span className="font-black text-violet-300">Coach note: </span>{session.coachNote}
                            </p>
                          ) : null}
                          <button
                            onClick={() => onViewWorkoutDetail(session)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200 transition hover:bg-fuchsia-500/16"
                          >
                            View Full Detail →
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-8 rounded-[1.7rem] border border-blue-400/14 bg-gradient-to-r from-blue-500/10 via-slate-950/30 to-fuchsia-500/10 p-5 text-left xl:mb-0 xl:h-fit">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Camera Form Correction Roadmap</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Future builds can connect live pose detection to session scoring, rep counting, and real-time feedback while staying local on the device.
            </p>
          </section>
          </div>

          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <button onClick={onStartAnotherWorkout} className={primaryButton}>Start Another Workout</button>
            <button onClick={onReturnHome} className={secondaryButton}>Return Home</button>
          </div>
        </div>
      </div>
    </main>
  );
}
