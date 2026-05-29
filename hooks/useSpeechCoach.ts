"use client";

import { useState } from "react";
import { getCoachQuote } from "@/lib/coachEngine";
import type { CoachName } from "@/types";

export function useSpeechCoach(selectedCoach: CoachName) {
  const [isMuted, setIsMuted] = useState(false);
  const [displayedSpeech, setDisplayedSpeech] = useState(
    "Choose your coach and start your training session."
  );

  function speak(phrase: string) {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function updateCoachLine(
    phase: "intro" | "action" | "recovery" | "outro",
    prefix?: string
  ): void {
    const quote = getCoachQuote(selectedCoach, phase);
    const fullLine = prefix ? `${prefix} ${quote}` : quote;
    setDisplayedSpeech(fullLine);
    speak(fullLine);
  }

  return {
    isMuted,
    setIsMuted,
    displayedSpeech,
    setDisplayedSpeech,
    speak,
    updateCoachLine,
  };
}
