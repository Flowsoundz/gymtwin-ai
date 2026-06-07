"use client";

import Image from "next/image";
import { OptimizedCoachCanvas } from "@/components/OptimizedCoachCanvas";
import { getAvatarLabel, getAvatarRole } from "@/lib/avatarAssets";
import { getAvatarAsset } from "@/lib/avatarAssets";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import {
  generateNovaDeloadNote,
  getAFIBand,
  getMacrocycleArc,
  getPhaseBadgeColor,
  getPhaseLabel,
} from "@/lib/macrocycleEngine";
import { getAchievementBadges } from "@/lib/achievementEngine";
import { getTopLoggedExercises } from "@/lib/progressiveOverloadEngine";
import { deriveProgressTrends } from "@/lib/progressTrends";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import { useEffect, useMemo, useState } from "react";
import type { AdaptiveProfile, BodyProfile, CoachAvatar, TraineeStats, WeeklyPlan, WeeklyPlanDayConfig, WorkoutSummaryData } from "@/types";
import type { Macrocycle } from "@/types/macrocycle";

const FIRST_SESSION_GREETING = {
  headline: "Your AI coach is ready.",
  sub: "Adaptive plans, voice coaching, and camera form tracking — on-device.",
};

function getDayKey(timestamp: number) {
  return new Date(timestamp).toDateString();
}

type LandingScreenProps = {
  userStats: TraineeStats;
  hasResumeSession: boolean;
  onResumeWorkout: () => void;
  onStartWorkout: () => void;
  onQuickStart?: () => void;
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
  cameraTried?: boolean;
  showSyncBanner?: boolean;
  onOpenAuth?: () => void;
  onDismissSyncBanner?: () => void;
  onViewNutrition: () => void;
  onOpenFlowsoundzRadio: () => void;
  macrocycle?: Macrocycle | null;
  adaptiveProfile?: AdaptiveProfile | null;
  onStartPlanDay?: (config: WeeklyPlanDayConfig) => void;
  primaryButton: string;
  secondaryButton: string;
};

function buildGreeting(
  userStats: TraineeStats,
  latestWorkoutSummary: WorkoutSummaryData | null | undefined,
  isFirstSession: boolean,
  now: number
) {
  const currentDate = new Date(now);
  const hour = currentDate.getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isFirstSession) {
    return FIRST_SESSION_GREETING;
  }

  const today = getDayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toDateString();
  const last = userStats.lastWorkoutDate;
  const daysSince = last ? Math.round((now - new Date(last + "T12:00:00").getTime()) / 86400000) : null;
  const trainedToday = last === today;
  const trainedYesterday = last === yesterday;

  if (trainedToday) {
    return {
      headline: userStats.streak > 1 ? `Day ${userStats.streak} streak.` : "Great session today.",
      sub: latestWorkoutSummary ? `${latestWorkoutSummary.goal} · ${latestWorkoutSummary.actualSessionMinutes}min · ${latestWorkoutSummary.estimatedReps} reps` : "Rest up and come back stronger.",
    };
  }
  if (trainedYesterday && userStats.streak > 0) {
    return { headline: `Day ${userStats.streak} — don't break it.`, sub: `${timeOfDay}. Keep the streak alive.` };
  }
  if (daysSince !== null && daysSince >= 5) {
    return { headline: "Welcome back.", sub: `${daysSince} days off. Every comeback starts with one rep.` };
  }
  return {
    headline: `${userStats.workoutsCompleted} sessions in.`,
    sub: `${userStats.totalMinutes} min trained${userStats.streak > 0 ? ` · ${userStats.streak} day streak` : ""}`,
  };
}

function ChromeProBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-1.5 shadow-[0_0_20px_rgba(196,181,253,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(196,181,253,0.4)] active:scale-95"
    >
      <span className="badge-chrome text-[11px] font-black uppercase tracking-[0.22em]">
        PRO ✦
      </span>
      <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function MegaCTA({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="relative">
      {/* Pulsating outer ring */}
      <span className="cta-pulse-ring absolute inset-0 rounded-2xl border-2 border-violet-500/60" />
      <button
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 py-5 text-center shadow-[0_0_40px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-[1.025] hover:shadow-[0_0_60px_rgba(99,102,241,0.65)] active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center justify-center gap-3 text-lg font-black uppercase tracking-[0.06em] text-white">
          <span className="text-xl">▶</span>
          {label}
        </span>
        {/* Shine sweep */}
        <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  subtitle,
  accentClass,
  accentGlowClass,
  iconShellClass,
  showRadar = false,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accentClass: string;
  accentGlowClass: string;
  iconShellClass: string;
  showRadar?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bento-card group relative flex flex-col items-start gap-3 overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-900/40 p-4 text-left backdrop-blur-md transition hover:border-white/20 hover:bg-slate-900/55"
    >
      <div className={`pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 ${accentGlowClass}`} />
      {showRadar ? (
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-cyan-400/16 bg-cyan-500/6">
          <span className="absolute inset-[18%] rounded-full border border-cyan-400/18 radar-ping" />
          <span className="absolute inset-[36%] rounded-full border border-cyan-400/14 radar-ping-delayed" />
        </div>
      ) : null}
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-xl shadow-[0_10px_24px_rgba(2,6,23,0.35)] ${iconShellClass} ${accentClass}`}>
        {icon}
      </div>
      <div className="relative">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{subtitle}</p>
      </div>
      <div className="relative ml-auto text-slate-600 transition group-hover:text-slate-200">→</div>
    </button>
  );
}

function NeonStatPill({
  value,
  label,
  colorClass,
}: {
  value: string | number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-4">
      <span className={`text-3xl font-black italic tracking-tight ${colorClass}`}>
        {value === 0 ? "—" : value}
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</span>
    </div>
  );
}

type NavTab = "home" | "workouts" | "progress" | "nutrition" | "settings";

export function LandingScreen({
  userStats,
  hasResumeSession,
  onResumeWorkout,
  onStartWorkout,
  onQuickStart,
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
  cameraTried = false,
  showSyncBanner = false,
  onOpenAuth,
  onDismissSyncBanner,
  onViewNutrition,
  onOpenFlowsoundzRadio,
  macrocycle,
  adaptiveProfile,
  onStartPlanDay,
}: LandingScreenProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [heroInteractive, setHeroInteractive] = useState(false);
  const [heroPostureIndex, setHeroPostureIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [hydratedNow, setHydratedNow] = useState<number | null>(null);
  const displayedHeroPostureIndex = heroInteractive ? heroPostureIndex : 0;

  const coachName = getAvatarLabel(selectedAvatar);
  const coachRole = getAvatarRole(selectedAvatar);
  const landingCoachName = hasMounted ? coachName : "Coach";
  const landingCoachRole = hasMounted ? coachRole : "AI Coach";
  const todayPlan = weeklyPlan?.days.find((d) => d.dayLabel === getTodayWeeklyPlanLabel()) ?? weeklyPlan?.days[0] ?? null;
  const completedWeeklyDays = weeklyPlan?.days.filter((d) => d.completed).length ?? 0;
  const weeklyCompletionRatio = weeklyPlan ? completedWeeklyDays / Math.max(weeklyPlan.days.length, 1) : 0;
  const planCircumference = 2 * Math.PI * 22;
  const planRingOffset = planCircumference * (1 - weeklyCompletionRatio);
  const streakAuraClass =
    userStats.streak >= 7
      ? "from-emerald-400/28 via-cyan-400/12 to-emerald-300/22"
      : userStats.streak >= 3
        ? "from-cyan-400/24 via-blue-400/10 to-emerald-400/16"
        : "from-blue-500/24 via-cyan-400/10 to-indigo-400/18";
  const heroAuraDuration = userStats.streak >= 7 ? "2.4s" : userStats.streak >= 3 ? "3.1s" : "4.6s";
  const focusLines = [
    `Ready when you are${bodyProfile?.lastUpdated ? "." : ", Adony."} Let's smash today's block.`,
    `${coachName} focus: ${todayPlan ? todayPlan.focus : "Build your next adaptive plan"}.`,
    weeklyPlan
      ? `${completedWeeklyDays}/7 days complete. Lock in the next session.`
      : "No weekly plan loaded. Generate one and I'll shape the pace.",
  ];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHasMounted(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!heroInteractive) return;

    const intervalId = window.setInterval(() => {
      setHeroPostureIndex((current) => (current + 1) % 3);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [heroInteractive]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHydratedNow(Date.now());
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const progressTrends = useMemo(
    () => deriveProgressTrends({ workoutHistory, weeklyPlan, bodyProfile, userStats }),
    [bodyProfile, userStats, weeklyPlan, workoutHistory]
  );
  const coachRecommendation = useMemo(
    () => getCoachAdaptationRecommendation({ bodyProfile, weeklyPlan, workoutHistory, latestWorkoutSummary, userStats, progressTrends }),
    [bodyProfile, latestWorkoutSummary, progressTrends, userStats, weeklyPlan, workoutHistory]
  );

  const isFirstSession = userStats.workoutsCompleted === 0 && userStats.streak === 0 && userStats.totalMinutes === 0;

  // Macrocycle intelligence
  const macroArc = macrocycle ? getMacrocycleArc(macrocycle) : null;
  const macroAfiBand = macrocycle ? getAFIBand(macrocycle.accumulatedFatigueIndex) : null;
  const isDeloadWeek = macrocycle?.currentPhase === "deload";
  const isHeavyWeek = macrocycle?.currentPhase === "loaded warning";
  const novaDeloadMessage = isDeloadWeek && macrocycle ? generateNovaDeloadNote(macrocycle) : null;
  const greeting = useMemo(() => {
    if (!hasMounted || hydratedNow === null) {
      return isFirstSession
        ? FIRST_SESSION_GREETING
        : {
            headline: `${userStats.workoutsCompleted} sessions in.`,
            sub: `${userStats.totalMinutes} min trained${userStats.streak > 0 ? ` · ${userStats.streak} day streak` : ""}`,
          };
    }
    return buildGreeting(userStats, latestWorkoutSummary, isFirstSession, hydratedNow);
  }, [hasMounted, hydratedNow, isFirstSession, latestWorkoutSummary, userStats]);

  // Progressive overload — last 3 logged exercises
  const topLogged = useMemo(() => getTopLoggedExercises(3), [workoutHistory.length]);
  const badgeSummary = useMemo(() => {
    const all = getAchievementBadges({ userStats, workoutHistory, lastWorkoutSummary: latestWorkoutSummary });
    const unlocked = all.filter((b) => b.unlocked);
    const next = all.find((b) => !b.unlocked) ?? null;
    return { unlocked, total: all.length, next };
  }, [userStats, workoutHistory, latestWorkoutSummary]);
  const handleNavTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "progress")  onViewProgress();
    if (tab === "settings")  onOpenSettings();
    if (tab === "workouts")  onStartWorkout();
    if (tab === "nutrition") onViewNutrition();
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M7 18V12h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "workouts",
      label: "Train",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="16" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="4" y="7" width="12" height="6" rx="2" fill="currentColor" opacity="0.7" />
          <rect x="8" y="4" width="4" height="3" rx="1" fill="currentColor" opacity="0.5" />
        </svg>
      ),
    },
    {
      id: "progress",
      label: "Progress",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="13" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="8" y="8" width="4" height="11" rx="1" fill="currentColor" opacity="0.8" />
          <rect x="15" y="2" width="4" height="17" rx="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "nutrition",
      label: "Fuel",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M7 7v6M7 7C7 5.5 9 5.5 9 7v3H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12.5 5.5v9M12.5 5.5v4l1.5-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3" fill="currentColor" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M15.78 4.22l-1.42 1.42M5.64 14.36l-1.42 1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white antialiased">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-violet-600/12 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 h-72 w-72 rounded-full bg-fuchsia-600/8 blur-[100px]" />
      </div>

      <main className="relative pb-28 pt-6">
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
          {/* ── Header ── */}
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/22 to-fuchsia-500/18 shadow-[0_0_18px_rgba(99,102,241,0.22)]">
                <span className="text-sm font-black text-white">G<span className="text-blue-300">T</span></span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">AI Home Fitness</p>
                <h1 className="text-base font-black italic tracking-tight text-white">GymTwin AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur-xl shadow-[0_12px_32px_rgba(2,6,23,0.28)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/8 via-transparent to-fuchsia-500/8" />
                <div className="relative flex items-center gap-3">
                  <button
                    onClick={showSyncBanner ? onOpenAuth : onOpenSettings}
                    className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-left transition hover:border-white/14 hover:bg-white/[0.05]"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black ${
                      showSyncBanner
                        ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
                    }`}>
                      {showSyncBanner ? "☁" : "✓"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {showSyncBanner ? "Guest Mode" : "Account Ready"}
                      </p>
                      <p className="truncate text-xs text-slate-300">
                        {showSyncBanner ? "Sign in to sync progress and settings." : "Profile, settings, and sync are available."}
                      </p>
                    </div>
                  </button>
                  {showSyncBanner ? (
                    <>
                      <button
                        onClick={onOpenAuth}
                        className="shrink-0 rounded-full border border-blue-400/26 bg-blue-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 transition hover:bg-blue-500/18"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={onDismissSyncBanner}
                        className="shrink-0 text-sm leading-none text-slate-500 transition hover:text-white"
                        aria-label="Dismiss sync prompt"
                      >
                        ×
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <ChromeProBadge />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div
              className="bento-card group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-1 shadow-[0_0_60px_rgba(99,102,241,0.12)] backdrop-blur-xl md:max-h-[720px]"
              onMouseEnter={() => setHeroInteractive(true)}
              onMouseLeave={() => setHeroInteractive(false)}
              onTouchStart={() => setHeroInteractive((current) => !current)}
            >
              {/* Neon glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/8 via-violet-500/5 to-fuchsia-500/8" />
              <div className="relative">
                <div className="relative h-[380px] overflow-hidden rounded-[1.5rem] bg-[#010208] md:h-[min(70vh,640px)]">
                  <div
                    className={`pointer-events-none absolute inset-[8%] z-[1] rounded-[2rem] bg-gradient-to-br blur-3xl hero-aura ${streakAuraClass}`}
                    style={{ animationDuration: heroAuraDuration }}
                  />
                  <OptimizedCoachCanvas height="h-full" surface="hero" />
                  <div className="pointer-events-none absolute inset-x-5 top-5 z-[2] max-w-[18rem] rounded-2xl border border-white/10 bg-slate-950/42 px-4 py-3 backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                      {userStats.streak >= 7 ? "Streak Surge" : `${landingCoachName} Hero View`}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-white ticker-fade">
                      {focusLines[displayedHeroPostureIndex]}
                    </p>
                  </div>
                </div>
                {/* Coach identity overlay */}
                <div className="absolute bottom-0 left-0 right-0 rounded-b-[1.4rem] bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-4 pb-4 pt-8">
                  <p className="text-lg font-black italic text-white">{landingCoachName}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">{landingCoachRole}</p>
                  {/* Live status pill */}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: "coachPulse 2s ease-in-out infinite" }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">AI Coach Ready</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full border border-cyan-400/18 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                      Aura {userStats.streak >= 7 ? "Emerald Surge" : "Neon Blue"}
                    </span>
                    <span>{heroInteractive ? "Engaged" : "Idle"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">

              {/* Deload Week Announcement — takes priority over everything */}
              {isDeloadWeek && novaDeloadMessage && macrocycle && (
                <div className="relative overflow-hidden rounded-[1.8rem] border border-blue-500/30 bg-[linear-gradient(135deg,rgba(30,58,138,0.2),rgba(15,23,42,0.9))] p-5 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-500/40 bg-blue-950/60 text-xs font-black text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.35)]">◈</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-400">Deload Week · Nova</p>
                      <p className="text-sm font-black text-white">This Week We Shift the Target</p>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-3">{novaDeloadMessage}</p>
                </div>
              )}

              {/* Macrocycle Status Strip */}
              {macrocycle && macroArc && !isDeloadWeek && (
                <div className={`rounded-2xl border p-3.5 ${isHeavyWeek ? "border-yellow-900/40 bg-yellow-950/15" : "border-purple-900/30 bg-purple-950/15"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${isHeavyWeek ? "text-yellow-400" : "text-purple-400"}`}>
                        Training Block
                      </p>
                      <p className="text-sm font-black text-white">
                        Week {macrocycle.currentWeek} of {macrocycle.targetWeeks}
                        <span className={`ml-2 text-[10px] font-bold rounded-full border px-2 py-0.5 ${getPhaseBadgeColor(macrocycle.currentPhase)}`}>
                          {getPhaseLabel(macrocycle.currentPhase)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {macroArc.map((w) => (
                        <div
                          key={w.week}
                          className={`rounded-full transition-all ${
                            w.status === "current"
                              ? "h-2.5 w-4 bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]"
                              : w.status === "completed"
                                ? "h-2 w-2 bg-white/35"
                                : "h-2 w-2 bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {macroAfiBand && macroAfiBand !== "fresh" && macroAfiBand !== "building" && (
                    <p className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${macroAfiBand === "critical" || macroAfiBand === "overloaded" ? "text-red-400" : "text-yellow-400"}`}>
                      {macroAfiBand === "critical" ? "⚠ Critical fatigue — deload soon" : macroAfiBand === "overloaded" ? "⚠ High fatigue accumulating" : "◈ Heavy load week — recovery ahead"}
                    </p>
                  )}
                </div>
              )}

              <div className="bento-card rounded-3xl border border-white/8 bg-slate-950/65 p-5 backdrop-blur-md">
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
                  <h2 className="mt-1 text-2xl font-black italic leading-tight tracking-tight text-white lg:text-3xl">
                    {greeting.headline}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{greeting.sub}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <NeonStatPill value={userStats.workoutsCompleted} label="Sessions" colorClass="text-blue-400" />
                  <NeonStatPill value={userStats.streak} label="Streak 🔥" colorClass="text-fuchsia-400" />
                  <NeonStatPill value={userStats.totalMinutes} label="Minutes" colorClass="text-violet-400" />
                </div>

                {/* Badge progress shelf */}
                {!isFirstSession && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {badgeSummary.unlocked.slice(0, 5).map((b) => (
                        <span key={b.id} className="text-base leading-none" title={b.title}>{b.icon}</span>
                      ))}
                      {badgeSummary.unlocked.length === 0 && (
                        <span className="text-sm text-slate-600">No badges yet</span>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      {badgeSummary.next ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Next: <span className="text-slate-400">{badgeSummary.next.icon} {badgeSummary.next.title}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">All badges unlocked!</p>
                      )}
                      <p className="text-[10px] text-slate-700">{badgeSummary.unlocked.length}/{badgeSummary.total} unlocked</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-blue-400/14 bg-blue-500/8 p-5 backdrop-blur-md">
                {weeklyPlan && completedWeeklyDays >= 7 ? (
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <span
                        key={index}
                        className="plan-particle absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.8)]"
                        style={
                          {
                            "--px": `${Math.cos((index / 14) * Math.PI * 2) * (60 + (index % 3) * 18)}px`,
                            "--py": `${Math.sin((index / 14) * Math.PI * 2) * (46 + (index % 4) * 16)}px`,
                            animationDelay: `${index * 40}ms`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400">Today&apos;s Plan</p>
                    <p className="mt-1 truncate text-base font-black text-white">
                      {todayPlan ? todayPlan.focus : "No plan yet"}
                    </p>
                    {todayPlan ? (
                      <>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {todayPlan.dayLabel} · {todayPlan.durationMinutes} min
                        </p>
                        {todayPlan.workoutConfig?.muscleGroups && todayPlan.workoutConfig.muscleGroups.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {todayPlan.workoutConfig.muscleGroups.slice(0, 3).map((g) => (
                              <span key={g} className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        {todayPlan.workoutConfig && onStartPlanDay && !todayPlan.completed && !todayPlan.isRestDay && (
                          <button
                            onClick={() => onStartPlanDay(todayPlan.workoutConfig!)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-300 transition hover:border-blue-500/50 hover:bg-blue-950/60 active:scale-95"
                          >
                            ▶ Start This Session
                          </button>
                        )}
                        {todayPlan.isRestDay && (
                          <span className="mt-1.5 inline-block rounded-full border border-teal-900/40 bg-teal-950/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-400">Rest Day</span>
                        )}
                      </>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: "🔥 30-min Strength" },
                            { label: "🧘 20-min Mobility" },
                            { label: "⚡ Quick Burn" },
                          ].map(({ label }) => (
                            <button
                              key={label}
                              onClick={onStartWorkout}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300 transition hover:border-white/20 hover:text-white"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={onGenerateWeeklyPlan}
                          className="mt-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-md transition-all"
                        >
                          Generate a 7-day plan for your week
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative shrink-0">
                    <svg width="66" height="66" viewBox="0 0 66 66" className="drop-shadow-[0_0_18px_rgba(34,211,238,0.24)]">
                      <circle cx="33" cy="33" r="22" stroke="rgba(148,163,184,0.18)" strokeWidth="6" fill="none" />
                      <circle
                        cx="33"
                        cy="33"
                        r="22"
                        stroke={completedWeeklyDays >= 7 ? "rgba(16,185,129,0.95)" : "rgba(34,211,238,0.95)"}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={planCircumference}
                        strokeDashoffset={planRingOffset}
                        transform="rotate(-90 33 33)"
                        className="hud-ring"
                        style={{ ["--ring-offset" as string]: `${planRingOffset}` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-white">{weeklyPlan ? `${completedWeeklyDays}/7` : "—"}</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-300">
                        {completedWeeklyDays >= 7 ? "Complete" : "Sets"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bento-card rounded-3xl border border-white/8 bg-slate-950/65 p-5 backdrop-blur-md">
                {hasResumeSession && (
                  <button
                    onClick={onResumeWorkout}
                    className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-left transition hover:bg-cyan-500/16 active:scale-[0.99]"
                  >
                    <span className="text-base">▶</span>
                    <div>
                      <p className="text-sm font-black text-cyan-200">Resume Session</p>
                      <p className="text-[11px] text-cyan-300/70">Jump back into your active workout</p>
                    </div>
                    <span className="ml-auto text-cyan-400/60">→</span>
                  </button>
                )}

                <MegaCTA
                  label={hasResumeSession ? "Start New Workout" : weeklyPlan ? "Start Today's Workout" : "Start Workout"}
                  onClick={weeklyPlan && !hasResumeSession ? onStartTodaysWorkout : onStartWorkout}
                />

                {onQuickStart && !hasResumeSession && (
                  <button
                    onClick={onQuickStart}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300"
                  >
                    ⚡ Quick Start — Use Saved Settings
                  </button>
                )}

                <div className="mt-4 rounded-2xl border border-fuchsia-400/14 bg-gradient-to-r from-fuchsia-500/8 via-slate-950/55 to-cyan-500/8 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Workout Audio</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        Use Spotify, Apple Music, YouTube Music, SoundCloud, Flowsoundz Radio, or any background player alongside the workout.
                      </p>
                    </div>
                    <button
                      onClick={onOpenFlowsoundzRadio}
                      className="shrink-0 rounded-xl border border-fuchsia-400/24 bg-fuchsia-500/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-100 transition hover:bg-fuchsia-500/18 active:scale-[0.97]"
                    >
                      Open Radio
                    </button>
                  </div>
                </div>
              </div>

              {/* Last Logged — Progressive Overload Snapshot */}
              {topLogged.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-400">Last Logged</p>
                  <div className="space-y-2.5">
                    {topLogged.map((ex) => (
                      <div key={ex.name} className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-slate-300 truncate min-w-0">{ex.name}</p>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {ex.pr?.bestWeightLbs != null && ex.pr.bestWeightLbs > 0 ? (
                            <span className="text-[11px] font-black text-emerald-300">{ex.pr.bestWeightLbs} lbs</span>
                          ) : ex.pr?.bestReps != null ? (
                            <span className="text-[11px] font-black text-blue-300">{ex.pr.bestReps} reps</span>
                          ) : null}
                          {ex.pr && <span className="text-[9px] text-slate-600">PR</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <QuickActionCard
                  icon="📷"
                  title="Camera Coach"
                  subtitle="Live form tracking"
                  accentClass="text-cyan-400"
                  accentGlowClass="bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_48%)]"
                  iconShellClass="bg-cyan-500/12"
                  showRadar
                  onClick={onOpenCameraSandbox}
                />
                <QuickActionCard
                  icon="📈"
                  title="Progress"
                  subtitle="Charts & badges"
                  accentClass="text-violet-400"
                  accentGlowClass="bg-[radial-gradient(circle_at_top_right,_rgba(167,139,250,0.16),_transparent_52%)]"
                  iconShellClass="bg-violet-500/12"
                  onClick={onViewProgress}
                />
                <QuickActionCard
                  icon="📋"
                  title="Weekly Plan"
                  subtitle={weeklyPlan ? `${completedWeeklyDays}/7 complete` : "Generate plan"}
                  accentClass="text-emerald-400"
                  accentGlowClass="bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.14),_transparent_52%)]"
                  iconShellClass="bg-emerald-500/12"
                  onClick={weeklyPlan ? onStartTodaysWorkout : onGenerateWeeklyPlan}
                />
                <QuickActionCard
                  icon="⚙️"
                  title="Settings"
                  subtitle="Coach & display"
                  accentClass="text-slate-400"
                  accentGlowClass="bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.14),_transparent_54%)]"
                  iconShellClass="bg-slate-500/12"
                  onClick={onOpenSettings}
                />
                <QuickActionCard
                  icon="🎧"
                  title="Flowsoundz"
                  subtitle="Open workout radio"
                  accentClass="text-fuchsia-300"
                  accentGlowClass="bg-[radial-gradient(circle_at_top_right,_rgba(217,70,239,0.16),_transparent_54%)]"
                  iconShellClass="bg-fuchsia-500/12"
                  onClick={onOpenFlowsoundzRadio}
                />
              </div>
            </div>
          </div>

          {/* ── Camera Unlock Banner ── */}
          {userStats.workoutsCompleted >= 1 && !cameraTried && (
            <div className="neon-pulse mt-4 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-950/50 to-blue-500/10 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/18 bg-cyan-500/12 text-xl">
                  📷
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-400">Camera Coach Unlocked</p>
                  <p className="mt-0.5 text-sm font-black text-white">See your form in real time</p>
                </div>
                <button
                  onClick={onOpenCameraSandbox}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:brightness-110 active:scale-[0.97]"
                >
                  Try →
                </button>
              </div>
            </div>
          )}

          {/* ── Coach Insight ── */}
          <div className="mt-4 rounded-2xl border border-violet-400/12 bg-gradient-to-r from-violet-500/8 via-slate-950/40 to-fuchsia-500/8 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-400">{coachName}&apos;s Insight</p>
                <p className="mt-1 text-sm font-black text-white">{coachRecommendation.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{coachRecommendation.message}</p>
                {adaptiveProfile && adaptiveProfile.totalFeedbackSubmissions > 0 && (
                  <p className="mt-2 text-[10px] leading-relaxed text-purple-300/80 border-t border-white/6 pt-2">
                    {adaptiveProfile.consecutiveTooHardSessions >= 2
                      ? "⚠ Recovery mode — back-to-back hard sessions detected."
                      : adaptiveProfile.consecutiveTooEasySessions >= 2
                        ? "↑ Stepping up — consistent easy sessions, intensity increasing."
                        : adaptiveProfile.activeSorenessAreas.length > 0
                          ? `◈ ${adaptiveProfile.activeSorenessAreas.join(", ")} flagged — next plan adapts around soreness.`
                          : `◈ Engine calibrated · ${adaptiveProfile.totalFeedbackSubmissions} session${adaptiveProfile.totalFeedbackSubmissions !== 1 ? "s" : ""} logged`
                    }
                  </p>
                )}
              </div>
              <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                coachRecommendation.priority === "high"
                  ? "border-red-400/18 bg-red-500/10 text-red-300"
                  : coachRecommendation.priority === "medium"
                    ? "border-blue-400/18 bg-blue-500/10 text-blue-300"
                    : "border-emerald-400/18 bg-emerald-500/10 text-emerald-300"
              }`}>
                {coachRecommendation.priority}
              </div>
            </div>
          </div>

          {/* First session feature bullets */}
          {isFirstSession && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                "📷 Camera form coach",
                "🎙️ Voice commands",
                "🏆 XP & badges",
                "📋 Adaptive plans",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-2.5 text-xs font-medium text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── Box D: Floating Glassmorphic Nav Dock ── */}
      <nav className="nav-dock-enter fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-[2rem] border border-white/12 bg-slate-950/82 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavTab(item.id)}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-3.5 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-b from-blue-500/22 to-violet-500/16 text-white shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className={`transition-all duration-300 ${isActive ? "scale-110 text-blue-400" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-[0.16em] transition-all duration-300 ${isActive ? "text-white" : "text-slate-500"}`}>
                  {item.label}
                </span>
                {isActive ? (
                  <span className="absolute bottom-1 h-1 w-4 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
