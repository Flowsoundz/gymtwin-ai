import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { FeedbackBadge } from "@/components/ui/FeedbackBadge";
import { StatCard } from "@/components/ui/StatCard";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import { getAvatarCoachLayerState } from "@/lib/avatarCoachLayer";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { calculateBMI, getBMICategory, getBodyProfileSummary } from "@/lib/bodyMetrics";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import { getDifficultyAdjustmentRecommendation } from "@/lib/difficultyAdjustmentEngine";
import { deriveProgressTrends, type TrendPoint, type TrendSeries } from "@/lib/progressTrends";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import { useMemo, type ReactNode } from "react";
import type { AchievementBadge, BodyProfile, CoachAvatar, TraineeStats, WeeklyPlan, WorkoutSummaryData } from "@/types";

type ProgressScreenProps = {
  selectedAvatar?: CoachAvatar;
  badges: AchievementBadge[];
  bodyProfile?: BodyProfile | null;
  weeklyPlan?: WeeklyPlan | null;
  userStats: TraineeStats;
  workoutHistory: WorkoutSummaryData[];
  onStartAnotherWorkout: () => void;
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
      <div className="flex h-24 items-end gap-2">
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

function TrendCard({
  eyebrow,
  title,
  pill,
  series,
  accentTextClass,
  barColorClass,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  pill: string;
  series: TrendSeries;
  accentTextClass: string;
  barColorClass: string;
  footer?: string;
  children?: ReactNode;
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
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Latest</p>
              <p className="mt-1 text-lg font-black text-white">{series.latestValue ?? "--"}</p>
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
          <EmptyTrendState message={series.emptyMessage} />
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
  onStartAnotherWorkout,
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
      ? "border-amber-400/18 bg-amber-500/10 text-amber-200"
      : coachInsight.priority === "medium"
        ? "border-blue-400/18 bg-blue-500/10 text-blue-200"
        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";
  const difficultyTone =
    difficultyAdjustment.direction === "increase"
      ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : difficultyAdjustment.direction === "decrease"
        ? "border-amber-400/18 bg-amber-500/10 text-amber-200"
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

          <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/58 p-5 text-center shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <StatCard value={userStats.workoutsCompleted} label="Workouts" colorClass="text-blue-400" />
            </div>
            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/58 p-5 text-center shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <StatCard value={userStats.streak} label="Day Streak" colorClass="text-fuchsia-400" suffix="🔥" />
            </div>
            <div className="col-span-2 rounded-[1.75rem] border border-white/8 bg-slate-950/58 p-5 text-center shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)] lg:col-span-1">
              <StatCard value={userStats.totalMinutes} label="Real Training Minutes" colorClass="text-indigo-400" />
            </div>
          </section>

          <section className="mb-6 rounded-[1.7rem] border border-blue-400/12 bg-slate-950/58 p-5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Last Workout Date</p>
            <p className="mt-2 text-base font-semibold text-slate-200">
              {userStats.lastWorkoutDate || "No workout completed yet"}
            </p>
          </section>

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
              />

              <TrendCard
                eyebrow="Form Quality"
                title="Form Score Trend"
                pill="Last 6"
                series={trendData.formScoreTrend}
                accentTextClass="text-emerald-300"
                barColorClass="from-emerald-400 via-lime-300 to-emerald-500"
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
              />

              <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-300">Weekly Plan</p>
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
                      fillClassName="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500"
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
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-300">Recovery & Consistency</p>
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
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Current Weight</p>
                <p className="mt-1 text-xl font-black text-white">{bodyProfile?.weightLbs ? `${bodyProfile.weightLbs} lb` : "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Goal Weight</p>
                <p className="mt-1 text-xl font-black text-white">{bodyProfile?.goalWeightLbs ? `${bodyProfile.goalWeightLbs} lb` : "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">BMI</p>
                <p className="mt-1 text-xl font-black text-white">{bmi ?? "--"}</p>
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
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {weeklyPlan.days.map((day) => {
                    const isToday = day.dayLabel === todayPlanLabel;
                    return (
                      <div
                        key={day.id}
                        className={`rounded-[1.4rem] border p-4 ${
                          day.completed
                            ? "border-emerald-400/18 bg-emerald-500/10"
                            : isToday
                              ? "border-blue-400/18 bg-blue-500/10"
                              : "border-white/8 bg-slate-950/55"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-white">{day.dayLabel}</p>
                          <span className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-200">
                            {day.completed ? "Done" : isToday ? "Today" : day.difficulty}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-200">{day.focus}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{day.recommendedWorkout}</p>
                        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          {day.durationMinutes} minutes
                        </p>
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
              <div className="space-y-4">
                {recentWorkoutsToDisplay.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onViewWorkoutDetail(session)}
                    className="relative w-full overflow-hidden rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-4 text-left shadow-[0_18px_48px_rgba(15,23,42,0.26)] transition hover:border-purple-500/35 hover:shadow-[0_22px_55px_rgba(76,29,149,0.18)] active:scale-[0.98]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />
                    {session.difficultyFeedback ? (
                      <div className="absolute right-4 top-4">
                        <FeedbackBadge feedback={session.difficultyFeedback} />
                      </div>
                    ) : null}
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                      {session.completedAt}
                    </p>
                    <h4 className="text-sm font-black text-slate-100">
                      {session.goal} <span className="text-fuchsia-300">• {session.level}</span>
                    </h4>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Tap to inspect session detail</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/6 pt-3 text-xs text-slate-400">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Equipment</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.equipment}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Time</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.actualSessionMinutes}m</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Reps</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.estimatedReps}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Score</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.workoutScore ?? "--"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Form</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.formScore ?? "--"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">XP</p>
                        <p className="mt-1 font-semibold text-slate-200">{session.xpEarned ?? "--"}</p>
                      </div>
                    </div>
                  </button>
                ))}
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
