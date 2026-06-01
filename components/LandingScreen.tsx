"use client";

import { Coach3D } from "@/components/Coach3D";
import { getAvatarLabel, getAvatarRole } from "@/lib/avatarAssets";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import { deriveProgressTrends } from "@/lib/progressTrends";
import { todayString, yesterdayString } from "@/lib/time";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import { useMemo, useState } from "react";
import type { BodyProfile, CoachAvatar, TraineeStats, WeeklyPlan, WorkoutSummaryData } from "@/types";

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
  primaryButton: string;
  secondaryButton: string;
};

function buildGreeting(
  userStats: TraineeStats,
  latestWorkoutSummary: WorkoutSummaryData | null | undefined,
  isFirstSession: boolean
) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isFirstSession) {
    return { headline: "Your AI coach is ready.", sub: "Adaptive plans, voice coaching, and camera form tracking — on-device." };
  }

  const today = todayString();
  const yesterday = yesterdayString();
  const last = userStats.lastWorkoutDate;
  const daysSince = last ? Math.round((Date.now() - new Date(last + "T12:00:00").getTime()) / 86400000) : null;
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
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accentClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bento-card group flex flex-col items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-left backdrop-blur-md transition hover:border-white/16"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl ${accentClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{subtitle}</p>
      </div>
      <div className="ml-auto text-slate-600 transition group-hover:text-slate-300">→</div>
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

type NavTab = "home" | "workouts" | "progress" | "settings";

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
}: LandingScreenProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  const coachName = getAvatarLabel(selectedAvatar);
  const coachRole = getAvatarRole(selectedAvatar);
  const todayPlan = weeklyPlan?.days.find((d) => d.dayLabel === getTodayWeeklyPlanLabel()) ?? weeklyPlan?.days[0] ?? null;
  const completedWeeklyDays = weeklyPlan?.days.filter((d) => d.completed).length ?? 0;

  const progressTrends = useMemo(
    () => deriveProgressTrends({ workoutHistory, weeklyPlan, bodyProfile, userStats }),
    [bodyProfile, userStats, weeklyPlan, workoutHistory]
  );
  const coachRecommendation = useMemo(
    () => getCoachAdaptationRecommendation({ bodyProfile, weeklyPlan, workoutHistory, latestWorkoutSummary, userStats, progressTrends }),
    [bodyProfile, latestWorkoutSummary, progressTrends, userStats, weeklyPlan, workoutHistory]
  );

  const isFirstSession = userStats.workoutsCompleted === 0 && userStats.streak === 0 && userStats.totalMinutes === 0;
  const greeting = useMemo(
    () => buildGreeting(userStats, latestWorkoutSummary, isFirstSession),
    [userStats, latestWorkoutSummary, isFirstSession]
  );

  const handleNavTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "progress") onViewProgress();
    if (tab === "settings") onOpenSettings();
    if (tab === "workouts") onStartWorkout();
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
        <div className="mx-auto w-full max-w-md px-4 lg:max-w-6xl lg:px-6">

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
            <ChromeProBadge />
          </header>

          {/* ── Bento Grid ── */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1.45fr] lg:grid-rows-[auto_auto]">

            {/* Box A: 3D Coach Avatar — spans both rows on desktop */}
            <div className="bento-card relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-1 shadow-[0_0_60px_rgba(99,102,241,0.12)] backdrop-blur-xl lg:row-span-2">
              {/* Neon glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/8 via-violet-500/5 to-fuchsia-500/8" />
              <div className="relative">
                <Coach3D
                  selectedAvatar={selectedAvatar}
                  animationHint="idle"
                  previewFrame="full_body"
                  lightingMode="neutral"
                />
                {/* Coach identity overlay */}
                <div className="absolute bottom-0 left-0 right-0 rounded-b-[1.4rem] bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-4 pb-4 pt-8">
                  <p className="text-lg font-black italic text-white">{coachName}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">{coachRole}</p>
                  {/* Live status pill */}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: "coachPulse 2s ease-in-out infinite" }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">AI Coach Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box B: Today's Plan + Mega CTA */}
            <div className="bento-card rounded-3xl border border-white/8 bg-slate-950/65 p-5 backdrop-blur-md">
              {/* Greeting */}
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
                <h2 className="mt-1 text-2xl font-black italic leading-tight tracking-tight text-white lg:text-3xl">
                  {greeting.headline}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{greeting.sub}</p>
              </div>

              {/* Today's Plan card */}
              <div className="mb-4 rounded-2xl border border-blue-400/14 bg-blue-500/8 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400">Today&apos;s Plan</p>
                    <p className="mt-1 truncate text-base font-black text-white">
                      {todayPlan ? todayPlan.focus : "No plan yet"}
                    </p>
                    {todayPlan ? (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {todayPlan.dayLabel} · {todayPlan.recommendedWorkout} · {todayPlan.durationMinutes} min
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-400">Generate a 7-day plan for your week.</p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-full border border-blue-400/14 bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-300">
                    {weeklyPlan ? `${completedWeeklyDays}/7` : "—"}
                  </div>
                </div>
              </div>

              {/* Resume session if active */}
              {hasResumeSession && (
                <button
                  onClick={onResumeWorkout}
                  className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left transition hover:bg-amber-500/16 active:scale-[0.99]"
                >
                  <span className="text-base">▶</span>
                  <div>
                    <p className="text-sm font-black text-amber-200">Resume Session</p>
                    <p className="text-[11px] text-amber-300/70">Jump back into your active workout</p>
                  </div>
                  <span className="ml-auto text-amber-400/60">→</span>
                </button>
              )}

              {/* Mega CTA */}
              <MegaCTA
                label={hasResumeSession ? "Start New Workout" : weeklyPlan ? "Start Today's Workout" : "Start Workout"}
                onClick={weeklyPlan && !hasResumeSession ? onStartTodaysWorkout : onStartWorkout}
              />

              {/* Quick Start */}
              {onQuickStart && !hasResumeSession && (
                <button
                  onClick={onQuickStart}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/16 bg-emerald-500/8 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/14 active:scale-[0.98]"
                >
                  ⚡ Quick Start — Use Saved Settings
                </button>
              )}
            </div>

            {/* Box C: Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                icon="📷"
                title="Camera Coach"
                subtitle="Live form tracking"
                accentClass="text-cyan-400"
                onClick={onOpenCameraSandbox}
              />
              <QuickActionCard
                icon="📈"
                title="Progress"
                subtitle="Charts & badges"
                accentClass="text-violet-400"
                onClick={onViewProgress}
              />
              <QuickActionCard
                icon="📋"
                title="Weekly Plan"
                subtitle={weeklyPlan ? `${completedWeeklyDays}/7 complete` : "Generate plan"}
                accentClass="text-emerald-400"
                onClick={weeklyPlan ? onStartTodaysWorkout : onGenerateWeeklyPlan}
              />
              <QuickActionCard
                icon="⚙️"
                title="Settings"
                subtitle="Coach & display"
                accentClass="text-slate-400"
                onClick={onOpenSettings}
              />
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <NeonStatPill value={userStats.workoutsCompleted} label="Sessions" colorClass="text-blue-400" />
            <NeonStatPill value={userStats.streak} label="Streak 🔥" colorClass="text-fuchsia-400" />
            <NeonStatPill value={userStats.totalMinutes} label="Minutes" colorClass="text-violet-400" />
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
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-400">Coach Insight</p>
                <p className="mt-1 text-sm font-black text-white">{coachRecommendation.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{coachRecommendation.message}</p>
              </div>
              <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                coachRecommendation.priority === "high"
                  ? "border-amber-400/18 bg-amber-500/10 text-amber-300"
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
                className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-2.5 transition-all duration-300 ${
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
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
