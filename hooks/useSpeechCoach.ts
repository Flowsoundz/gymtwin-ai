"use client";

import { useCoachVoice } from "@/hooks/useCoachVoice";
import type { CoachAvatar, CoachName, WorkoutAudioLevel } from "@/types";
import type { CoachVoicePriority, CoachVoiceIntent } from "@/lib/voice/voiceIntents";

export function useSpeechCoach(
  selectedCoach: CoachName,
  selectedAvatar: CoachAvatar = "Nova",
  coachVoiceVolume: WorkoutAudioLevel = "normal",
  audioEnabled = true
) {
  const {
    isMuted,
    setIsMuted,
    displayedSpeech,
    setDisplayedSpeech,
    speakText,
    speakIntent,
  } = useCoachVoice(
    {
      selectedCoach,
      selectedAvatar,
      coachVoiceVolume,
    },
    audioEnabled
  );

  function speak(
    phrase: string,
    options?: {
      priority?: CoachVoicePriority;
      emphasis?: "standard" | "distance";
    }
  ) {
    speakText(
      phrase,
      options?.priority ?? "transition",
      options?.emphasis ?? "distance"
    );
  }

  function updateCoachLine(
    phase: "intro" | "action" | "recovery" | "outro",
    prefix?: string
  ): void {
    speakIntent({
      type: "coach_quote",
      phase,
      prefix,
      priority: phase === "recovery" ? "transition" : "encouragement",
    });
  }

  return {
    isMuted,
    setIsMuted,
    displayedSpeech,
    setDisplayedSpeech,
    speak,
    speakIntent: (intent: CoachVoiceIntent) => speakIntent(intent),
    updateCoachLine,
  };
}
