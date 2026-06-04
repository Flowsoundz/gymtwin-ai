"use client";

import Image from "next/image";
import { useMemo } from "react";
import { getAvatarAsset, getAvatarLabel, getAvatarRole, getAvatarSubtitle } from "@/lib/avatarAssets";
import type { CoachAvatar } from "@/types";

export type FloatingCoachMood =
  | "idle"
  | "listening"
  | "coaching"
  | "good"
  | "warning"
  | "error"
  | "celebrating";

type FloatingCoachAvatarProps = {
  selectedAvatar: CoachAvatar;
  mood?: FloatingCoachMood;
  message?: string;
  position?: "bottom-right" | "bottom-left" | "stage-overlay" | "inline";
  compact?: boolean;
  emphasis?: "standard" | "focus";
};

export function FloatingCoachAvatar({
  selectedAvatar,
  mood = "idle",
  message,
  position = "inline",
  compact = false,
  emphasis = "standard",
}: FloatingCoachAvatarProps) {
  const avatarAsset = getAvatarAsset(selectedAvatar);
  const avatarLabel = getAvatarLabel(selectedAvatar);
  const avatarSubtitle = getAvatarSubtitle(selectedAvatar);
  const avatarRole = getAvatarRole(selectedAvatar);

  const moodMeta = useMemo(() => {
    switch (mood) {
      case "good":
        return {
          shell: "border-emerald-400/32 bg-slate-950/84 shadow-[0_0_42px_rgba(16,185,129,0.16)]",
          gradient: "from-emerald-500/30 via-blue-500/18 to-slate-950",
          badge: "Good Form",
          badgeClass: "border-emerald-400/28 bg-emerald-500/12 text-emerald-100",
        };
      case "warning":
        return {
          shell: "border-cyan-400/32 bg-slate-950/84 shadow-[0_0_42px_rgba(34,211,238,0.16)]",
          gradient: "from-cyan-500/28 via-fuchsia-500/14 to-slate-950",
          badge: "Adjust",
          badgeClass: "border-cyan-400/28 bg-cyan-500/12 text-cyan-100",
        };
      case "error":
        return {
          shell: "border-red-400/32 bg-slate-950/86 shadow-[0_0_42px_rgba(239,68,68,0.16)]",
          gradient: "from-red-500/28 via-fuchsia-500/12 to-slate-950",
          badge: "Alert",
          badgeClass: "border-red-400/28 bg-red-500/12 text-red-100",
        };
      case "listening":
        return {
          shell: "border-blue-400/34 bg-slate-950/84 shadow-[0_0_44px_rgba(59,130,246,0.18)]",
          gradient: "from-blue-500/30 via-indigo-500/18 to-slate-950",
          badge: "Listening",
          badgeClass: "border-blue-400/28 bg-blue-500/12 text-blue-100",
        };
      case "celebrating":
        return {
          shell: "border-fuchsia-400/34 bg-slate-950/84 shadow-[0_0_46px_rgba(168,85,247,0.18)]",
          gradient: "from-fuchsia-500/30 via-blue-500/18 to-slate-950",
          badge: "Celebrating",
          badgeClass: "border-fuchsia-400/28 bg-fuchsia-500/12 text-fuchsia-100",
        };
      case "coaching":
        return {
          shell: "border-violet-400/32 bg-slate-950/84 shadow-[0_0_42px_rgba(129,140,248,0.17)]",
          gradient: "from-violet-500/28 via-blue-500/18 to-slate-950",
          badge: "Coaching",
          badgeClass: "border-violet-400/28 bg-violet-500/12 text-violet-100",
        };
      default:
        return {
          shell: "border-purple-500/30 bg-slate-950/82 shadow-[0_0_40px_rgba(99,102,241,0.16)]",
          gradient: "from-blue-500/26 via-indigo-500/18 to-slate-950",
          badge: "Idle",
          badgeClass: "border-slate-600/60 bg-slate-900/72 text-slate-200",
        };
    }
  }, [mood]);

  const animationClass =
    mood === "celebrating"
      ? "coach-celebrate"
      : mood === "listening"
        ? "coach-float coach-pulse"
        : "coach-float";

  const wrapperClass =
    position === "bottom-right"
      ? "ml-auto"
      : position === "bottom-left"
        ? "mr-auto"
        : position === "stage-overlay"
          ? "w-full max-w-[14rem] sm:max-w-[17rem]"
          : "w-full";

  const isFocus = emphasis === "focus";
  const avatarSize = compact
    ? "h-12 w-12 rounded-[1.1rem]"
    : isFocus
      ? "h-18 w-18 rounded-[1.45rem] sm:h-20 sm:w-20"
      : "h-16 w-16 rounded-[1.3rem]";
  const cardPadding = compact ? "p-3" : isFocus ? "p-4 sm:p-[1.125rem]" : "p-4";
  const messageClass = compact ? "text-xs leading-relaxed" : isFocus ? "text-sm leading-relaxed sm:text-[15px]" : "text-sm leading-relaxed";
  const bubbleClass = compact
    ? "mt-2.5 rounded-[1rem] px-3 py-2"
    : "mt-3 rounded-[1.1rem] px-3 py-2.5";
  const subtitleClass = compact ? "text-[11px]" : "text-xs";

  return (
    <div className={`${wrapperClass} ${animationClass}`}>
      <div className={`rounded-[1.75rem] border ${moodMeta.shell} ${cardPadding} backdrop-blur-md`}>
        <div className="flex items-start gap-3">
          <div className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/12 bg-gradient-to-br ${moodMeta.gradient} ${avatarSize} shadow-[0_0_28px_rgba(99,102,241,0.22)]`}>
            <div className="absolute inset-0 coach-pulse opacity-80" />
            <div className="absolute inset-[6%] rounded-[inherit] border border-white/10" />
            <Image
              src={avatarAsset}
              alt={`${avatarLabel} avatar`}
              fill
              sizes={compact ? "48px" : isFocus ? "80px" : "64px"}
              className="object-cover object-[center_20%]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
              <div className="flex items-center gap-0.5 text-[11px] font-black tracking-tight text-white">
                <span>G</span>
                <span className="text-blue-300">T</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{avatarLabel} • {avatarSubtitle}</p>
                <p className="mt-1 text-sm font-bold text-slate-100">{avatarRole}</p>
                <p className={`mt-1 font-medium text-slate-400 ${subtitleClass}`}>{selectedAvatar === "Nova" ? "Precision, posture, confidence." : "Power, cadence, consistency."}</p>
              </div>
              <div className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${moodMeta.badgeClass}`}>
                {moodMeta.badge}
              </div>
            </div>

            {message ? (
              <div className={`${bubbleClass} border border-white/8 bg-white/6`}>
                <p className={`${messageClass} whitespace-pre-line text-slate-100`}>{message}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
