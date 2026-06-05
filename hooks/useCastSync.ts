"use client";

import { useEffect, useRef } from "react";

export type CastPayload = {
  exerciseName: string;
  phase: string;
  currentReps: number;
  workingSet: number;
  totalSets: number;
  isRestPhase: boolean;
  restCountdown: number;
  exerciseCountdown: number;
  progressPercent: number;
  coachMessage: string;
  feedbackSeverity: "good" | "warning" | "error" | "neutral";
  elapsedMinutes: number;
};

const CHANNEL = "gymtwin_cast";
const THROTTLE_MS = 50; // 20Hz — smooth enough for countdown display

export function useCastSender(payload: CastPayload | null) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastPostRef = useRef<number>(0);
  const pendingRef = useRef<CastPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    channelRef.current = new BroadcastChannel(CHANNEL);
    return () => {
      channelRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!payload || !channelRef.current) return;

    const now = Date.now();
    const elapsed = now - lastPostRef.current;

    const dispatch = (p: CastPayload) => {
      channelRef.current?.postMessage(p);
      lastPostRef.current = Date.now();
      pendingRef.current = null;
    };

    if (elapsed >= THROTTLE_MS) {
      dispatch(payload);
    } else {
      pendingRef.current = payload;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) dispatch(pendingRef.current);
      }, THROTTLE_MS - elapsed);
    }
  });
}

export function useCastReceiver(onUpdate: (payload: CastPayload) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (e: MessageEvent<CastPayload>) => onUpdateRef.current(e.data);
    return () => channel.close();
  }, []);
}
