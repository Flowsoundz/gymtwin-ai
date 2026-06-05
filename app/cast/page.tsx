"use client";

import { useState, useCallback } from "react";
import { useCastReceiver, type CastPayload } from "@/hooks/useCastSync";

function pad(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function clock(s: number) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export default function CastPage() {
  const [state, setState] = useState<CastPayload | null>(null);

  const handleUpdate = useCallback((payload: CastPayload) => {
    setState(payload);
  }, []);

  useCastReceiver(handleUpdate);

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617] text-white">
        <span className="mb-5 inline-block h-4 w-4 animate-pulse rounded-full bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.6)]" />
        <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Waiting for workout…</p>
        <p className="mt-2 text-xs text-slate-700">Start a session on your device to sync</p>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">GymTwin AI · Cast View</p>
      </div>
    );
  }

  const borderGlow =
    state.feedbackSeverity === "good"
      ? "border-emerald-400/50 shadow-[inset_0_0_80px_rgba(16,185,129,0.08)]"
      : state.feedbackSeverity === "error"
        ? "border-red-500/50 shadow-[inset_0_0_80px_rgba(239,68,68,0.08)]"
        : state.feedbackSeverity === "warning"
          ? "border-cyan-400/50 shadow-[inset_0_0_80px_rgba(34,211,238,0.06)]"
          : "border-white/0";

  const formIcon =
    state.feedbackSeverity === "good"    ? { symbol: "✓", label: "Good form",    color: "text-emerald-400" } :
    state.feedbackSeverity === "error"   ? { symbol: "!", label: "Fix form",      color: "text-red-400"     } :
    state.feedbackSeverity === "warning" ? { symbol: "△", label: "Check form",   color: "text-cyan-400"    } :
    null;

  return (
    <div className={`flex min-h-screen flex-col bg-[#020617] text-white border-[3px] transition-all duration-700 ${borderGlow}`}>
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all duration-700"
          style={{ width: `${state.progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-14 pt-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-slate-700">GymTwin AI</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.3em] text-blue-500">{state.phase} phase</p>
        </div>
        <div className="flex items-center gap-5">
          <div className={`rounded-full border px-5 py-1.5 text-xs font-black uppercase tracking-[0.26em] ${
            state.isRestPhase
              ? "border-blue-400/30 bg-blue-950/40 text-blue-300"
              : "border-emerald-400/30 bg-emerald-950/40 text-emerald-300"
          }`}>
            {state.isRestPhase ? "Rest" : "Active"}
          </div>
          <p className="text-sm font-black text-slate-600">{state.elapsedMinutes} min</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col items-center justify-center px-14 text-center">
        {state.isRestPhase ? (
          <>
            <p className="text-3xl font-black uppercase tracking-[0.24em] text-slate-500">Rest</p>
            <div
              className="mt-4 font-mono font-black leading-none tracking-tighter text-transparent"
              style={{
                fontSize: "clamp(8rem, 22vw, 18rem)",
                backgroundImage: "linear-gradient(180deg, #60a5fa, #4f46e5)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              {clock(state.restCountdown)}
            </div>
            <p className="mt-8 text-3xl font-black text-slate-400">
              Up next: <span className="text-white">{state.exerciseName}</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-black uppercase tracking-[0.32em] text-blue-400">
              Set {state.workingSet} of {state.totalSets}
            </p>
            <h1
              className="mt-4 font-black leading-tight tracking-tight text-white"
              style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
            >
              {state.exerciseName}
            </h1>
            <div className="relative mt-6 flex items-center justify-center gap-6">
              <div
                className="font-mono font-black leading-none text-purple-400"
                style={{ fontSize: "clamp(10rem, 26vw, 20rem)" }}
              >
                {state.currentReps}
              </div>
              {formIcon && (
                <div className="flex flex-col items-center gap-1" aria-label={formIcon.label}>
                  <span className={`font-black leading-none ${formIcon.color}`} style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}>
                    {formIcon.symbol}
                  </span>
                  <span className={`text-xl font-black uppercase tracking-widest ${formIcon.color}`}>
                    {formIcon.label}
                  </span>
                </div>
              )}
            </div>
            <p className="text-4xl font-black uppercase tracking-[0.2em] text-slate-600">reps</p>

            {/* Set progress dots */}
            <div className="mt-8 flex items-center gap-3">
              {Array.from({ length: state.totalSets }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < state.workingSet - 1
                      ? "h-3 w-12 bg-purple-400"
                      : i === state.workingSet - 1
                        ? "h-3 w-12 bg-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.9)]"
                        : "h-3 w-7 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Coach strip */}
      {state.coachMessage ? (
        <div className="border-t border-white/6 px-14 py-7">
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-slate-700">Coach</p>
          <p className="mt-2 text-2xl font-semibold leading-relaxed text-slate-300">{state.coachMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
