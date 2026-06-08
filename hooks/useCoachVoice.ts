"use client";

import { useMemo, useRef, useState } from "react";
import { buildCoachUtterance } from "@/lib/coachSpeech";
import {
  ENABLE_ELEVENLABS_VOICE,
  requestElevenLabsVoiceClip,
} from "@/lib/voice/elevenlabsClient";
import { getCoachVoicePriorityScore } from "@/lib/voice/voicePriority";
import { resolveCoachVoiceIntent } from "@/lib/voice/voiceResolver";
import type {
  CoachVoiceContext,
  CoachVoiceIntent,
  CoachVoicePriority,
} from "@/lib/voice/voiceIntents";

export function useCoachVoice(context: CoachVoiceContext) {
  const [isMuted, setIsMuted] = useState(false);
  const [displayedSpeech, setDisplayedSpeech] = useState(
    "Choose your coach and start your training session."
  );
  const activePriorityRef = useRef<CoachVoicePriority | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const stableContext = useMemo(() => context, [context]);

  function clearPriority() {
    activePriorityRef.current = null;
  }

  function stopCurrentPlayback() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    clearPriority();
  }

  function shouldInterrupt(nextPriority: CoachVoicePriority): boolean {
    if (!activePriorityRef.current) return true;
    return (
      getCoachVoicePriorityScore(nextPriority) >=
      getCoachVoicePriorityScore(activePriorityRef.current)
    );
  }

  function speakIntent(intent: CoachVoiceIntent) {
    const resolved = resolveCoachVoiceIntent(intent, stableContext);
    if (!resolved) return;

    setDisplayedSpeech(resolved.caption);
    if (isMuted) return;
    if (!shouldInterrupt(resolved.priority)) return;

    stopCurrentPlayback();
    activePriorityRef.current = resolved.priority;

    const fallbackToTts = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        clearPriority();
        return;
      }
      const utterance = buildCoachUtterance(
        resolved.text,
        stableContext.selectedAvatar,
        resolved.emphasis,
        stableContext.coachVoiceVolume
      );
      utterance.onend = () => clearPriority();
      utterance.onerror = () => clearPriority();
      window.speechSynthesis.speak(utterance);
    };

    const playBlobAudio = (blob: Blob) => {
      if (typeof window === "undefined") {
        clearPriority();
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      activeAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        clearPriority();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        fallbackToTts();
      };
      void audio.play().catch(() => {
        URL.revokeObjectURL(objectUrl);
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        fallbackToTts();
      });
    };

    if (resolved.clipUrl && typeof window !== "undefined") {
      const audio = new Audio(resolved.clipUrl);
      activeAudioRef.current = audio;
      audio.onended = () => {
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        clearPriority();
      };
      audio.onerror = () => {
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        fallbackToTts();
      };
      void audio.play().catch(() => {
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        fallbackToTts();
      });
      return;
    }

    if (ENABLE_ELEVENLABS_VOICE) {
      void requestElevenLabsVoiceClip({
        text: resolved.text,
        avatar: stableContext.selectedAvatar,
        emphasis: resolved.emphasis,
      })
        .then((blob) => {
          if (!blob) {
            fallbackToTts();
            return;
          }
          playBlobAudio(blob);
        })
        .catch(() => fallbackToTts());
      return;
    }

    fallbackToTts();
  }

  function speakText(
    phrase: string,
    priority: CoachVoicePriority = "transition",
    emphasis: "standard" | "distance" = "distance"
  ) {
    speakIntent({ type: "direct_text", text: phrase, priority, emphasis });
  }

  return {
    isMuted,
    setIsMuted,
    displayedSpeech,
    setDisplayedSpeech,
    speakIntent,
    speakText,
    stopCurrentPlayback,
  };
}
