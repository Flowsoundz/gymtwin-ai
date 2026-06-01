"use client";

import { useState } from "react";
import { getCoachQuote } from "@/lib/coachEngine";
import type { CoachAvatar, CoachName } from "@/types";

function pickVoice(avatar: CoachAvatar): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  if (!voices.length) return null;

  if (avatar === "Nova") {
    // Calm, clear female voice
    return (
      voices.find((v) => v.name === "Samantha") ??
      voices.find((v) => v.name === "Karen") ??
      voices.find((v) => v.name === "Moira") ??
      voices.find((v) => /female|woman/i.test(v.name)) ??
      voices.find((v) => v.name.includes("Google") && v.name.includes("Female")) ??
      voices[0]
    );
  }
  // Atlas — firm male voice
  return (
    voices.find((v) => v.name === "Alex") ??
    voices.find((v) => v.name === "Daniel") ??
    voices.find((v) => v.name === "Fred") ??
    voices.find((v) => /male|man/i.test(v.name)) ??
    voices.find((v) => v.name.includes("Google") && v.name.includes("Male")) ??
    voices[0]
  );
}

export function useSpeechCoach(selectedCoach: CoachName, selectedAvatar: CoachAvatar = "Nova") {
  const [isMuted, setIsMuted] = useState(false);
  const [displayedSpeech, setDisplayedSpeech] = useState(
    "Choose your coach and start your training session."
  );

  function speak(phrase: string) {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    const voice = pickVoice(selectedAvatar);
    if (voice) utterance.voice = voice;
    utterance.rate = selectedAvatar === "Atlas" ? 1.0 : 0.93;
    utterance.pitch = selectedAvatar === "Atlas" ? 0.88 : 1.05;
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
