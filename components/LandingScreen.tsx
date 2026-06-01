import { Coach3D } from "@/components/Coach3D";
import { getAvatarLabel, getAvatarRole } from "@/lib/avatarAssets";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import { deriveProgressTrends } from "@/lib/progressTrends";
import { todayString, yesterdayString } from "@/lib/time";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import { useMemo } from "react";
import type { BodyProfile, CoachAvatar, TraineeStats, WeeklyPlan, WorkoutSummaryData } from "@/types";

function buildGreeting(
  userStats: TraineeStats,
  latestWorkoutSummary: WorkoutSummaryData | null | undefined,
  isFirstSession: boolean
) {
  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isFirstSession) {
    return {
      timeLabel: "Welcome",
      headline: "AI-guided coaching, built for you.",
      sub: "Adaptive plans, voice coaching, and camera-based rep counting — all private, on-device.",
      badge: null,
      badgeColor: "",
    };
  }

  const today = todayString();
  const yesterday = yesterdayString();
  const last = userStats.lastWorkoutDate;
  const daysSince = last
    ? Math.round((Date.now() - new Date(last + "T12:00:00").getTime()) / 86400000)
    : null;
  const trainedToday = last === today;
  const trainedYesterday = last === yesterday;

  if (trainedToday) {
    return {
      timeLabel: timeOfDay,
      headline:
        userStats.streak > 1
          ? `Day ${userStats.streak} streak — great session today.`
          : "Great session today.",
      sub: latestWorkoutSummary
        ? `${latestWorkoutSummary.goal} · ${latestWorkoutSummary.actualSessionMinutes} min · ${latestWorkoutSummary.estimatedReps} reps`
        : "Rest up and come back stronger tomorrow.",
      badge: "Done today",
      badgeColor: "border-emerald-400/24 bg-emerald-500/12 text-emerald-200",
    };
  }

  if (trainedYesterday && userStats.streak > 0) {
    return {
      timeLabel: timeOfDay,
      headline: `Day ${userStats.streak} streak — don't break it.`,
      sub: latestWorkoutSummary
        ? `Last: ${latestWorkoutSummary.goal} · ${latestWorkoutSummary.actualSessionMinutes} min · ${latestWorkoutSummary.estimatedReps} reps`
        : `${userStats.workoutsCompleted} workouts · ${userStats.totalMinutes} min total`,
      badge: `${userStats.streak} day streak`,
      badgeColor: "border-fuchsia-400/24 bg-fuchsia-500/12 text-fuchsia-200",
    };
  }

  if (daysSince !== null && daysSince >= 5) {
    return {
      timeLabel: timeOfDay,
      headline: "Welcome back — let's rebuild.",
      sub: `Last trained ${daysSince} days ago. Every comeback starts with one rep.`,
      badge: null,
      badgeColor: "",
    };
  }

  if (daysSince !== null && daysSince >= 2) {
    return {
      timeLabel: timeOfDay,
      headline: "Time to train.",
      sub: latestWorkoutSummary
        ? `Last: ${latestWorkoutSummary.goal} · ${daysSince} days ago`
        : `${userStats.workoutsCompleted} sessions complete · keep going.`,
      badge: daysSince >= 3 ? `${daysSince} days off` : null,
      badgeColor: "border-amber-400/24 bg-amber-500/12 text-amber-200",
    };
  }

  return {
    timeLabel: timeOfDay,
    headline: `${userStats.workoutsCompleted} session${userStats.workoutsCompleted !== 1 ? "s" : ""} in. Keep building.`,
    sub: `${userStats.totalMinutes} min trained${userStats.streak > 0 ? ` · ${userStats.streak} day streak` : ""}`,
    badge: null,
    badgeColor: "",
  };
}

type LandingScreenProps = {
  userStats: TraineeStats;
  hasResumeSession: boolean;
  onResumeWorkout: () => void;
  onStartWorkout: () => void;
  onViewProgress: () => void;
  onOpenCameraSandbox: () => void;
  onOpenSettings: () => void;
  weeklyPlan?: WeeklyPlan | null;
  bodyProfile?: BodyProfile | null;
  workoutHistory: WorkoutSummaryData[];
  latestWorkoutSummary?: WorkoutSummaryData | null;
  onGenerateWeeklyPlan: () => void;
  onStartTodaysWorkout: () => void;
  selectedAvatar: CoachAvatar;
  primaryButton: string;
  secondaryButton: string;
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[1.4rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/22 via-indigo-500/18 to-fuchsia-500/22 shadow-[0_0_28px_rgba(99,102,241,0.24)] ${compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-base"}`}
    >
      <div className="absolute inset-1 rounded-[1.1rem] bg-slate-950/70" />
      <div className="absolute inset-0 rounded-[1.4rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
      <div className="relative flex items-center gap-0.5 font-black tracking-tight text-white">
        <span>G</span>
        <span className="text-blue-300">T</span>
      </div>
    </div>
  );
}

function DashboardStat({
  icon,
  value,
  label,
  accentClass,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/65 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${accentClass}`}>
          {icon}
        </div>
        <div className={`h-2 w-2 rounded-full ${value === 0 ? "bg-slate-700" : accentClass.replace("text-", "bg-")}`} />
      </div>
      <p className={`text-2xl font-black tracking-tight ${value === 0 ? "text-slate-600" : accentClass}`}>
        {value === 0 ? "—" : value}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
    </div>
  );
}

function SecondaryAction({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[1.35rem] border border-white/8 bg-slate-950/60 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-blue-400/18 hover:bg-slate-900/80 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
            {icon}
          </div>
        ) : null}
        <div>
          <p className="text-sm font-black text-slate-100">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-slate-400">
        →
      </div>
    </button>
  );
}

export function LandingScreen({
  userStats,
  hasResumeSession,
  onResumeWorkout,
  onStartWorkout,
  onViewProgress,
  onOpenCameraSandbox,
  onOpenSettings,
  weeklyPlan,
  bodyProfile,
  workoutHistory,
  latestWorkoutSummary,
  onGenerateWeeklyPlan,
  onStartTodaysWorkout,
  selectedAvatar,
}: LandingScreenProps) {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const coachName = getAvatarLabel(selectedAvatar);
  const coachRole = getAvatarRole(selectedAvatar);
  const todayPlan = weeklyPlan?.days.find((day) => day.dayLabel === getTodayWeeklyPlanLabel()) ?? weeklyPlan?.days[0] ?? null;
  const completedWeeklyDays = weeklyPlan?.days.filter((day) => day.completed).length ?? 0;
  const progressTrends = useMemo(
    () =>
      deriveProgressTrends({
        workoutHistory,
        weeklyPlan,
        bodyProfile,
        userStats,
      }),
    [bodyProfile, userStats, weeklyPlan, workoutHistory]
  );
  const coachRecommendation = useMemo(
    () =>
      getCoachAdaptationRecommendation({
        bodyProfile,
        weeklyPlan,
        workoutHistory,
        latestWorkoutSummary,
        userStats,
        progressTrends,
      }),
    [bodyProfile, latestWorkoutSummary, progressTrends, userStats, weeklyPlan, workoutHistory]
  );
  const priorityTone =
    coachRecommendation.priority === "high"
      ? "border-amber-400/18 bg-amber-500/10 text-amber-200"
      : coachRecommendation.priority === "medium"
        ? "border-blue-400/18 bg-blue-500/10 text-blue-200"
        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";

  const isFirstSession =
    userStats.workoutsCompleted === 0 &&
    userStats.streak === 0 &&
    userStats.totalMinutes === 0;

  const greeting = useMemo(
    () => buildGreeting(userStats, latestWorkoutSummary, isFirstSession),
    [userStats, latestWorkoutSummary, isFirstSession]
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 sm:pt-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:rounded-[2.5rem] lg:p-8 xl:p-9">

          {/* ── Header ── */}
          <header className="mb-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <BrandMark compact />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">AI Home Fitness MVP</p>
                <h1 className="mt-1 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  GymTwin AI
                </h1>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.14)]">
                Pro
              </div>
            </div>

            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.24),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_34%)]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between xl:grid xl:grid-cols-[minmax(0,1.2fr)_320px] xl:gap-8">
                <div className="max-w-full sm:max-w-[56%] lg:max-w-[58%] xl:max-w-none xl:pr-6">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">
                      {greeting.timeLabel}
                    </p>
                    {greeting.badge && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${greeting.badgeColor}`}>
                        {greeting.badge}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white lg:text-[2.8rem]">
                    {greeting.headline}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400 lg:max-w-xl lg:text-[15px]">
                    {greeting.sub}
                  </p>

                  {/* First-session feature bullets — replaced by last-workout card for returning users */}
                  {isFirstSession ? (
                    <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2">
                      {[
                        "Camera coach for squats, push-ups, and planks",
                        "Voice commands for hands-free control",
                        "Scores, XP, and badges to track progress",
                        "Resume-friendly sessions built for daily training",
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-xs font-medium leading-relaxed text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : latestWorkoutSummary ? (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-sm">
                      <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5 text-center">
                        <p className="text-lg font-black text-blue-300">{userStats.workoutsCompleted}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Sessions</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5 text-center">
                        <p className="text-lg font-black text-fuchsia-300">{userStats.streak}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Streak</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5 text-center">
                        <p className="text-lg font-black text-indigo-300">{userStats.totalMinutes}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Minutes</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Coach card */}
                <div className="relative mx-auto w-full max-w-[14rem] shrink-0 pt-1 sm:mx-0 sm:w-[12rem] lg:w-[15rem] xl:w-full xl:max-w-[20rem]">
                  <div className="absolute inset-2 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-fuchsia-500/30 blur-3xl" />
                  <div className="relative">
                    <Coach3D
                      selectedAvatar={selectedAvatar}
                      animationHint="idle"
                      previewFrame="full_body"
                      lightingMode="neutral"
                    />
                    <div className="mt-2 px-1">
                      <p className="text-base font-black tracking-tight text-white">{coachName}</p>
                      <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-300">{coachRole}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </header>

          {/* ── Primary CTA — immediately after hero ── */}
          <section className="mb-5 space-y-3">
            {hasResumeSession ? (
              <button
                onClick={onResumeWorkout}
                className="flex w-full items-center justify-between rounded-[1.65rem] border border-amber-400/24 bg-gradient-to-r from-amber-500/20 to-orange-500/18 px-5 py-4 text-left transition hover:brightness-105 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-lg">
                    ▶
                  </div>
                  <div>
                    <p className="text-base font-black text-white">Resume Workout</p>
                    <p className="text-xs text-amber-100/80">Jump back into your active session</p>
                  </div>
                </div>
                <div className="text-xl text-white/70">→</div>
              </button>
            ) : null}

            <button
              onClick={onStartWorkout}
              className="flex w-full items-center justify-between rounded-[1.75rem] border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-5 py-5 text-left shadow-[0_18px_40px_rgba(99,102,241,0.3)] transition hover:brightness-105 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg">
                  ▶
                </div>
                <div>
                  <p className="text-base font-black text-white">
                    {hasResumeSession ? "Start New Workout" : "Start Workout"}
                  </p>
                  <p className="text-xs text-blue-100/80">Launch a fresh guided GymTwin session</p>
                </div>
              </div>
              <div className="text-xl text-white/80">→</div>
            </button>
          </section>

          {/* ── Today's Plan ── */}
          <section className="mb-5 rounded-[1.8rem] border border-emerald-400/14 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">Today&apos;s Plan</p>
                <h3 className="mt-1 truncate text-lg font-black text-white">
                  {todayPlan ? todayPlan.focus : "No plan yet"}
                </h3>
                {todayPlan ? (
                  <p className="mt-1 text-xs text-slate-400">
                    {todayPlan.dayLabel} · {todayPlan.recommendedWorkout} · {todayPlan.durationMinutes} min
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Generate a 7-day plan to give your week structure.
                  </p>
                )}
              </div>
              <div className="shrink-0 rounded-full border border-emerald-400/14 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                {weeklyPlan ? `${completedWeeklyDays}/7` : "No plan"}
              </div>
            </div>
            <button
              onClick={weeklyPlan ? onStartTodaysWorkout : onGenerateWeeklyPlan}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-slate-100 transition hover:border-blue-400/30 hover:bg-slate-800"
            >
              {weeklyPlan ? "Start Today's Workout" : "Generate Weekly Plan"}
            </button>
          </section>

          {/* ── Stats ── */}
          <section className="mb-5">
            {isFirstSession ? (
              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-2xl">🏋️</p>
                <p className="mt-3 text-sm font-black text-white">Your journey starts here</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Complete your first session to start tracking workouts, streaks, and minutes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 lg:gap-4">
                <DashboardStat
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="6" width="3" height="4" rx="1" fill="currentColor" />
                      <rect x="12" y="6" width="3" height="4" rx="1" fill="currentColor" />
                      <rect x="4" y="5" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
                      <rect x="6" y="3" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
                      <rect x="6" y="11" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
                    </svg>
                  }
                  value={userStats.workoutsCompleted}
                  label="Workouts"
                  accentClass="text-blue-400"
                />
                <DashboardStat
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L9.8 5.8L15 6.3L11.2 9.7L12.4 15L8 12.3L3.6 15L4.8 9.7L1 6.3L6.2 5.8L8 1Z" fill="currentColor" />
                    </svg>
                  }
                  value={userStats.streak}
                  label="Streak"
                  accentClass="text-fuchsia-400"
                />
                <DashboardStat
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                  value={userStats.totalMinutes}
                  label="Minutes"
                  accentClass="text-indigo-400"
                />
              </div>
            )}
          </section>

          {/* ── Coach Insight ── */}
          <section className="mb-5 rounded-[1.75rem] border border-cyan-400/14 bg-[linear-gradient(135deg,rgba(8,47,73,0.52),rgba(2,6,23,0.92))] px-5 py-4 text-left shadow-[0_0_28px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Coach Insight</p>
                <p className="mt-2 text-sm font-black text-white">{coachRecommendation.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{coachRecommendation.message}</p>
              </div>
              <div className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${priorityTone}`}>
                {coachRecommendation.priority}
              </div>
            </div>
          </section>

          {/* ── Secondary Actions ── */}
          <section className="mb-6 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <SecondaryAction
              title="View Progress"
              subtitle="Charts, XP, badges, and trends"
              icon={
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1" y="9" width="3" height="5" rx="1" fill="currentColor" opacity="0.7" />
                  <rect x="6" y="5" width="3" height="9" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="11" y="1" width="3" height="13" rx="1" fill="currentColor" />
                </svg>
              }
              onClick={onViewProgress}
            />
            <SecondaryAction
              title="Camera Coach"
              subtitle="Live pose tracking, squats, push-ups, planks"
              icon={
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1" y="3" width="10" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M11 6l3-2v7l-3-2V6Z" fill="currentColor" opacity="0.8" />
                </svg>
              }
              onClick={onOpenCameraSandbox}
            />
          </section>

          {/* ── Bottom Nav ── */}
          <nav className="grid grid-cols-4 gap-2 rounded-[1.6rem] border border-white/8 bg-slate-950/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:mx-auto xl:max-w-3xl">
            <button
              type="button"
              onClick={scrollToTop}
              className="rounded-[1.2rem] border border-blue-400/18 bg-gradient-to-r from-blue-500/18 to-fuchsia-500/12 px-2 py-3 text-center transition hover:border-blue-400/28"
            >
              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-black text-white">
                GT
              </div>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Home</p>
            </button>
            <button
              type="button"
              onClick={onStartWorkout}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <svg className="mx-auto" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="10" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="1" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
              </svg>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">Workouts</p>
            </button>
            <button
              type="button"
              onClick={onViewProgress}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <svg className="mx-auto" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="11" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="7" y="7" width="4" height="10" rx="1" fill="currentColor" opacity="0.8" />
                <rect x="13" y="2" width="4" height="15" rx="1" fill="currentColor" />
              </svg>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">Progress</p>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <svg className="mx-auto" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="2.5" fill="currentColor" />
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              </svg>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">Settings</p>
            </button>
          </nav>

        </div>
      </div>
    </main>
  );
}
