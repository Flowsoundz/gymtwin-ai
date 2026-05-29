import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { MetricRow } from "@/components/ui/MetricRow";
import { StatCard } from "@/components/ui/StatCard";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import type { CoachAvatar, WorkoutSummaryData } from "@/types";

type WorkoutSummaryScreenProps = {
  lastWorkoutSummary: WorkoutSummaryData;
  displayedSpeech: string;
  selectedAvatar: CoachAvatar;
  onSubmitDifficultyFeedback: (feedback: "too_easy" | "perfect" | "too_hard") => void;
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
  onSubmitDifficultyFeedback,
  onRepeatWorkout,
  onStartNewWorkout,
  onViewProgress,
  primaryButton,
  secondaryButton,
}: WorkoutSummaryScreenProps) {
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
              <StatCard value={lastWorkoutSummary.cleanRepEstimate ?? "--"} label="Clean Reps" colorClass="text-amber-300" />
            </div>
          </section>

          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <MetricRow label="Target Goal:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.goal}</span>} />
            <MetricRow label="Intensity:" value={<span className="font-semibold text-fuchsia-300">{lastWorkoutSummary.level}</span>} />
            <MetricRow label="Equipment:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.equipment}</span>} />
            <MetricRow label="Target / Actual:" value={<span className="font-semibold text-slate-200">{lastWorkoutSummary.sessionLength} / {lastWorkoutSummary.actualSessionMinutes} min</span>} />
            <MetricRow label="Completed:" value={<span className="font-semibold text-slate-400">{lastWorkoutSummary.completedAt}</span>} withBorder={false} />
          </section>

          {showBigSessionCelebration ? (
            <section className="mb-6 rounded-[1.8rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.76))] p-5 shadow-[0_18px_48px_rgba(245,158,11,0.12)]">
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100">
                Achievement Progress
              </div>
              <h3 className="mt-3 text-xl font-black text-white">Big Session</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-50/85">
                Strong output this round. Sessions with elite score or major XP gains can push badge progress forward.
              </p>
              <div className="mt-4 max-w-md">
                <FloatingCoachAvatar
                  selectedAvatar={selectedAvatar}
                  mood={coachBrain.mood}
                  message={lastWorkoutSummary.coachNote ?? coachBrain.message}
                  position="inline"
                />
              </div>
            </section>
          ) : null}

          <section className="mb-8 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Coach Note</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {lastWorkoutSummary.coachNote ?? coachBrain.message}
            </p>
          </section>

          <section className="mb-8 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Adaptive Difficulty</p>
              <h3 className="mt-2 text-xl font-black text-white">How did this workout feel?</h3>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                onClick={() => onSubmitDifficultyFeedback("too_easy")}
                className="rounded-2xl border border-blue-400/14 bg-slate-950 px-3 py-3 text-xs font-black text-slate-200 transition hover:border-blue-500/40 active:scale-95"
              >
                Too Easy
              </button>
              <button
                onClick={() => onSubmitDifficultyFeedback("perfect")}
                className="rounded-2xl border border-fuchsia-400/20 bg-gradient-to-r from-blue-600/90 to-fuchsia-600/90 px-3 py-3 text-xs font-black text-white shadow-[0_16px_32px_rgba(99,102,241,0.22)] transition hover:brightness-105 active:scale-95"
              >
                Perfect
              </button>
              <button
                onClick={() => onSubmitDifficultyFeedback("too_hard")}
                className="rounded-2xl border border-red-400/14 bg-slate-950 px-3 py-3 text-xs font-black text-slate-200 transition hover:border-red-500/40 active:scale-95"
              >
                Too Hard
              </button>
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
