"use client";

import { OptimizedCoachCanvas } from "@/components/OptimizedCoachCanvas";
import { MetricRow } from "@/components/ui/MetricRow";
import { StatCard } from "@/components/ui/StatCard";
import { buildFeedbackPreview } from "@/lib/adaptiveProfileEngine";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getAvatarCoachLayerState } from "@/lib/avatarCoachLayer";
import { getAchievementBadges } from "@/lib/achievementEngine";
import { getCoachAdaptationRecommendation } from "@/lib/coachAdaptationEngine";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import { getDifficultyAdjustmentRecommendation } from "@/lib/difficultyAdjustmentEngine";
import { deriveProgressTrends } from "@/lib/progressTrends";
import { EARNED_BADGE_IDS_KEY } from "@/lib/storageKeys";
import { useEffect, useMemo, useState } from "react";
import type { AchievementBadge } from "@/types";
import type {
  BodyProfile,
  CoachAvatar,
  EnergyRating,
  PostWorkoutFeedback,
  SorenessRating,
  TraineeStats,
  WeeklyPlan,
  WorkoutSummaryData,
} from "@/types";

type WorkoutSummaryScreenProps = {
  lastWorkoutSummary: WorkoutSummaryData;
  displayedSpeech: string;
  selectedAvatar: CoachAvatar;
  bodyProfile?: BodyProfile | null;
  weeklyPlan?: WeeklyPlan | null;
  workoutHistory: WorkoutSummaryData[];
  userStats: TraineeStats;
  onSubmitAdaptiveFeedback: (feedback: PostWorkoutFeedback) => void;
  onRepeatWorkout: () => void;
  onStartNewWorkout: () => void;
  onViewProgress: () => void;
  primaryButton: string;
  secondaryButton: string;
};

export function WorkoutSummaryScreen({
  lastWorkoutSummary,
  displayedSpeech,
  selectedAvatar,
  bodyProfile,
  weeklyPlan,
  workoutHistory,
  userStats,
  onSubmitAdaptiveFeedback,
  onRepeatWorkout,
  onStartNewWorkout,
  onViewProgress,
  primaryButton,
  secondaryButton,
}: WorkoutSummaryScreenProps) {
  const unlockedBadges = getAchievementBadges({ userStats, workoutHistory, lastWorkoutSummary })
    .filter((badge) => badge.unlocked);
  const initialNewBadges = (() => {
    if (typeof window === "undefined") return [] as AchievementBadge[];
    const stored: string[] = JSON.parse(localStorage.getItem(EARNED_BADGE_IDS_KEY) ?? "[]");
    return unlockedBadges.filter((badge) => !stored.includes(badge.id));
  })();

  // ── Adaptive feedback local state ─────────────────────────────────────────
  const [feedbackStep, setFeedbackStep] = useState<0 | 1 | 2 | 3>(0);
  const [difficultyPick, setDifficultyPick] = useState<"too_easy" | "perfect" | "too_hard" | null>(null);
  const [energyPick, setEnergyPick] = useState<EnergyRating | null>(null);
  const [sorenessPick, setSorenessPick] = useState<SorenessRating>("none");
  const [sorenessAreas, setSorenessAreas] = useState<string[]>([]);
  const [submittedFeedback, setSubmittedFeedback] = useState<PostWorkoutFeedback | null>(null);
  const [newBadges] = useState<AchievementBadge[]>(initialNewBadges);

  // Detect badges unlocked by this session and persist the updated earned set
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialNewBadges.length > 0) {
      localStorage.setItem(
        EARNED_BADGE_IDS_KEY,
        JSON.stringify(unlockedBadges.map((badge) => badge.id))
      );
    }
  // Run once on mount — intentional empty deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SORENESS_AREAS = ["Quads", "Glutes", "Hamstrings", "Chest", "Back", "Shoulders", "Arms", "Core"];

  function toggleSorenessArea(area: string) {
    setSorenessAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function handleSubmitFeedback() {
    if (!difficultyPick || !energyPick) return;
    const feedback: PostWorkoutFeedback = {
      difficultyFeedback: difficultyPick,
      energyRating: energyPick,
      sorenessRating: sorenessPick,
      sorenessAreas: sorenessPick === "none" ? [] : sorenessAreas,
    };
    setSubmittedFeedback(feedback);
    setFeedbackStep(3);
    onSubmitAdaptiveFeedback(feedback);
  }

  const showBigSessionCelebration =
    (lastWorkoutSummary.workoutScore ?? 0) >= 90 || (lastWorkoutSummary.xpEarned ?? 0) >= 100;
  const coachBrain = getCoachBrainResponse({
    selectedAvatarName: getAvatarLabel(selectedAvatar),
    screenContext: "summary",
    workoutScore: lastWorkoutSummary.workoutScore,
    formScore: lastWorkoutSummary.formScore,
    xpEarned: lastWorkoutSummary.xpEarned,
    isWorkoutComplete: true,
  });
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
  const nextBestMove = useMemo(
    () =>
      getCoachAdaptationRecommendation({
        bodyProfile,
        weeklyPlan,
        workoutHistory,
        latestWorkoutSummary: lastWorkoutSummary,
        userStats,
        progressTrends,
      }),
    [bodyProfile, lastWorkoutSummary, progressTrends, userStats, weeklyPlan, workoutHistory]
  );
  const smartAdjustment = useMemo(
    () =>
      getDifficultyAdjustmentRecommendation({
        latestWorkoutSummary: lastWorkoutSummary,
        workoutHistory,
        userStats,
        bodyProfile,
        weeklyPlan,
      }),
    [bodyProfile, lastWorkoutSummary, userStats, weeklyPlan, workoutHistory]
  );
  const recommendationTone =
    nextBestMove.priority === "high"
      ? "border-red-400/18 bg-red-500/10 text-red-200"
      : nextBestMove.priority === "medium"
        ? "border-blue-400/18 bg-blue-500/10 text-blue-200"
        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";
  const adjustmentTone =
    smartAdjustment.direction === "increase"
      ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : smartAdjustment.direction === "decrease"
        ? "border-red-400/18 bg-red-500/10 text-red-200"
        : smartAdjustment.direction === "form_focus"
          ? "border-cyan-400/18 bg-cyan-500/10 text-cyan-200"
          : smartAdjustment.direction === "recovery"
            ? "border-fuchsia-400/18 bg-fuchsia-500/10 text-fuchsia-200"
            : "border-blue-400/18 bg-blue-500/10 text-blue-200";
  const avatarCoachState = useMemo(
    () =>
      getAvatarCoachLayerState({
        surface: "summary",
        selectedAvatar,
        coachBrain,
        isWorkoutComplete: true,
      }),
    [coachBrain, selectedAvatar]
  );

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-purple-200">
              Session Completed
            </div>
            <h2 className="bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Workout Summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Review your completed session, track your actual work, and calibrate how the next workout should feel.
            </p>
          </header>

          <section className="mb-6">
            <OptimizedCoachCanvas height="h-[280px]" surface="summary" />
          </section>

          <section className="mb-6 rounded-[1.7rem] border border-blue-400/14 bg-blue-950/12 p-4 text-left shadow-inner">
            <div className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
              {lastWorkoutSummary.coach} Feedback
            </div>
            <p className="text-sm italic leading-relaxed text-blue-100/90">&ldquo;{displayedSpeech}&rdquo;</p>
          </section>

          <section className="mb-6 grid grid-cols-3 gap-3 lg:gap-4">
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.actualSessionMinutes} label="Real Min" colorClass="text-blue-400" />
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.totalSets} label="Total Sets" colorClass="text-fuchsia-400" />
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.estimatedReps} label="Est. Reps" colorClass="text-indigo-400" />
            </div>
          </section>

          {/* ── Locked Pro Section — AI Joint Analysis ── */}
          <section className="mb-6 overflow-hidden rounded-[1.8rem] border border-violet-400/20 bg-slate-950/70">
            {/* Visible header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-violet-400">AI Form Analysis</p>
                <p className="mt-0.5 text-sm font-black text-white">Joint Deviation & Posture Report</p>
              </div>
              <div className="rounded-full border border-violet-400/24 bg-violet-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                Pro
              </div>
            </div>

            {/* Blurred skeletal preview + lock overlay */}
            <div className="relative">
              {/* Blurred content underneath */}
              <div className="select-none blur-[6px]">
                <div className="grid grid-cols-3 gap-3 p-5">
                  {[
                    { label: "Forward Lean", value: "14°", color: "text-red-400", bar: 72 },
                    { label: "Hip Symmetry", value: "91%", color: "text-emerald-400", bar: 91 },
                    { label: "Knee Track", value: "—3°", color: "text-cyan-400", bar: 55 },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-center">
                      <p className={`text-2xl font-black italic ${metric.color}`}>{metric.value}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className={`h-full rounded-full ${metric.color.replace("text-", "bg-")}`} style={{ width: `${metric.bar}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 px-5 pb-5">
                  <div className="h-16 w-16 rounded-2xl border border-white/8 bg-gradient-to-br from-violet-500/20 to-blue-500/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-white/10" />
                    <div className="h-2 w-1/2 rounded-full bg-white/8" />
                    <div className="h-2 w-2/3 rounded-full bg-white/6" />
                  </div>
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/75 px-6 py-8 backdrop-blur-[2px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/16 text-3xl shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                  🔒
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-white">Unlock GymTwin Pro</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                    View your <span className="font-black text-cyan-300">14° forward-lean analysis</span> and AI-detected knee strain risk from this session.
                  </p>
                </div>
                <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] active:scale-95">
                  <span className="relative z-10">Upgrade to Pro →</span>
                  <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
                <p className="text-[10px] text-slate-600">AI-powered · On-device · Private</p>
              </div>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.workoutScore ?? "--"} label="Workout Score" colorClass="text-fuchsia-300" />
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.formScore ?? "--"} label="Form Score" colorClass="text-emerald-300" />
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.xpEarned ?? "--"} label="XP Earned" colorClass="text-blue-300" />
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 text-center">
              <StatCard value={lastWorkoutSummary.cleanRepEstimate ?? "--"} label="Clean Reps" colorClass="text-emerald-300" />
            </div>
          </section>

          {/* ── Session Breakdown: Muscle Groups + PRs ── */}
          {((lastWorkoutSummary.muscleGroups?.length ?? 0) > 0 || (lastWorkoutSummary.sessionPRs?.length ?? 0) > 0) && (
            <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">Session Breakdown</p>

              {/* Muscle group chips */}
              {(lastWorkoutSummary.muscleGroups?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">Muscles Worked</p>
                  <div className="flex flex-wrap gap-2">
                    {lastWorkoutSummary.muscleGroups!.map((group) => {
                      const colors: Record<string, string> = {
                        legs: "border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-200",
                        "upper body": "border-blue-400/30 bg-blue-500/12 text-blue-200",
                        core: "border-amber-400/30 bg-amber-500/12 text-amber-200",
                        cardio: "border-red-400/30 bg-red-500/12 text-red-200",
                      };
                      const cls = colors[group] ?? "border-slate-400/20 bg-slate-500/10 text-slate-300";
                      return (
                        <span
                          key={group}
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${cls}`}
                        >
                          {group}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PR badges */}
              {(lastWorkoutSummary.sessionPRs?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">Personal Records</p>
                  <div className="space-y-2">
                    {lastWorkoutSummary.sessionPRs!.map((pr, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/24 bg-amber-500/8 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none text-amber-400">★</span>
                          <p className="text-xs font-black capitalize text-amber-100">{pr.exerciseName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">New PR</p>
                          <p className="text-xs font-semibold text-amber-200">{pr.prLabel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <MetricRow label="Target Goal:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.goal}</span>} />
            <MetricRow label="Intensity:" value={<span className="font-semibold text-fuchsia-300">{lastWorkoutSummary.level}</span>} />
            <MetricRow label="Equipment:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.equipment}</span>} />
            <MetricRow label="Target / Actual:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.sessionLength} / {lastWorkoutSummary.actualSessionMinutes} min</span>} />
            <MetricRow label="Completed:" value={<span className="font-semibold text-slate-400">{lastWorkoutSummary.completedAt}</span>} withBorder={false} />
          </section>

          {showBigSessionCelebration ? (
            <section className="mb-6 rounded-[1.8rem] border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(217,70,239,0.16),rgba(15,23,42,0.76))] p-5 shadow-[0_18px_48px_rgba(217,70,239,0.12)]">
              <div className="inline-flex rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-100">
                Achievement Progress
              </div>
              <h3 className="mt-3 text-xl font-black text-white">Big Session</h3>
              <p className="mt-2 text-sm leading-relaxed text-fuchsia-50/85">
                Strong output this round. Sessions with elite score or major XP gains can push badge progress forward.
              </p>
              <div className="mt-4">
                <OptimizedCoachCanvas height="h-[200px]" surface="summary" />
              </div>
            </section>
          ) : null}

          <section className="mb-8 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Coach Note</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {lastWorkoutSummary.coachNote ?? avatarCoachState.message}
            </p>
          </section>

          {/* ── New badge unlock celebration ── */}
          {newBadges.length > 0 && (
            <section className="mb-8 rounded-[1.8rem] border border-amber-400/28 bg-[linear-gradient(135deg,rgba(120,53,15,0.28),rgba(2,6,23,0.92))] p-5 shadow-[0_0_32px_rgba(251,191,36,0.14)]">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
                Badge Unlocked
              </div>
              <h3 className="mt-2 text-xl font-black text-white">
                {newBadges.length === 1 ? "New Achievement" : `${newBadges.length} New Achievements`}
              </h3>
              <div className="mt-3 space-y-2.5">
                {newBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-slate-950/60 px-4 py-3"
                  >
                    <span className="text-2xl leading-none">{badge.icon}</span>
                    <div>
                      <p className="text-sm font-black text-amber-100">{badge.title}</p>
                      <p className="text-[11px] leading-snug text-slate-400">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 rounded-[1.8rem] border border-cyan-400/14 bg-[linear-gradient(135deg,rgba(8,47,73,0.52),rgba(2,6,23,0.92))] p-5 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300">Next Best Move</p>
                <h3 className="mt-2 text-xl font-black text-white">{nextBestMove.title}</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${recommendationTone}`}>
                {nextBestMove.priority}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{nextBestMove.message}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Suggested Action</p>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{nextBestMove.suggestedAction}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Reason</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{nextBestMove.reason}</p>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Smart Adjustment</p>
                <h3 className="mt-2 text-xl font-black text-white">{smartAdjustment.title}</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${adjustmentTone}`}>
                {smartAdjustment.direction.replace("_", " ")}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{smartAdjustment.message}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Adjustment</p>
                <p className="mt-1 text-sm font-semibold text-fuchsia-100">{smartAdjustment.adjustmentLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Reason</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{smartAdjustment.reason}</p>
              </div>
            </div>
          </section>

          {/* ── Adaptive Feedback Panel ──────────────────────────────────── */}
          <section className="mb-8 overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">

            {/* Header */}
            <div className="border-b border-white/6 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">
                    Adaptive Training
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {feedbackStep === 3 ? "Your Next Workout Is Calibrated" : "Tell Your Coach How It Went"}
                  </h3>
                </div>
                {feedbackStep < 3 && (
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 w-5 rounded-full transition-colors ${
                          feedbackStep > s
                            ? "bg-fuchsia-500"
                            : feedbackStep === s
                              ? "bg-fuchsia-400"
                              : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* Step 0: Difficulty */}
              {feedbackStep === 0 && (
                <div>
                  <p className="mb-4 text-sm text-slate-400">How did the intensity feel overall?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "too_easy", label: "Too Easy", sub: "Could do more", color: "border-blue-500/40 hover:border-blue-400/60 text-blue-200" },
                        { value: "perfect", label: "Just Right", sub: "Felt balanced", color: "border-fuchsia-500/40 hover:border-fuchsia-400/60 text-fuchsia-100" },
                        { value: "too_hard", label: "Too Hard", sub: "Pushed limit", color: "border-red-500/40 hover:border-red-400/60 text-red-200" },
                      ] as { value: "too_easy" | "perfect" | "too_hard"; label: string; sub: string; color: string }[]
                    ).map(({ value, label, sub, color }) => (
                      <button
                        key={value}
                        onClick={() => { setDifficultyPick(value); setFeedbackStep(1); }}
                        className={`rounded-2xl border bg-slate-900/70 px-3 py-4 text-center transition active:scale-95 ${color}`}
                      >
                        <p className="text-sm font-black">{label}</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Energy */}
              {feedbackStep === 1 && (
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Intensity: <span className="text-fuchsia-300">{difficultyPick?.replace("_", " ")}</span>
                  </p>
                  <p className="mb-4 text-sm text-slate-400">How&apos;s your energy level right now?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "low", label: "Drained", icon: "↓", sub: "Need rest", color: "border-red-500/30 hover:border-red-400/50 text-red-200" },
                        { value: "moderate", label: "Moderate", icon: "→", sub: "Felt normal", color: "border-slate-500/40 hover:border-slate-400/60 text-slate-200" },
                        { value: "high", label: "Energized", icon: "↑", sub: "Still going", color: "border-emerald-500/40 hover:border-emerald-400/60 text-emerald-200" },
                      ] as { value: EnergyRating; label: string; icon: string; sub: string; color: string }[]
                    ).map(({ value, label, icon, sub, color }) => (
                      <button
                        key={value}
                        onClick={() => { setEnergyPick(value); setFeedbackStep(2); }}
                        className={`rounded-2xl border bg-slate-900/70 px-3 py-4 text-center transition active:scale-95 ${color}`}
                      >
                        <p className="text-lg font-black">{icon}</p>
                        <p className="text-sm font-black">{label}</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Soreness */}
              {feedbackStep === 2 && (
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Energy: <span className="text-emerald-300">{energyPick}</span>
                  </p>
                  <p className="mb-4 text-sm text-slate-400">Any muscle groups feeling sore?</p>

                  {/* Soreness level */}
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {(["none", "mild", "moderate", "severe"] as SorenessRating[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setSorenessPick(level);
                          if (level === "none") setSorenessAreas([]);
                        }}
                        className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-wider transition active:scale-95 ${
                          sorenessPick === level
                            ? "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-200"
                            : "border-white/8 bg-slate-900/60 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Soreness area chips */}
                  {sorenessPick !== "none" && (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {SORENESS_AREAS.map((area) => (
                        <button
                          key={area}
                          onClick={() => toggleSorenessArea(area)}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition active:scale-95 ${
                            sorenessAreas.includes(area)
                              ? "border-orange-500/60 bg-orange-950/50 text-orange-200"
                              : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/25"
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitFeedback}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-fuchsia-600 py-3.5 text-sm font-black text-white shadow-[0_0_22px_rgba(139,92,246,0.38)] transition hover:brightness-110 active:scale-95"
                  >
                    Submit Feedback →
                  </button>
                </div>
              )}

              {/* Step 3: Calibration confirmation */}
              {feedbackStep === 3 && submittedFeedback && (
                <div>
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-blue-600 text-sm font-black text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]">
                      ✓
                    </div>
                    <p className="text-sm font-bold text-slate-300">Feedback saved — your next plan adapts to this.</p>
                  </div>

                  <div className="space-y-2">
                    {buildFeedbackPreview(submittedFeedback).map((line, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-slate-900/60 px-3.5 py-2.5">
                        <span className="mt-0.5 text-fuchsia-400 text-xs">◈</span>
                        <p className="text-[11px] leading-relaxed text-slate-300">{line}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <div className="rounded-xl border border-white/8 bg-slate-900/60 py-2.5 px-2">
                      <p className="text-fuchsia-300 text-xs mb-0.5">{submittedFeedback.difficultyFeedback.replace("_", " ")}</p>
                      <p>Difficulty</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-900/60 py-2.5 px-2">
                      <p className="text-emerald-300 text-xs mb-0.5">{submittedFeedback.energyRating}</p>
                      <p>Energy</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-900/60 py-2.5 px-2">
                      <p className="text-orange-300 text-xs mb-0.5">{submittedFeedback.sorenessRating}</p>
                      <p>Soreness</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            <button onClick={onRepeatWorkout} className={primaryButton}>🔄 Repeat This Workout</button>
            <button onClick={onStartNewWorkout} className={secondaryButton}>✨ Start New Workout</button>
            <button onClick={onViewProgress} className={secondaryButton}>📈 View Progress</button>
          </div>
        </div>
      </div>
    </main>
  );
}
