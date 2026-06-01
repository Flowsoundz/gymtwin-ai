"use client";

import { useEffect, useRef, useState } from "react";

export function useCoachSpeech(message: string | null | undefined): { isSpeaking: boolean } {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message || message === lastMessageRef.current) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    lastMessageRef.current = message;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(message);
    utter.rate = 0.92;
    utter.pitch = 1.08;
    utter.volume = 0.9;

    // Best-effort voice selection — runs after voices are populated
    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes("Samantha") ||
          v.name.includes("Google US English") ||
          v.name.includes("Karen") ||
          v.name.includes("Zira")
      );
      if (preferred) utter.voice = preferred;
    };
    applyVoice();
    if (!utter.voice && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", applyVoice, { once: true });
    }

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [message]);

  return { isSpeaking };
}
