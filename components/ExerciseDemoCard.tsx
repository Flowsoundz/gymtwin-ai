import { Coach3D } from "@/components/Coach3D";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getExerciseDemoDescriptor } from "@/lib/exerciseDemoLibrary";
import { getCameraCoachLabel, getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
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

  return (
    <section
      className={`rounded-[1.7rem] border border-white/8 bg-white/6 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Exercise Demo</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{avatarLabel}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">AI Coach Demo Preview</p>
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

      {demoClipName ? (
        <div className="mt-4">
          <Coach3D
            selectedAvatar={selectedAvatar}
            animationHint="idle"
            demoClipName={demoClipName}
            compact
            previewFrame="full_body"
            lightingMode="neutral"
          />
        </div>
      ) : null}

      <div className="mt-4 rounded-[1.35rem] border border-white/8 bg-slate-950/55 px-4 py-4">
        <p className="text-sm font-bold text-white">{exerciseName}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {demoDescriptor.summary}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{demoDescriptor.detail}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {demoDescriptor.demoFamily ? (
            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
              {FAMILY_LABEL[demoDescriptor.demoFamily] ?? demoDescriptor.demoFamily}
            </span>
          ) : null}
          {trackingMode ? (
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
              {getCameraCoachLabel(trackingMode)}
            </span>
          ) : null}
          <span className={`rounded-full border bg-slate-900/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${sourceTone}`}>
            {sourceLabel}
          </span>
        </div>

        {demoDescriptor.targetPath ? (
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-slate-500">
            Target: {demoDescriptor.targetPath.replace("{avatar}", selectedAvatar.toLowerCase())}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Form Tips</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {formTips.map((tip) => (
            <span
              key={tip}
              className="rounded-full border border-white/10 bg-slate-900/75 px-3 py-1.5 text-xs font-bold text-slate-200"
            >
              {tip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
