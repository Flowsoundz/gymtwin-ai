"use client";

import type { CoachAvatar } from "@/types";

type SpeechEmphasis = "standard" | "distance";

type SpeechProfile = {
  rate: number;
  pitch: number;
  volume: number;
};

const DISTANCE_PROFILE: Record<CoachAvatar, SpeechProfile> = {
  Nova: { rate: 0.9, pitch: 1.0, volume: 1 },
  Atlas: { rate: 0.86, pitch: 0.82, volume: 1 },
};

const STANDARD_PROFILE: Record<CoachAvatar, SpeechProfile> = {
  Nova: { rate: 0.93, pitch: 1.05, volume: 0.94 },
  Atlas: { rate: 0.98, pitch: 0.88, volume: 0.96 },
};

function scoreVoice(name: string, avatar: CoachAvatar): number {
  const lowered = name.toLowerCase();

  if (avatar === "Nova") {
    if (lowered.includes("samantha")) return 100;
    if (lowered.includes("karen")) return 96;
    if (lowered.includes("moira")) return 92;
    if (lowered.includes("google") && lowered.includes("female")) return 88;
    if (lowered.includes("female") || lowered.includes("woman")) return 80;
    return 0;
  }

  if (lowered.includes("alex")) return 100;
  if (lowered.includes("daniel")) return 96;
  if (lowered.includes("fred")) return 92;
  if (lowered.includes("google") && lowered.includes("male")) return 88;
  if (lowered.includes("male") || lowered.includes("man")) return 80;
  return 0;
}

export function pickCoachVoice(avatar: CoachAvatar): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  if (!voices.length) return null;

  return (
    voices
      .map((voice) => ({ voice, score: scoreVoice(voice.name, avatar) }))
      .sort((a, b) => b.score - a.score)[0]?.voice ?? voices[0]
  );
}

export function buildCoachUtterance(
  phrase: string,
  avatar: CoachAvatar = "Nova",
  emphasis: SpeechEmphasis = "distance"
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(phrase);
  const profile = emphasis === "distance" ? DISTANCE_PROFILE[avatar] : STANDARD_PROFILE[avatar];
  const voice = pickCoachVoice(avatar);

  if (voice) utterance.voice = voice;
  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  utterance.volume = profile.volume;

  return utterance;
}

