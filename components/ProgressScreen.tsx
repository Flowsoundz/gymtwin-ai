import { FeedbackBadge } from "@/components/ui/FeedbackBadge";
import { StatCard } from "@/components/ui/StatCard";
import type { AchievementBadge, TraineeStats, WorkoutSummaryData } from "@/types";

type ProgressScreenProps = {
  badges: AchievementBadge[];
  userStats: TraineeStats;
  workoutHistory: WorkoutSummaryData[];
  onStartAnotherWorkout: () => void;
  onReturnHome: () => void;
  onViewWorkoutDetail: (workout: WorkoutSummaryData) => void;
  primaryButton: string;
  secondaryButton: string;
};

export function ProgressScreen({
  badges,
  userStats,
  workoutHistory,
  onStartAnotherWorkout,
  onReturnHome,
  onViewWorkoutDetail,
  primaryButton,
  secondaryButton,
}: ProgressScreenProps) {
  const recentWorkoutsToDisplay = workoutHistory.slice(0, 5);
  const unlockedBadgeCount = badges.filter((badge) => badge.unlocked).length;
  const nextBadge = badges.find((badge) => !badge.unlocked) ?? null;
  const motivationalLine =
    userStats.workoutsCompleted === 0
      ? "Complete your first workout to start earning badges and building momentum."
      : userStats.streak > 0
        ? "Complete another workout to keep your streak alive."
        : "Start another session to keep your progress moving.";

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
                {workoutHistory.length} total logs
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
