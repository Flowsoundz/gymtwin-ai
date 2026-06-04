"use client";

import { useEffect, useRef } from "react";
import { buildCoachUtterance } from "@/lib/coachSpeech";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachAvatar, CoachTalkativeness } from "@/types";

type RepQualityLabel = "clean" | "shallow" | "unstable" | "lost_tracking" | "unknown" | null | undefined;

type Props = {
  repCount: number;
  repQualityLabel: RepQualityLabel;
  exerciseName: string;
  talkativeness: CoachTalkativeness;
  repCountingEnabled: boolean;
  isMuted: boolean;
  isCameraActive: boolean;
  selectedAvatar?: CoachAvatar;
  onAnimHint?: (hint: CoachAnimationHint) => void;
};

const QUIET_REP_MILESTONES = new Set([5, 10, 15, 20, 25]);
const HYPE_PHRASES: Record<number, string> = {
  1:  "Let's go! First rep down.",
  5:  "Five reps! You're moving.",
  10: "Ten reps! Halfway — keep it clean.",
  15: "Fifteen! Dig in.",
  20: "Twenty reps! Beast mode.",
  25: "Twenty-five! Incredible work.",
};
const NORMAL_PHRASES: Record<number, string> = {
  5:  "Five reps.",
  10: "Ten reps.",
  15: "Fifteen.",
  20: "Twenty.",
  25: "Twenty-five. Strong set.",
};

const FORM_CUE_QUIET: Record<NonNullable<Exclude<RepQualityLabel, null | undefined>>, string | null> = {
  clean:         null,
  shallow:       "Go a bit deeper.",
  unstable:      "Slow it down.",
  lost_tracking: null,
  unknown:       null,
};
const FORM_CUE_NORMAL: typeof FORM_CUE_QUIET = {
  clean:         "Clean rep!",
  shallow:       "A little deeper on that one.",
  unstable:      "Control the movement.",
  lost_tracking: null,
  unknown:       null,
};
const FORM_CUE_HYPE: typeof FORM_CUE_QUIET = {
  clean:         "Beautiful! Perfect form.",
  shallow:       "Deeper — you've got the range.",
  unstable:      "Lock it in, you can do this.",
  lost_tracking: null,
  unknown:       null,
};

function speakLine(text: string, avatar: CoachAvatar = "Nova") {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utt = buildCoachUtterance(text, avatar, "distance");
  synth.speak(utt);
}

export function useRepSpeech({
  repCount,
  repQualityLabel,
  talkativeness,
  repCountingEnabled,
  isMuted,
  isCameraActive,
  selectedAvatar = "Nova",
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

    // Determine if this rep count warrants a spoken announcement
    let milestoneText: string | null = null;
    if (talkativeness === "hype") {
      milestoneText = HYPE_PHRASES[repCount] ?? null;
    } else if (talkativeness === "normal") {
      milestoneText = NORMAL_PHRASES[repCount] ?? null;
    } else {
      milestoneText = QUIET_REP_MILESTONES.has(repCount) ? `${repCount} reps.` : null;
    }

    if (milestoneText) {
      speakLine(milestoneText, selectedAvatar);
      onAnimHint?.("thumbs_up");
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
      animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 2500);
    }
  }, [repCount, repCountingEnabled, isMuted, isCameraActive, talkativeness, selectedAvatar, onAnimHint]);

  useEffect(() => {
    if (!repCountingEnabled || isMuted || !isCameraActive) return;
    if (repQualityLabel === prevQuality.current) return;
    prevQuality.current = repQualityLabel;
    if (!repQualityLabel || repQualityLabel === "unknown" || repQualityLabel === "lost_tracking") return;

    const cueMap =
      talkativeness === "quiet"
        ? FORM_CUE_QUIET
        : talkativeness === "hype"
          ? FORM_CUE_HYPE
          : FORM_CUE_NORMAL;

    const cue = cueMap[repQualityLabel];
    if (!cue) return;

    speakLine(cue, selectedAvatar);

    if (repQualityLabel === "clean") {
      onAnimHint?.("thumbs_up");
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
      animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 2500);
    } else if (repQualityLabel === "shallow" || repQualityLabel === "unstable") {
      onAnimHint?.("warning");
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
      animHintTimer.current = setTimeout(() => onAnimHint?.("idle"), 3000);
    }
  }, [repQualityLabel, repCountingEnabled, isMuted, isCameraActive, talkativeness, selectedAvatar, onAnimHint]);

  useEffect(() => {
    return () => {
      if (animHintTimer.current) clearTimeout(animHintTimer.current);
    };
  }, []);
}
