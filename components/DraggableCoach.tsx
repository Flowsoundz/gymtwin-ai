"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Coach3D } from "@/components/Coach3D";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachAvatar } from "@/types";

type Props = {
  selectedAvatar: CoachAvatar;
  animationHint?: CoachAnimationHint;
  demoClipName?: string | null;
  message?: string | null;
};

const STORAGE_KEY = "gt_floating_coach_v2";

type SavedState = { x: number; y: number; minimized: boolean };

function readSaved(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    return null;
  }
}

function writeSaved(data: SavedState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

function getInitialCoachState(): SavedState {
  const saved = readSaved();
  if (saved) return saved;

  return {
    x: typeof window !== "undefined" ? window.innerWidth - 200 : 20,
    y: typeof window !== "undefined" ? window.innerHeight - 360 : 80,
    minimized: false,
  };
}

export function DraggableCoach({
  selectedAvatar,
  animationHint = "idle",
  demoClipName,
  message,
}: Props) {
  const initialState = getInitialCoachState();
  const [pos, setPos] = useState({ x: initialState.x, y: initialState.y });
  const [minimized, setMinimized] = useState(initialState.minimized);
  const posRef = useRef(pos);
  const minimizedRef = useRef(minimized);
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = typeof document !== "undefined";

  const persist = useCallback(() => {
    writeSaved({ ...posRef.current, minimized: minimizedRef.current });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: posRef.current.x, py: posRef.current.y };
    containerRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const next = {
      x: Math.max(0, Math.min((typeof window !== "undefined" ? window.innerWidth : 800) - 160, origin.current.px + e.clientX - origin.current.mx)),
      y: Math.max(0, Math.min((typeof window !== "undefined" ? window.innerHeight : 600) - 80, origin.current.py + e.clientY - origin.current.my)),
    };
    posRef.current = next;
    setPos(next);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    persist();
  }, [persist]);

  const toggleMinimized = useCallback(() => {
    setMinimized((m) => {
      const next = !m;
      minimizedRef.current = next;
      persist();
      return next;
    });
  }, [persist]);

  if (!mounted) return null;

  const isExercising = Boolean(demoClipName);
  const previewFrame = isExercising ? "full_body" : "bust";
  const truncatedMessage = message && message.length > 70 ? message.slice(0, 70) + "…" : message;

  const widget = (
    <div
      ref={containerRef}
      className="fixed z-40 select-none"
      style={{ left: pos.x, top: pos.y, touchAction: "none", cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {minimized ? (
        <button
          onClick={toggleMinimized}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-blue-400/35 bg-slate-950/92 shadow-[0_0_28px_rgba(99,102,241,0.35)] backdrop-blur-md transition hover:border-blue-400/55 hover:shadow-[0_0_36px_rgba(99,102,241,0.45)]"
        >
          <div className="text-xs font-black tracking-tight">
            <span className="text-blue-300">G</span>
            <span className="text-fuchsia-300">T</span>
          </div>
        </button>
      ) : (
        <div className="relative w-44 overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/88 shadow-[0_8px_40px_rgba(15,23,42,0.6),0_0_32px_rgba(99,102,241,0.18)] backdrop-blur-xl">
          {/* drag handle glow line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />

          {/* minimize button */}
          <button
            onClick={toggleMinimized}
            className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-slate-900/85 text-[11px] leading-none text-slate-400 transition hover:border-white/28 hover:text-white"
          >
            −
          </button>

          {/* 3D coach */}
          <Coach3D
            selectedAvatar={selectedAvatar}
            animationHint={animationHint}
            demoClipName={demoClipName}
            previewFrame={previewFrame}
            animate={isExercising}
            compact
            message={message}
            lightingMode="neutral"
          />

          {/* speech bubble */}
          {truncatedMessage ? (
            <div className="border-t border-white/6 px-3 pb-3 pt-2">
              <p className="text-[11px] leading-relaxed text-slate-200">{truncatedMessage}</p>
            </div>
          ) : null}

          {/* exercise mode indicator */}
          {isExercising ? (
            <div className="absolute bottom-2.5 right-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">Live</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return createPortal(widget, document.body);
}
