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

export function useCastSender(payload: CastPayload | null) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    channelRef.current = new BroadcastChannel(CHANNEL);
    return () => channelRef.current?.close();
  }, []);

  // No deps — posts on every render; workout timers drive ~1Hz re-renders anyway
  useEffect(() => {
    if (!payload || !channelRef.current) return;
    channelRef.current.postMessage(payload);
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
