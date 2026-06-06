"use client";

import { useMemo, useState } from "react";
import type { CoachAvatar, CoachName, Equipment, WorkoutGoal, WorkoutLevel } from "@/types";
import { saveQuickStartDefaults, markOnboardingDone } from "@/lib/onboardingStorage";
import { CharacterViewer } from "@/components/CharacterViewer";
import { CHARACTERS } from "@/lib/characters";

const GOALS: { value: WorkoutGoal; emoji: string; label: string; sub: string }[] = [
  { value: "Lose weight", emoji: "🔥", label: "Lose weight", sub: "Fat burn, conditioning, and calorie-focused sessions" },
  { value: "Build muscle", emoji: "💪", label: "Build muscle", sub: "Strength-forward sessions with progressive volume" },
  { value: "Tone", emoji: "✨", label: "Tone up", sub: "Lean definition with balanced work and recovery" },
  { value: "Mobility", emoji: "🧘", label: "Mobility", sub: "Joint health, flexibility, and better range of motion" },
  { value: "Stamina", emoji: "⚡", label: "Stamina", sub: "Endurance and energy systems under controlled load" },
];

const LEVELS: { value: WorkoutLevel; label: string; sub: string; cue: string }[] = [
  { value: "Beginner", label: "Beginner", sub: "New to structured training", cue: "Lower complexity, cleaner pacing" },
  { value: "Intermediate", label: "Intermediate", sub: "Training 2–4x per week", cue: "Balanced workload and challenge" },
  { value: "Advanced", label: "Advanced", sub: "High consistency and capacity", cue: "Higher density and more intensity" },
];

const EQUIPMENT_LIST: { value: Equipment; emoji: string; label: string; sub: string }[] = [
  { value: "None", emoji: "🤸", label: "Bodyweight Only", sub: "Anywhere, no setup time" },
  { value: "Dumbbells", emoji: "🏋️", label: "Dumbbells", sub: "Classic strength builder" },
  { value: "Resistance Bands", emoji: "🪢", label: "Resistance Bands", sub: "Portable tension and activation" },
  { value: "Bench", emoji: "🪑", label: "Bench", sub: "More support and movement variety" },
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
    tagline: "Supportive coach",
    description: "Calm, clear, and encouraging. Nova emphasizes form, consistency, and sustainable progress.",
    color: "from-violet-600 to-blue-600",
  },
  {
    avatar: "Atlas",
    coach: "Intense",
    name: "Atlas",
    tagline: "Performance coach",
    description: "Direct, high-energy, and demanding. Atlas leans into output, intensity, and momentum.",
    color: "from-fuchsia-500 to-red-600",
  },
];

const SESSION_LENGTHS = [
  { value: "15", label: "15 min", sub: "Fast hit" },
  { value: "20", label: "20 min", sub: "Daily default" },
  { value: "30", label: "30 min", sub: "Full block" },
  { value: "45", label: "45 min", sub: "Extended" },
] as const;

const STEP_META = [
  { title: "Primary Goal", description: "Start with the result you care about most right now." },
  { title: "Training Level", description: "This sets the baseline pace, density, and difficulty." },
  { title: "Setup & Duration", description: "Tell GymTwin what equipment you have and how long you want to train." },
  { title: "Coach Match", description: "Choose the coach voice and energy you want guiding the experience." },
] as const;

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

function SummaryRow({
  label,
  value,
  accentClass = "text-white",
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/58 px-4 py-3">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className={`text-sm font-black ${accentClass}`}>{value}</span>
    </div>
  );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<WorkoutGoal | null>(null);
  const [level, setLevel] = useState<WorkoutLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment>("None");
  const [sessionLength, setSessionLength] = useState<string>("20");
  const [coachIdx, setCoachIdx] = useState(0);

  const totalSteps = STEP_META.length;
  const selectedCoach = COACHES[coachIdx];
  const selectedGoalMeta = GOALS.find((item) => item.value === goal) ?? null;
  const selectedLevelMeta = LEVELS.find((item) => item.value === level) ?? null;
  const selectedEquipmentMeta = EQUIPMENT_LIST.find((item) => item.value === equipment) ?? EQUIPMENT_LIST[0];
  const selectedDurationMeta = SESSION_LENGTHS.find((item) => item.value === sessionLength) ?? SESSION_LENGTHS[1];
  const completionPercent = Math.round(((step + 1) / totalSteps) * 100);

  const readinessLine = useMemo(() => {
    if (!goal) return "Choose a goal to begin shaping your first adaptive workout path.";
    if (!level) return `Goal locked for ${selectedGoalMeta?.label.toLowerCase()}. Now set your training baseline.`;
    if (step < 2) return `Current plan: ${level.toLowerCase()} ${goal.toLowerCase()} with ${equipment.toLowerCase()} access.`;
    if (step < 3) return `Your setup is nearly ready. Pick the coach energy that fits your style.`;
    return "Everything is set. GymTwin can now generate a cleaner first-session experience.";
  }, [equipment, goal, level, selectedGoalMeta, step]);

  function canAdvance() {
    if (step === 0) return goal !== null;
    if (step === 1) return level !== null;
    return true;
  }

  function advance() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    if (!goal || !level) {
      return;
    }

    const defaults = {
      goal,
      level,
      equipment,
      sessionLength,
      avatar: selectedCoach.avatar,
      coach: selectedCoach.coach,
    };

    saveQuickStartDefaults(defaults);
    markOnboardingDone();
    onComplete(defaults);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(217,70,239,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">GymTwin Intake</p>
                <h1 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                  Let&apos;s build your starting profile
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  This setup defines your first workout defaults, coach style, and dashboard context. You can still refine everything later.
                </p>
              </div>
              <div className="w-full max-w-xs rounded-[1.4rem] border border-blue-400/16 bg-blue-500/8 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Setup Progress</span>
                  <span className="text-sm font-black text-white">{completionPercent}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{readinessLine}</p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[1.85rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {STEP_META.map((meta, index) => {
                  const isActive = index === step;
                  const isComplete = index < step;
                  return (
                    <button
                      key={meta.title}
                      type="button"
                      onClick={() => {
                        if (index <= step) setStep(index);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                        isActive
                          ? "border-blue-400/24 bg-blue-500/12 text-blue-100"
                          : isComplete
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                            : "border-white/8 bg-slate-900/70 text-slate-500"
                      }`}
                    >
                      {index + 1}. {meta.title}
                    </button>
                  );
                })}
              </div>

              <div className="mb-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Step {step + 1} of {totalSteps}
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">{STEP_META[step].title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{STEP_META[step].description}</p>
              </div>

              {step === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((item) => {
                    const active = goal === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGoal(item.value)}
                        className={`rounded-[1.45rem] border px-5 py-4 text-left transition active:scale-95 ${
                          active
                            ? "border-blue-400/28 bg-gradient-to-br from-blue-500/16 via-slate-950/72 to-fuchsia-500/14 text-white shadow-[0_0_22px_rgba(59,130,246,0.16)]"
                            : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black">{item.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.sub}</p>
                          </div>
                          {active ? <span className="text-blue-300">✓</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-3">
                  {LEVELS.map((item) => {
                    const active = level === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setLevel(item.value)}
                        className={`rounded-[1.45rem] border px-5 py-4 text-left transition active:scale-95 ${
                          active
                            ? "border-blue-400/28 bg-gradient-to-br from-blue-500/16 via-slate-950/72 to-fuchsia-500/14 text-white shadow-[0_0_22px_rgba(59,130,246,0.16)]"
                            : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                            <p className="mt-2 text-[11px] font-semibold text-slate-300">{item.cue}</p>
                          </div>
                          {active ? (
                            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Equipment Available</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {EQUIPMENT_LIST.map((item) => {
                        const active = equipment === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setEquipment(item.value)}
                            className={`rounded-[1.35rem] border px-4 py-4 text-left transition active:scale-95 ${
                              active
                                ? "border-cyan-400/24 bg-gradient-to-br from-cyan-500/14 via-slate-950/72 to-blue-500/12 text-white shadow-[0_0_20px_rgba(34,211,238,0.14)]"
                                : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{item.emoji}</span>
                              <div>
                                <p className="text-sm font-black">{item.label}</p>
                                <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Session Length</p>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {SESSION_LENGTHS.map((item) => {
                        const active = sessionLength === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setSessionLength(item.value)}
                            className={`rounded-[1.25rem] border px-3 py-4 text-center transition active:scale-95 ${
                              active
                                ? "border-fuchsia-400/28 bg-gradient-to-br from-fuchsia-500/16 via-slate-950/72 to-blue-500/10 text-white shadow-[0_0_18px_rgba(217,70,239,0.14)]"
                                : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            <p className="text-base font-black">{item.label}</p>
                            <p className="mt-1 text-[11px] text-slate-400">{item.sub}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  {COACHES.map((item, index) => {
                    const active = coachIdx === index;
                    return (
                      <button
                        key={item.avatar}
                        type="button"
                        onClick={() => setCoachIdx(index)}
                        className={`rounded-[1.55rem] border p-5 text-left transition active:scale-95 ${
                          active
                            ? "border-fuchsia-400/28 bg-gradient-to-br from-blue-500/16 via-slate-950/72 to-fuchsia-500/14 text-white shadow-[0_0_22px_rgba(217,70,239,0.14)]"
                            : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-white">{item.name}</p>
                            <p className={`mt-1 text-[11px] font-black uppercase tracking-[0.18em] bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                              {item.tagline}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.description}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                            active
                              ? "border-fuchsia-400/24 bg-fuchsia-500/12 text-fuchsia-100"
                              : "border-white/8 bg-slate-950/70 text-slate-500"
                          }`}>
                            {active ? "Selected" : "Preview"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-8 flex gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="rounded-2xl border border-white/8 bg-slate-900/72 px-5 py-4 text-sm font-black text-slate-300 transition active:scale-95 hover:border-white/15 hover:text-white"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={advance}
                  disabled={!canAdvance()}
                  className={`flex-1 rounded-2xl py-4 text-sm font-black transition active:scale-95 ${
                    canAdvance()
                      ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-fuchsia-600 text-white shadow-[0_0_24px_rgba(59,130,246,0.34)]"
                      : "cursor-not-allowed bg-slate-800 text-slate-600"
                  }`}
                >
                  {step < totalSteps - 1 ? "Continue" : "Finish Setup"}
                </button>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.85rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Live Intake Summary</p>
                <h3 className="mt-2 text-lg font-black text-white">Your starting profile</h3>
                <div className="mt-4 space-y-3">
                  <SummaryRow label="Goal" value={selectedGoalMeta?.label ?? "Choose one"} accentClass={goal ? "text-white" : "text-slate-500"} />
                  <SummaryRow label="Level" value={selectedLevelMeta?.label ?? "Choose one"} accentClass={level ? "text-white" : "text-slate-500"} />
                  <SummaryRow label="Equipment" value={selectedEquipmentMeta.label} accentClass="text-cyan-200" />
                  <SummaryRow label="Duration" value={selectedDurationMeta.label} accentClass="text-fuchsia-200" />
                  <SummaryRow label="Coach" value={selectedCoach.name} accentClass="text-blue-200" />
                </div>
              </div>

              {step === 3 ? (
                <div className="overflow-hidden rounded-[1.85rem] border border-white/8">
                  <CharacterViewer
                    character={CHARACTERS[selectedCoach.avatar === "Atlas" ? "atlas" : "nova"]}
                    height="h-[340px]"
                    enableOrbit={false}
                  />
                </div>
              ) : (
                <div className="rounded-[1.85rem] border border-blue-400/14 bg-blue-500/8 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-300">What this powers</p>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                    <p>Your selected goal and level seed the first workout defaults and weekly plan recommendations.</p>
                    <p>Equipment and duration narrow the routine generator without forcing a new system architecture yet.</p>
                    <p>The coach choice carries through onboarding, dashboard, and workout surfaces for a more consistent MVP feel.</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
