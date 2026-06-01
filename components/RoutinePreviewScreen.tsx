import { Coach3D } from "@/components/Coach3D";
import { getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getExerciseDemoDescriptor } from "@/lib/exerciseDemoLibrary";
import type { CoachAvatar, WorkoutMovement } from "@/types";

type RoutinePreviewScreenProps = {
  activeRoutine: WorkoutMovement[];
  cleanMovementName: (name: string) => string;
  onBackToSetup: () => void;
  onBeginWorkout: () => void;
  onCancel: () => void;
  primaryButton: string;
  secondaryButton: string;
  selectedAvatar: CoachAvatar;
};

export function RoutinePreviewScreen({
  activeRoutine,
  cleanMovementName,
  onBackToSetup,
  onBeginWorkout,
  onCancel,
  primaryButton,
  secondaryButton,
  selectedAvatar,
}: RoutinePreviewScreenProps) {
  const estimatedDuration = activeRoutine.reduce((sum, move) => sum + move.activeSeconds + move.restPeriod, 0);
  const estimatedMinutes = Math.max(1, Math.round(estimatedDuration / 60));
  const supportedCameraCount = activeRoutine.filter((move) => getCameraCoachModeForMovementName(move.name)).length;

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-12 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-6xl xl:max-w-7xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">
        <button onClick={onBackToSetup} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white">
          ← Back to Parameters
        </button>
        <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 px-5 py-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Program Overview</p>
          <h2 className="mt-2 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
            Your Custom Routine
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Rep targets adjust dynamically based on your logged difficulty feedback.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
          <section>
            <div className="space-y-3">
              {activeRoutine.map((move, index) => {
                const demoDescriptor = getExerciseDemoDescriptor(move.name, selectedAvatar);
                return (
                <div key={move.id} className="relative flex items-center justify-between overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/6 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:p-5">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />
                  <div className="max-w-[75%]">
                    <span className={`mb-1.5 inline-block rounded border px-2 py-0.5 text-[9px] font-black uppercase ${
                      move.phase === "warmup" ? "border-blue-900/30 bg-blue-950/40 text-blue-400" : move.phase === "cooldown" ? "border-teal-900/30 bg-teal-950/40 text-teal-400" : "border-purple-900/30 bg-purple-950/40 text-purple-400"
                    }`}>
                      {move.phase} &bull; {move.category}
                    </span>
                    {getCameraCoachModeForMovementName(move.name) ? (
                      <span className="ml-2 inline-block rounded-full border border-fuchsia-900/40 bg-fuchsia-950/40 px-2 py-0.5 text-[9px] font-black uppercase text-fuchsia-300 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
                        Camera Coach
                      </span>
                    ) : null}
                    <span
                      className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        demoDescriptor.status === "available"
                          ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-200"
                          : demoDescriptor.status === "prepared"
                            ? "border-cyan-400/30 bg-cyan-500/12 text-cyan-200"
                            : getCameraCoachModeForMovementName(move.name)
                              ? "border-blue-900/40 bg-blue-950/40 text-blue-300"
                              : "border-white/8 bg-slate-900/70 text-slate-400"
                      }`}
                    >
                      {demoDescriptor.status === "available"
                        ? "Clip Ready"
                        : demoDescriptor.status === "prepared"
                          ? demoDescriptor.demoFamily
                            ? `${demoDescriptor.demoFamily} demo ready`
                            : "Demo Mapped"
                          : getCameraCoachModeForMovementName(move.name)
                            ? "Camera Coach Ready"
                            : "Demo Planned"}
                    </span>
                    <h4 className="text-sm font-extrabold leading-tight text-slate-200 lg:text-base">
                      {index + 1}. {cleanMovementName(move.name)}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{demoDescriptor.summary}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-base font-black text-purple-400 lg:text-lg">{move.baseReps === 1 ? `${move.activeSeconds}s` : `${move.sets}x${move.baseReps}`}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{move.baseReps === 1 ? "Hold" : "Reps"}</p>
                  </div>
                </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Coach3D
              selectedAvatar={selectedAvatar}
              animationHint="idle"
              previewFrame="bust"
              compact
              lightingMode="neutral"
            />
            <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.42)]">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Program Summary</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Ready To Train</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Movements</p>
                  <p className="mt-1 text-2xl font-black text-white">{activeRoutine.length}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Duration</p>
                  <p className="mt-1 text-2xl font-black text-white">~{estimatedMinutes}m</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Camera Coach</p>
                  <p className="mt-1 text-2xl font-black text-white">{supportedCameraCount}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Selected Avatar</p>
                  <p className="mt-1 text-base font-black text-white">{getAvatarLabel(selectedAvatar)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                The preview keeps the routine visible on the left while surfacing the key session summary on desktop.
              </p>
              <div className="mt-5 space-y-3">
                <button onClick={onBeginWorkout} className={primaryButton}>Begin Active Workout</button>
                <button onClick={onCancel} className={secondaryButton}>Cancel and Return</button>
              </div>
            </section>
          </aside>
        </div>
        </div>
      </div>
    </main>
  );
}
