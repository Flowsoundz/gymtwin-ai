import { FeedbackBadge } from "@/components/ui/FeedbackBadge";
import { MetricRow } from "@/components/ui/MetricRow";
import type { WorkoutSummaryData } from "@/types";

type WorkoutDetailScreenProps = {
  selectedWorkoutDetail: WorkoutSummaryData;
  onBackToProgress: () => void;
  onRepeatSimilarWorkout: () => void;
  onMakeNextEasier: () => void;
  onMakeNextHarder: () => void;
  primaryButton: string;
  secondaryButton: string;
};

export function WorkoutDetailScreen({
  selectedWorkoutDetail,
  onBackToProgress,
  onRepeatSimilarWorkout,
  onMakeNextEasier,
  onMakeNextHarder,
  primaryButton,
  secondaryButton,
}: WorkoutDetailScreenProps) {
  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <button
            onClick={onBackToProgress}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
          >
            ← Back to Progress
          </button>

          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Session Detail</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Workout Detail</h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              {selectedWorkoutDetail.completedAt}
            </p>
          </header>

          <section className="mb-6 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <MetricRow label="Target Objective:" value={<span className="font-semibold text-slate-200">{selectedWorkoutDetail.goal}</span>} />
            <MetricRow label="Baseline Intensity:" value={<span className="font-black text-fuchsia-300">{selectedWorkoutDetail.level}</span>} />
            <MetricRow label="Assigned Equipment:" value={<span className="font-semibold text-slate-200">{selectedWorkoutDetail.equipment}</span>} />
            <MetricRow label="Assigned Coach:" value={<span className="font-bold text-blue-300">{selectedWorkoutDetail.coach}</span>} />
            <MetricRow label="Target Duration:" value={<span className="font-semibold text-slate-200">{selectedWorkoutDetail.sessionLength} min</span>} />
            <MetricRow label="Actual Active Time:" value={<span className="font-mono font-semibold text-slate-200">{selectedWorkoutDetail.actualSessionMinutes} min</span>} />
            <MetricRow label="Total Set Blocks:" value={<span className="font-semibold text-slate-200">{selectedWorkoutDetail.totalSets} Sets</span>} />
            <MetricRow label="Aggregated Reps:" value={<span className="font-mono font-semibold text-slate-200">{selectedWorkoutDetail.estimatedReps} Vol</span>} />
            <MetricRow label="Workout Score:" value={<span className="font-black text-fuchsia-300">{selectedWorkoutDetail.workoutScore ?? "--"}</span>} />
            <MetricRow label="Form Score:" value={<span className="font-black text-emerald-300">{selectedWorkoutDetail.formScore ?? "--"}</span>} />
            <MetricRow label="XP Earned:" value={<span className="font-black text-blue-300">{selectedWorkoutDetail.xpEarned ?? "--"}</span>} />
            <MetricRow label="Clean Reps:" value={<span className="font-mono font-semibold text-slate-200">{selectedWorkoutDetail.cleanRepEstimate ?? "--"}</span>} />
            <MetricRow label="Adaptive Feedback:" value={<FeedbackBadge feedback={selectedWorkoutDetail.difficultyFeedback} />} />
            <MetricRow label="Coach Note:" value={<span className="font-semibold text-slate-300">{selectedWorkoutDetail.coachNote ?? "No coach note saved for this session."}</span>} withBorder={false} />
          </section>

          <section className="mb-8 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Adaptive Override</p>
              <h3 className="mt-2 text-xl font-black text-white">Calibrate Historical Difficulty</h3>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={onMakeNextEasier}
                className="rounded-2xl border border-red-400/14 bg-slate-950 px-3 py-3.5 text-xs font-black text-red-300 transition hover:border-red-500/40 active:scale-95"
              >
                📉 Make Next Easier
              </button>
              <button
                onClick={onMakeNextHarder}
                className="rounded-2xl border border-blue-400/14 bg-slate-950 px-3 py-3.5 text-xs font-black text-blue-300 transition hover:border-blue-500/40 active:scale-95"
              >
                📈 Make Next Harder
              </button>
            </div>
          </section>

          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <button onClick={onRepeatSimilarWorkout} className={primaryButton}>🔄 Load Parameters to Setup Room</button>
            <button onClick={onBackToProgress} className={secondaryButton}>📈 Back to Progress Panel</button>
          </div>
        </div>
      </div>
    </main>
  );
}
