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
    <main className="min-h-screen bg-slate-950 p-6 pb-24 font-sans text-white antialiased">
      <div className="mx-auto max-w-md lg:max-w-6xl xl:max-w-7xl">
        <button onClick={onBackToSetup} className="mb-6 text-sm font-bold text-slate-500 hover:text-slate-300">&larr; Back to Parameters</button>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-900/50 bg-blue-950/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
          Program Overview
        </div>
        <h2 className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text pb-1 text-4xl font-black tracking-tight text-transparent">
          Your Custom Routine
        </h2>
        <p className="mb-6 max-w-2xl text-xs leading-relaxed text-slate-500">
          Rep targets adjust dynamically based on your logged difficulty feedback.
        </p>

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
    </main>
  );
}
