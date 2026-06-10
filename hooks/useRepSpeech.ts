"use client";

import { useEffect, useRef } from "react";
import type { CoachVoiceIntent } from "@/lib/voice/voiceIntents";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachTalkativeness } from "@/types";

type RepQualityLabel = "clean" | "shallow" | "unstable" | "lost_tracking" | "unknown" | null | undefined;

type Props = {
  repCount: number;
  repQualityLabel: RepQualityLabel;
  talkativeness: CoachTalkativeness;
  repCountingEnabled: boolean;
  isMuted: boolean;
  isCameraActive: boolean;
  onSpeakIntent?: (intent: CoachVoiceIntent) => void;
  onAnimHint?: (hint: CoachAnimationHint) => void;
};

const QUIET_REP_MILESTONES = new Set([5, 10, 15, 20, 25]);
const NORMAL_REP_MILESTONES = new Set([5, 10, 15, 20, 25]);
const HYPE_REP_MILESTONES = new Set([1, 5, 10, 15, 20, 25]);
type SpeakableRepQualityLabel = "clean" | "shallow" | "unstable";

function shouldAnnounceRep(repCount: number, talkativeness: CoachTalkativeness): boolean {
  if (talkativeness === "hype") return HYPE_REP_MILESTONES.has(repCount);
  if (talkativeness === "normal") return NORMAL_REP_MILESTONES.has(repCount);
  return QUIET_REP_MILESTONES.has(repCount);
}

function shouldAnnounceForm(
  label: Exclude<RepQualityLabel, null | undefined>
): label is SpeakableRepQualityLabel {
  return label === "clean" || label === "shallow" || label === "unstable";
}

export function useRepSpeech({
  repCount,
  repQualityLabel,
  talkativeness,
  repCountingEnabled,
  isMuted,
  isCameraActive,
  onSpeakIntent,
  onAnimHint,
}: Props) {
  const prevRepCount = useRef(repCount);
  const prevQuality = useRef(repQualityLabel);
  const animHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!repCountingEnabled || isMuted || !isCameraActive) {
      prevRepCount.current = repCount;
      return;
    }

    const prev = prevRepCount.current;
    prevRepCount.current = repCount;

    if (repCount <= prev) return;
    if (!shouldAnnounceRep(repCount, talkativeness)) return;

    onSpeakIntent?.({
      type: "rep_milestone",
      repCount,
      talkativeness,
      priority: "encouragement",
    });
    onAnimHint?.("thumbs_up");
    if (animHintTimer.current) clearTimeout(animHintTimer.current);
    animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 2500);
  }, [repCount, repCountingEnabled, isMuted, isCameraActive, talkativeness, onSpeakIntent, onAnimHint]);

  useEffect(() => {
    if (!repCountingEnabled || isMuted || !isCameraActive) return;
    if (repQualityLabel === prevQuality.current) return;
    prevQuality.current = repQualityLabel;
    if (!repQualityLabel || !shouldAnnounceForm(repQualityLabel)) return;

    onSpeakIntent?.({
      type: "form_correction",
      label: repQualityLabel,
      talkativeness,
      priority: repQualityLabel === "clean" ? "encouragement" : "form_correction",
    });

    if (repQualityLabel === "clean") {
      onAnimHint?.("thumbs_up");
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
      animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 2500);
    } else if (repQualityLabel === "shallow" || repQualityLabel === "unstable") {
      onAnimHint?.("warning");
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
      animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 3000);
    }
  }, [repQualityLabel, repCountingEnabled, isMuted, isCameraActive, talkativeness, onSpeakIntent, onAnimHint]);

  useEffect(() => {
    return () => {
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
    };
  }, []);
}
