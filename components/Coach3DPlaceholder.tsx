"use client";

import { Coach3D } from "@/components/Coach3D";
import type { Coach3DMood } from "@/components/Coach3D";
import { getAvatarLabel, getAvatarRole, getAvatarSubtitle } from "@/lib/avatarAssets";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachAvatar } from "@/types";

type Coach3DPlaceholderProps = {
  selectedAvatar: CoachAvatar;
  mood?: Coach3DMood;
  animationHint?: CoachAnimationHint;
};

export function Coach3DPlaceholder({
  selectedAvatar,
  mood = "idle",
  animationHint = "idle",
}: Coach3DPlaceholderProps) {
  const avatarLabel = getAvatarLabel(selectedAvatar);
  const avatarSubtitle = getAvatarSubtitle(selectedAvatar);
  const avatarRole = getAvatarRole(selectedAvatar);
  const moodLabel =
    mood === "coaching"
      ? "Coaching"
      : mood === "good"
        ? "Good"
        : mood === "warning"
          ? "Warning"
          : mood === "error"
            ? "Error"
            : mood === "listening"
              ? "Listening"
              : mood === "celebrating"
                ? "Celebrating"
                : "Idle";

  return (
    <section
      aria-label="3D coach placeholder"
      className="rounded-[1.75rem] border border-white/8 bg-slate-950/70 p-4 backdrop-blur-xl shadow-[0_18px_50px_rgba(15,23,42,0.45)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">3D Coach Preview</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{avatarLabel}</h3>
          <p className="mt-1 text-xs text-slate-400">{avatarSubtitle} • {avatarRole}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">
          {moodLabel}
        </div>
      </div>

      <Coach3D selectedAvatar={selectedAvatar} mood={mood} animationHint={animationHint} />
    </section>
  );
}
