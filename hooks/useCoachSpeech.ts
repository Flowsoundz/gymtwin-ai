"use client";

import { useEffect, useRef, useState } from "react";
import { buildCoachUtterance } from "@/lib/coachSpeech";

export function useCoachSpeech(message: string | null | undefined): { isSpeaking: boolean } {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message || message === lastMessageRef.current) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    lastMessageRef.current = message;
    window.speechSynthesis.cancel();

    const utter = buildCoachUtterance(message, "Nova", "distance");

    // Best-effort voice selection — runs after voices are populated
    const applyVoice = () => {
      const freshUtterance = buildCoachUtterance(message, "Nova", "distance");
      if (freshUtterance.voice) utter.voice = freshUtterance.voice;
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
