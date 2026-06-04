import { Coach3D } from "@/components/Coach3D";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getExerciseDemoDescriptor } from "@/lib/exerciseDemoLibrary";
import { getCameraCoachLabel, getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
import { isFloorMovementName } from "@/lib/exerciseAnimationMap";
import type { CoachAvatar } from "@/types";

type ExerciseDemoCardProps = {
  selectedAvatar: CoachAvatar;
  exerciseName: string;
  demoClipName?: string | null;
  compact?: boolean;
};

function getFormTips(exerciseName: string) {
  const trackingMode = getCameraCoachModeForMovementName(exerciseName);

  if (trackingMode === "squat") {
    return ["Chest tall", "Knees track toes", "Reach depth"];
  }

  if (trackingMode === "pushup") {
    return ["Strong plank", "Lower with control", "Press through floor"];
  }

  if (trackingMode === "plank") {
    return ["Shoulder / hip / ankle line", "Brace core", "Breathe"];
  }

  return ["Smooth setup", "Controlled tempo", "Stay consistent"];
}

const FAMILY_LABEL: Record<string, string> = {
  squat:  "Squat Family",
  pushup: "Push-Up Family",
  plank:  "Plank Family",
};

export function ExerciseDemoCard({
  selectedAvatar,
  exerciseName,
  demoClipName,
  compact = false,
}: ExerciseDemoCardProps) {
  const trackingMode = getCameraCoachModeForMovementName(exerciseName);
  const formTips = getFormTips(exerciseName);
  const avatarLabel = getAvatarLabel(selectedAvatar);
  const demoDescriptor = getExerciseDemoDescriptor(exerciseName, selectedAvatar);
  const isFloorDemo = isFloorMovementName(exerciseName);

  const statusTone =
    demoDescriptor.status === "available"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : demoDescriptor.status === "prepared"
        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
        : demoDescriptor.status === "camera_ready"
          ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
          : "border-white/8 bg-slate-900/70 text-slate-300";

  const statusLabel =
    demoDescriptor.status === "available"
      ? "Clip Ready"
      : demoDescriptor.status === "prepared"
        ? "Prepared"
        : demoDescriptor.status === "camera_ready"
          ? "Camera Ready"
          : demoDescriptor.status === "planned"
            ? "Planned"
            : "Fallback";

  // Source chip — honest about what is actually powering the demo
  const sourceLabel = demoDescriptor.clip?.isAvailable
    ? "Real Clip File"
    : demoDescriptor.embeddedClipName
      ? `Embedded · ${demoDescriptor.embeddedClipName}`
      : trackingMode
        ? "Camera Fallback"
        : "Text Only";

  const sourceTone = demoDescriptor.clip?.isAvailable
    ? "border-emerald-400/18 text-emerald-200"
    : demoDescriptor.embeddedClipName
      ? "border-fuchsia-400/18 text-fuchsia-200"
      : trackingMode
        ? "border-blue-400/18 text-blue-300"
        : "border-white/8 text-slate-500";

  const cameraSupportLabel = trackingMode ? getCameraCoachLabel(trackingMode) : "Demo Preview";
  const movementFamilyLabel = demoDescriptor.demoFamily
    ? (FAMILY_LABEL[demoDescriptor.demoFamily] ?? demoDescriptor.demoFamily)
    : "General Movement";

  return (
    <section
      className={`overflow-hidden rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.48)] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-fuchsia-300">Movement Showcase</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{exerciseName}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {avatarLabel} • {movementFamilyLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusTone}`}>
            {statusLabel}
          </div>
          {demoDescriptor.isWorkoutReady ? (
            <div className="rounded-full border border-emerald-400/18 bg-emerald-500/8 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Workout Ready
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.2),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.28),rgba(2,6,23,0.85))]">
        <div className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              {cameraSupportLabel}
            </span>
            <span className={`rounded-full border bg-slate-900/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${sourceTone}`}>
              {sourceLabel}
            </span>
          </div>
          <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
            {isFloorDemo ? "Side Profile" : "Full Body"}
          </div>
        </div>
        {demoClipName ? (
          <div className="relative">
            <div className="absolute inset-x-3 top-3 z-[2] flex flex-wrap items-start justify-between gap-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/74 px-3 py-2 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Demo Stage</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {isFloorDemo ? "Profile view for line, brace, and depth checks." : "Hero framing for setup, tempo, and posture."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/74 px-3 py-2 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-300">Atlas Focus</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {formTips[0]} • {formTips[1]}
                </p>
              </div>
            </div>
            <Coach3D
              selectedAvatar={selectedAvatar}
              animationHint="idle"
              demoClipName={demoClipName}
              compact={false}
              previewFrame="full_body"
              lightingMode="neutral"
              isFloorMovement={isFloorDemo}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent px-4 pb-4 pt-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Live Demo</p>
                  <p className="mt-1 text-sm font-black text-white">{exerciseName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formTips.slice(0, 2).map((tip) => (
                    <span
                      key={tip}
                      className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-bold text-white">No motion clip is mapped for this movement yet.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              The coaching layer is ready, but this exercise still needs a dedicated playable clip in the runtime pack.
            </p>
          </div>
        )}
      </div>

      <div className={`mt-4 grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"}`}>
        <div className="rounded-[1.35rem] border border-white/8 bg-slate-950/55 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Demo Pipeline</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{demoDescriptor.summary}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{demoDescriptor.detail}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoDescriptor.demoFamily ? (
              <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
                {movementFamilyLabel}
              </span>
            ) : null}
            {trackingMode ? (
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                {cameraSupportLabel}
              </span>
            ) : null}
          </div>
          {demoDescriptor.targetPath ? (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-slate-500">
              Target: {demoDescriptor.targetPath.replace("{avatar}", selectedAvatar.toLowerCase())}
            </p>
          ) : null}
        </div>
        <div className="rounded-[1.35rem] border border-white/8 bg-slate-950/55 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Form Priorities</p>
          <div className="mt-3 grid gap-2">
            {formTips.map((tip, index) => (
              <div
                key={tip}
                className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-slate-900/75 px-3 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-[11px] font-black text-cyan-100">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-slate-200">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
