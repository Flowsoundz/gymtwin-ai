"use client";

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
  animationHint: _animationHint = "idle",
}: Coach3DPlaceholderProps) {
  void _animationHint;
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

      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0f172a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(180deg,rgba(30,41,59,0.08),rgba(15,23,42,0.34)_100%)]" />
        <div className="relative flex h-[320px] items-end justify-center overflow-hidden">
          <div className="absolute bottom-5 h-24 w-64 rounded-[50%] bg-slate-300/12 blur-sm" />
          <div className="absolute bottom-7 h-16 w-44 rounded-[50%] border border-white/10 bg-white/5" />
          <div className="relative flex h-[78%] w-28 flex-col items-center justify-end sm:w-32">
            <div className="mb-2 h-14 w-14 rounded-full border border-white/14 bg-gradient-to-br from-blue-400/30 via-slate-700/60 to-slate-900/80 shadow-[0_0_24px_rgba(99,102,241,0.28)] sm:h-16 sm:w-16" />
            <div className="h-36 w-24 rounded-t-[2.4rem] border border-white/10 bg-gradient-to-b from-slate-700/60 via-slate-800/70 to-transparent sm:h-40 sm:w-28" />
          </div>
        </div>
        <div className="border-t border-white/6 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Fallback Preview</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Lightweight placeholder shown when the 3D coach is unavailable or intentionally disabled.
          </p>
        </div>
      </div>
    </section>
  );
}
