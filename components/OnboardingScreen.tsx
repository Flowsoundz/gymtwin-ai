"use client";

import { useState } from "react";
import type { CoachAvatar, CoachName, Equipment, WorkoutGoal, WorkoutLevel } from "@/types";
import { saveQuickStartDefaults, markOnboardingDone } from "@/lib/onboardingStorage";

const GOALS: { value: WorkoutGoal; emoji: string; label: string; sub: string }[] = [
  { value: "Lose weight",   emoji: "🔥", label: "Lose weight",   sub: "Fat burn & cardio" },
  { value: "Build muscle",  emoji: "💪", label: "Build muscle",  sub: "Strength & size" },
  { value: "Tone",          emoji: "✨", label: "Tone up",       sub: "Lean definition" },
  { value: "Mobility",      emoji: "🧘", label: "Mobility",      sub: "Flexibility & joints" },
  { value: "Stamina",       emoji: "⚡", label: "Stamina",       sub: "Endurance & energy" },
];

const LEVELS: { value: WorkoutLevel; label: string; sub: string }[] = [
  { value: "Beginner",     label: "Beginner",     sub: "New to working out" },
  { value: "Intermediate", label: "Intermediate", sub: "Training 2–4×/week" },
  { value: "Advanced",     label: "Advanced",     sub: "5+ years, intense training" },
];

const EQUIPMENT_LIST: { value: Equipment; emoji: string; label: string }[] = [
  { value: "None",              emoji: "🤸", label: "No equipment" },
  { value: "Dumbbells",         emoji: "🏋️", label: "Dumbbells" },
  { value: "Resistance Bands",  emoji: "🪢", label: "Bands" },
  { value: "Bench",             emoji: "🪑", label: "Bench" },
];

const COACHES: {
  avatar: CoachAvatar;
  coach: CoachName;
  name: string;
  tagline: string;
  description: string;
  color: string;
}[] = [
  {
    avatar: "Nova",
    coach: "Supportive",
    name: "Nova",
    tagline: "Your supportive coach",
    description: "Calm, encouraging, and focused on long-term progress. Nova keeps you motivated without the pressure.",
    color: "from-violet-600 to-blue-600",
  },
  {
    avatar: "Atlas",
    coach: "Intense",
    name: "Atlas",
    tagline: "Your intense trainer",
    description: "High energy, no excuses. Atlas pushes your limits and celebrates every rep you earn.",
    color: "from-orange-500 to-red-600",
  },
];

const SESSION_LENGTHS = ["15", "20", "30", "45"];

interface OnboardingScreenProps {
  onComplete: (data: {
    goal: WorkoutGoal;
    level: WorkoutLevel;
    equipment: Equipment;
    sessionLength: string;
    avatar: CoachAvatar;
    coach: CoachName;
  }) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  // Step 0 — goal
  const [goal, setGoal] = useState<WorkoutGoal | null>(null);

  // Step 1 — level + equipment + session
  const [level, setLevel] = useState<WorkoutLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment>("None");
  const [sessionLength, setSessionLength] = useState("20");

  // Step 2 — coach
  const [coachIdx, setCoachIdx] = useState(0);

  function canAdvance() {
    if (step === 0) return goal !== null;
    if (step === 1) return level !== null;
    return true;
  }

  function advance() {
    if (step < 2) { setStep(step + 1); return; }

    const chosen = COACHES[coachIdx];
    const defaults = {
      goal: goal!,
      level: level!,
      equipment,
      sessionLength,
      avatar: chosen.avatar,
      coach: chosen.coach,
    };
    saveQuickStartDefaults(defaults);
    markOnboardingDone();
    onComplete(defaults);
  }

  const totalSteps = 3;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-y-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-10 pb-4 shrink-0">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-6 bg-purple-500"
                : i < step
                ? "w-2 bg-purple-400/60"
                : "w-2 bg-slate-700"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-4">
        {/* ── Step 0: Goal ── */}
        {step === 0 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1">Step 1 of 3</p>
              <h1 className="text-2xl font-black text-white leading-tight">What's your main goal?</h1>
              <p className="text-sm text-slate-400 mt-1">We'll build a custom plan around this.</p>
            </div>
            <div className="flex flex-col gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all active:scale-95 ${
                    goal === g.value
                      ? "border-purple-500 bg-purple-500/15 shadow-[0_0_18px_rgba(139,92,246,0.25)]"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{g.label}</p>
                    <p className="text-xs text-slate-400">{g.sub}</p>
                  </div>
                  {goal === g.value && (
                    <span className="ml-auto text-purple-400 text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 1: Level + Equipment + Session ── */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1">Step 2 of 3</p>
              <h1 className="text-2xl font-black text-white leading-tight">Tell us about you</h1>
              <p className="text-sm text-slate-400 mt-1">So we can dial in the right intensity.</p>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Experience level</p>
            <div className="flex flex-col gap-2 mb-6">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-95 ${
                    level === l.value
                      ? "border-purple-500 bg-purple-500/15"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-bold text-white text-sm">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.sub}</p>
                  </div>
                  {level === l.value && <span className="text-purple-400">✓</span>}
                </button>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Equipment available</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {EQUIPMENT_LIST.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEquipment(e.value)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all active:scale-95 ${
                    equipment === e.value
                      ? "border-purple-500 bg-purple-500/15"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <span className="text-lg">{e.emoji}</span>
                  <span className="text-sm font-semibold text-white">{e.label}</span>
                </button>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Session length</p>
            <div className="flex gap-2">
              {SESSION_LENGTHS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSessionLength(s)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all active:scale-95 ${
                    sessionLength === s
                      ? "border-purple-500 bg-purple-500/15 text-purple-300"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {s} min
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Coach ── */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1">Step 3 of 3</p>
              <h1 className="text-2xl font-black text-white leading-tight">Pick your coach</h1>
              <p className="text-sm text-slate-400 mt-1">You can always switch later in Settings.</p>
            </div>
            <div className="flex flex-col gap-4">
              {COACHES.map((c, i) => (
                <button
                  key={c.avatar}
                  onClick={() => setCoachIdx(i)}
                  className={`rounded-2xl border p-5 text-left transition-all active:scale-95 ${
                    coachIdx === i
                      ? "border-purple-500 bg-purple-500/10 shadow-[0_0_18px_rgba(139,92,246,0.2)]"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-white text-base">{c.name}</p>
                      <p className={`text-xs font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
                        {c.tagline}
                      </p>
                    </div>
                    {coachIdx === i && (
                      <span className="mt-0.5 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-black text-purple-300">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-8" />

        {/* Navigation */}
        <div className="flex gap-3 pb-8 pt-4 shrink-0">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm font-bold text-slate-300 transition-all active:scale-95"
            >
              Back
            </button>
          )}
          <button
            onClick={advance}
            disabled={!canAdvance()}
            className={`flex-1 rounded-2xl py-4 text-sm font-black transition-all active:scale-95 ${
              canAdvance()
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_22px_rgba(139,92,246,0.42)]"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            }`}
          >
            {step < 2 ? "Continue" : "Let's go 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
