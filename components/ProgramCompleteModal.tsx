"use client";

import { useCallback, useState } from "react";
import type { TrainingProgram } from "@/lib/programs";

type Props = {
  program: TrainingProgram;
  workoutsCompleted: number;
  totalMinutes: number;
  /** "Beat Your Twin" improvement vs week 1, e.g. +34. */
  twinDeltaPct?: number | null;
  suggestedNext: TrainingProgram | null;
  onStartNext: (programId: string) => void;
  onClose: () => void;
};

// Renders the shareable 1080×1350 card on a canvas and returns it as a blob.
async function renderShareCard(program: TrainingProgram, workouts: number, minutes: number, twinDeltaPct?: number | null): Promise<Blob | null> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Backdrop — brand dark with neon glows
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#070d1a"); bg.addColorStop(1, "#020617");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, 600);
  glow1.addColorStop(0, "rgba(34,211,238,0.22)"); glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(W * 0.85, H * 0.8, 0, W * 0.85, H * 0.8, 700);
  glow2.addColorStop(0, "rgba(168,85,247,0.25)"); glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);

  // Logo
  try {
    const logo = new Image();
    logo.src = "/brand/gymtwin-mark.png";
    await new Promise((res, rej) => { logo.onload = res; logo.onerror = rej; });
    ctx.drawImage(logo, W / 2 - 160, 70, 320, 320);
  } catch { /* card still works without the logo */ }

  ctx.textAlign = "center";
  ctx.fillStyle = "#67e8f9";
  ctx.font = "900 34px -apple-system, 'Helvetica Neue', sans-serif";
  ctx.fillText("P R O G R A M   C O M P L E T E", W / 2, 470);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 96px -apple-system, 'Helvetica Neue', sans-serif";
  ctx.fillText(`${program.emoji} ${program.name}`, W / 2, 600);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "700 40px -apple-system, 'Helvetica Neue', sans-serif";
  ctx.fillText(program.tagline, W / 2, 670);

  // Stat blocks
  const stats: Array<[string, string]> = [
    [`${program.weeks.length}`, "WEEKS"],
    [`${workouts}`, "WORKOUTS"],
    [`${minutes}`, "MINUTES"],
  ];
  const bw = 280, gap = 40, x0 = W / 2 - (bw * 3 + gap * 2) / 2;
  stats.forEach(([num, label], i) => {
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.roundRect(x, 760, bw, 220, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(34,211,238,0.25)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.fillText(num, x + bw / 2, 880);
    ctx.fillStyle = "#67e8f9";
    ctx.font = "900 26px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.fillText(label, x + bw / 2, 935);
  });

  if (typeof twinDeltaPct === "number" && twinDeltaPct > 0) {
    ctx.fillStyle = "#34d399";
    ctx.font = "900 58px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.fillText(`👥 +${twinDeltaPct}% vs my week-1 twin`, W / 2, 1100);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 38px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.fillText("Trained with an AI coach watching every rep.", W / 2, 1160);
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 44px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.fillText("Trained with an AI coach watching every rep.", W / 2, 1110);
  }

  ctx.fillStyle = "#a78bfa";
  ctx.font = "900 48px -apple-system, 'Helvetica Neue', sans-serif";
  ctx.fillText("gymtwinai.com", W / 2, 1230);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function ProgramCompleteModal({ program, workoutsCompleted, totalMinutes, twinDeltaPct, suggestedNext, onStartNext, onClose }: Props) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await renderShareCard(program, workoutsCompleted, totalMinutes, twinDeltaPct);
      if (!blob) return;
      const download = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `gymtwin-${program.id}-complete.png`;
        a.click();
        URL.revokeObjectURL(url);
        setShared(true);
      };
      const file = new File([blob], `gymtwin-${program.id}-complete.png`, { type: "image/png" });
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${program.name} — complete!`,
            text: `Just finished the ${program.name} program on GymTwin AI 💪`,
          });
          setShared(true);
        } catch (err) {
          // User dismissing the sheet is fine; anything else (e.g. expired
          // user-activation after the async canvas render) falls back to a save.
          if ((err as Error)?.name !== "AbortError") download();
        }
      } else {
        download();
      }
    } finally {
      setSharing(false);
    }
  }, [program, workoutsCompleted, totalMinutes]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-950/95 p-6 text-center shadow-[0_0_80px_rgba(34,211,238,0.18)]">
        {/* celebration sparkles */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 animate-ping rounded-full"
              style={{
                left: `${8 + (i * 83) % 84}%`,
                top: `${6 + (i * 47) % 86}%`,
                backgroundColor: i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a855f7" : "#f0abfc",
                animationDelay: `${(i % 5) * 0.35}s`,
                animationDuration: "1.8s",
              }}
            />
          ))}
        </div>

        <p className="text-5xl">{program.emoji}</p>
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">Program Complete</p>
        <h2 className="mt-2 text-2xl font-black text-white">{program.name}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {program.weeks.length} weeks · {workoutsCompleted} workouts · {totalMinutes} min trained
        </p>
        {typeof twinDeltaPct === "number" && twinDeltaPct > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-300">
            👥 +{twinDeltaPct}% faster than your week-1 twin
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={() => void handleShare()}
            disabled={sharing}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3.5 text-sm font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {sharing ? "Building your card…" : shared ? "Shared ✓ — share again" : "📸 Share your card"}
          </button>
          {suggestedNext && (
            <button
              onClick={() => onStartNext(suggestedNext.id)}
              className="w-full rounded-2xl border border-violet-400/30 bg-violet-500/12 py-3.5 text-sm font-black text-violet-200 transition hover:bg-violet-500/20 active:scale-[0.98]"
            >
              Next up: {suggestedNext.emoji} {suggestedNext.name} →
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-400 transition hover:text-white active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
