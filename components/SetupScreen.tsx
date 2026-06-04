import { memo, useCallback, useMemo, useTransition } from "react";
import Image from "next/image";
import { coaches, equipmentOptions, goals, levels } from "@/data/formOptions";
import { getAvatarAsset, getAvatarLabel, getAvatarPersonality, getAvatarRole, getAvatarSubtitle } from "@/lib/avatarAssets";
import type { CoachAvatar, CoachName, Equipment, WorkoutGoal, WorkoutLevel } from "@/types";

type SetupScreenProps = {
  selectedGoal: WorkoutGoal;
  setSelectedGoal: (goal: WorkoutGoal) => void;
  selectedLevel: WorkoutLevel;
  setSelectedLevel: (level: WorkoutLevel) => void;
  selectedEquipment: Equipment;
  setSelectedEquipment: (equipment: Equipment) => void;
  sessionLength: string;
  setSessionLength: (length: string) => void;
  selectedAvatar: CoachAvatar;
  setSelectedAvatar: (avatar: CoachAvatar) => void;
  selectedCoach: CoachName;
  setSelectedCoach: (coach: CoachName) => void;
  hasAcceptedSafety: boolean;
  setHasAcceptedSafety: (accepted: boolean) => void;
  onBack: () => void;
  onGeneratePreview: () => void;
  primaryButton: string;
  selectClass: string;
};

const DURATION_OPTIONS = [
  { value: "10", label: "10 Min" },
  { value: "20", label: "20 Min" },
  { value: "30", label: "30 Min" },
  { value: "45", label: "45 Min" },
] as const;

const coachingStyleDescriptions: Record<CoachName, string> = {
  Supportive: "Calm, encouraging, and patient. Great for beginners.",
  Intense: "No excuses. High demands, high results.",
  Motivational: "Positive energy and constant hype to keep you pushing.",
  Playful: "Keeps it light. Humor helps you show up every day.",
  "High Energy": "Maximum energy, fast pace, and crowd-level excitement.",
};

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const OptionGrid = memo(function OptionGrid({
  options,
  selected,
  onSelect,
  cols = "grid-cols-2",
}: {
  options: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  cols?: string;
}) {
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map(({ value, label }) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`transform-gpu will-change-transform rounded-2xl border py-4 text-center text-sm font-black tracking-wide transition ${
              active
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "border-zinc-800 bg-zinc-900/40 text-slate-400 hover:border-zinc-700 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});

export function SetupScreen({
  selectedGoal,
  setSelectedGoal,
  selectedLevel,
  setSelectedLevel,
  selectedEquipment,
  setSelectedEquipment,
  sessionLength,
  setSessionLength,
  selectedAvatar,
  setSelectedAvatar,
  selectedCoach,
  setSelectedCoach,
  hasAcceptedSafety,
  setHasAcceptedSafety,
  onBack,
  onGeneratePreview,
  primaryButton,
}: SetupScreenProps) {
  const [isSelectionPending, startSelectionTransition] = useTransition();
  const goalOptions = useMemo(() => goals.map((goal) => ({ value: goal, label: goal })), []);
  const equipmentChoices = useMemo(
    () => equipmentOptions.map((equipment) => ({ value: equipment, label: equipment })),
    []
  );
  const levelOptions = useMemo(() => levels.map((level) => ({ value: level, label: level })), []);
  const durationIndex = useMemo(
    () => DURATION_OPTIONS.findIndex((option) => option.value === sessionLength),
    [sessionLength]
  );
  const handleGoalSelect = useCallback((value: string) => {
    startSelectionTransition(() => {
      setSelectedGoal(value as WorkoutGoal);
    });
  }, [setSelectedGoal]);
  const handleEquipmentSelect = useCallback((value: string) => {
    startSelectionTransition(() => {
      setSelectedEquipment(value as Equipment);
    });
  }, [setSelectedEquipment]);
  const handleLevelSelect = useCallback((value: string) => {
    startSelectionTransition(() => {
      setSelectedLevel(value as WorkoutLevel);
    });
  }, [setSelectedLevel]);
  const handleDurationChange = useCallback((value: number) => {
    const nextOption = DURATION_OPTIONS[value];
    if (!nextOption) return;
    startSelectionTransition(() => {
      setSessionLength(nextOption.value);
    });
  }, [setSessionLength]);
  const handleAvatarSelect = useCallback((avatar: CoachAvatar) => {
    startSelectionTransition(() => {
      setSelectedAvatar(avatar);
    });
  }, [setSelectedAvatar]);
  const handleCoachSelect = useCallback((coach: CoachName) => {
    startSelectionTransition(() => {
      setSelectedCoach(coach);
    });
  }, [setSelectedCoach]);
  const ctaLabel = `Generate ${sessionLength}-Min ${selectedGoal} Workout ⚡`;

  const estimatedXp = Math.round(
    parseInt(sessionLength) * 2 *
    ((selectedGoal === "Build muscle" || selectedGoal === "Stamina") ? 1.15 : 1) *
    (selectedLevel === "Advanced" ? 1.2 : selectedLevel === "Intermediate" ? 1.1 : 1)
  );
  const intensityLabel = selectedLevel === "Advanced" ? "Max" : selectedLevel === "Intermediate" ? "High" : "Mod";
  const estimatedMoves = Math.round(parseInt(sessionLength) / 5);

  return (
    <>
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-28 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">

          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
          >
            ← Back
          </button>

          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 px-5 py-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Session Builder</p>
            <h2 className="mt-2 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Build Your Session
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Set your goal, pick your coach, and GymTwin generates a personalized routine in seconds.
            </p>
          </header>

          <section className="mb-6 overflow-hidden rounded-[1.9rem] border border-white/8 bg-slate-950/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:grid lg:grid-cols-[220px_1fr]">
            <div className="relative h-64 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0f172a] lg:h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_30%),linear-gradient(180deg,rgba(30,41,59,0.08),rgba(15,23,42,0.34)_100%)]" />
              <Image
                src={getAvatarAsset(selectedAvatar)}
                alt={`${getAvatarLabel(selectedAvatar)} setup preview`}
                fill
                priority
                sizes="(min-width: 1024px) 220px, 100vw"
                className="object-cover object-[center_18%]"
              />
            </div>
            <div className="p-5 lg:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">Coach Preview</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                  Lightweight
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
                  No 3D Load
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">{getAvatarLabel(selectedAvatar)}</h3>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                {getAvatarSubtitle(selectedAvatar)}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-200">{getAvatarPersonality(selectedAvatar)}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{getAvatarRole(selectedAvatar)}</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                The full animated coach only loads when an active workout starts, so setup stays fast and stable.
              </p>
            </div>
          </section>

          <div className="space-y-4">

            {/* Workout Focus + Equipment */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <FieldShell label="Workout Focus">
                <OptionGrid
                  options={goalOptions}
                  selected={selectedGoal}
                  onSelect={handleGoalSelect}
                  cols="grid-cols-2 sm:grid-cols-3"
                />
              </FieldShell>

              <FieldShell label="Equipment">
                <OptionGrid
                  options={equipmentChoices}
                  selected={selectedEquipment}
                  onSelect={handleEquipmentSelect}
                  cols="grid-cols-2 sm:grid-cols-4"
                />
              </FieldShell>
            </div>

            {/* Fitness Level + Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldShell label="Fitness Level">
                <OptionGrid
                  options={levelOptions}
                  selected={selectedLevel}
                  onSelect={handleLevelSelect}
                  cols="grid-cols-3"
                />
              </FieldShell>

              <FieldShell label={`Duration — ${sessionLength} Min`}>
                <div className="px-1 pb-1 pt-3">
                  <input
                    type="range"
                    min={0}
                    max={DURATION_OPTIONS.length - 1}
                    step={1}
                    value={durationIndex}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-400"
                  />
                  <div className="mt-2 flex justify-between">
                    {DURATION_OPTIONS.map(({ value, label }) => (
                      <span
                        key={value}
                        className={`text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                          sessionLength === value ? "text-emerald-400" : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </FieldShell>
            </div>

            {/* Session Forecast */}
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Session Forecast</p>
                {isSelectionPending ? (
                  <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">
                    Updating
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300">Est. XP</p>
                  <p className="mt-1 text-2xl font-black text-white">{estimatedXp}</p>
                </div>
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-3 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Intensity</p>
                  <p className="mt-1 text-xl font-black text-white">{intensityLabel}</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Moves</p>
                  <p className="mt-1 text-2xl font-black text-white">~{estimatedMoves}</p>
                </div>
              </div>
            </div>

            {/* Coach Avatar */}
            <FieldShell label="AI Coach Avatar">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-5">
                {(["Nova", "Atlas"] as CoachAvatar[]).map((key) => {
                  const active = selectedAvatar === key;
                  const accentGradient = key === "Nova"
                    ? "from-fuchsia-500/25 via-blue-500/18 to-slate-950"
                    : "from-blue-500/25 via-indigo-500/18 to-slate-950";
                  const pillColor = key === "Nova" ? "text-fuchsia-200" : "text-blue-200";

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAvatarSelect(key)}
                      className={`group relative overflow-hidden rounded-[1.55rem] border p-4 text-left transform-gpu will-change-transform transition lg:p-5 ${
                        active
                          ? "border-fuchsia-400/45 bg-white/10 shadow-[0_0_40px_rgba(99,102,241,0.28)]"
                          : "border-white/8 bg-slate-900/70 hover:border-blue-400/18 hover:bg-slate-900/85"
                      }`}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-black text-white lg:text-xl">{getAvatarLabel(key)}</p>
                          <p className={`mt-1 text-[11px] font-black uppercase tracking-[0.22em] ${pillColor}`}>
                            {getAvatarSubtitle(key)}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-200">{getAvatarPersonality(key)}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">{getAvatarRole(key)}</p>
                        </div>
                        <div className={`relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${accentGradient} shadow-[0_18px_38px_rgba(15,23,42,0.34)] lg:h-32 lg:w-32 ${active ? "ring-2 ring-fuchsia-300/30" : ""}`}>
                          <div className="absolute inset-3 rounded-full border border-white/10" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_35%)]" />
                          <Image
                            src={getAvatarAsset(key)}
                            alt={`${getAvatarLabel(key)} avatar`}
                            fill
                            sizes="(min-width: 1024px) 128px, 112px"
                            className="relative z-10 object-cover object-[center_20%] scale-[1.06] transition duration-300 group-hover:scale-[1.1]"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 z-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="mx-auto h-3.5 w-3.5 rounded-full bg-blue-100/90" />
                              <div className="mx-auto mt-1 h-5 w-[2px] rounded-full bg-fuchsia-200/90" />
                              <div className="mx-auto -mt-3 h-[2px] w-6 rounded-full bg-blue-100/90" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">AI Coach</span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                          active
                            ? "border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100"
                            : "border-white/10 bg-slate-950/70 text-slate-400"
                        }`}>
                          {active ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FieldShell>

            {/* Coaching Style */}
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Coaching Style</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {coaches.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleCoachSelect(style)}
                    className={`shrink-0 transform-gpu will-change-transform rounded-2xl border px-4 py-3 text-center transition ${
                      selectedCoach === style
                        ? "border-violet-400/35 bg-gradient-to-br from-blue-500/16 to-violet-500/14 text-white shadow-[0_0_20px_rgba(99,102,241,0.16)]"
                        : "border-white/8 bg-slate-900/70 text-slate-400 hover:border-white/15 hover:text-slate-200"
                    }`}
                  >
                    <p className="text-xs font-black">{style}</p>
                  </button>
                ))}
              </div>
              {selectedCoach ? (
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {coachingStyleDescriptions[selectedCoach]}
                </p>
              ) : null}
            </div>

            {/* Safety Notice */}
            <section className="rounded-[1.7rem] border border-red-500/18 bg-red-950/20 p-5 shadow-[0_18px_42px_rgba(127,29,29,0.12)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-base">
                  ⚠
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-red-200">Safety Notice</p>
                  <p className="mt-2 text-sm leading-relaxed text-red-100/85">
                    This app provides general fitness guidance, not medical advice. Stop if you feel sharp pain, dizziness, or chest pain.
                  </p>
                  <label className="mt-4 flex cursor-pointer items-center gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      hasAcceptedSafety
                        ? "border-violet-400 bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                        : "border-white/20 bg-slate-900/70"
                    }`}>
                      {hasAcceptedSafety ? (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasAcceptedSafety}
                      onChange={(e) => setHasAcceptedSafety(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-red-100">
                      I understand and will stop if I feel pain.
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {!hasAcceptedSafety ? (
              <p className="px-1 text-center text-xs leading-relaxed text-slate-500">
                Accept the safety notice to continue.
              </p>
            ) : null}

            <button
              onClick={onGeneratePreview}
              disabled={!hasAcceptedSafety}
              className={`${primaryButton} ${!hasAcceptedSafety ? "cursor-not-allowed opacity-40 active:scale-100" : ""}`}
            >
              {ctaLabel}
            </button>

          </div>
        </div>
      </div>
    </main>

    {hasAcceptedSafety ? (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-slate-950/92 px-4 py-3 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md lg:max-w-5xl xl:max-w-6xl">
          <button
            onClick={onGeneratePreview}
            className={primaryButton}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}
