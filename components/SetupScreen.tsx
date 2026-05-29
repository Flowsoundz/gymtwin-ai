import Image from "next/image";
import { coaches, equipmentOptions, goals, levels } from "@/data/formOptions";
import { getAvatarAsset, getAvatarLabel, getAvatarRole, getAvatarSubtitle } from "@/lib/avatarAssets";
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
  selectClass,
}: SetupScreenProps) {
  const premiumSelectClass = `${selectClass} rounded-2xl border-white/10 bg-slate-900/90 text-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.22)] focus:border-blue-400/40`;

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">
          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
          >
            ← Back
          </button>

          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Session Builder</p>
            <h2 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Build Your Session
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Choose your goal, intensity, and coach style. GymTwin will build an AI-guided home workout with optional camera coaching and voice-friendly control.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                "AI-guided home workouts in minutes",
                "Camera coach for squats, push-ups, and planks",
                "Voice commands for hands-free control",
                "Scores, XP, and badges after every session",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-xs leading-relaxed text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </header>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <FieldShell label="Primary Goal">
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value as WorkoutGoal)}
                  className={premiumSelectClass}
                >
                  {goals.map((g) => <option key={g}>{g}</option>)}
                </select>
              </FieldShell>

              <FieldShell label="Equipment">
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value as Equipment)}
                  className={premiumSelectClass}
                >
                  {equipmentOptions.map((eq) => <option key={eq}>{eq}</option>)}
                </select>
              </FieldShell>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FieldShell label="Level">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as WorkoutLevel)}
                  className={premiumSelectClass}
                >
                  {levels.map((l) => <option key={l}>{l}</option>)}
                </select>
              </FieldShell>

              <FieldShell label="Minutes">
                <select
                  value={sessionLength}
                  onChange={(e) => setSessionLength(e.target.value)}
                  className={premiumSelectClass}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </FieldShell>

              <FieldShell label="Coach Personality">
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value as CoachName)}
                  className={premiumSelectClass}
                >
                  {coaches.map((c) => <option key={c}>{c}</option>)}
                </select>
              </FieldShell>

              <div className="hidden xl:block" />
            </div>

            <FieldShell label="AI Coach Avatar">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-5">
                {[
                  {
                    key: "Nova" as const,
                    title: getAvatarLabel("Nova"),
                    subtitle: getAvatarSubtitle("Nova"),
                    personality: getAvatarRole("Nova"),
                    blurb: "Focused, motivating, form-first.",
                    accent: "from-fuchsia-500/25 via-blue-500/18 to-slate-950",
                    pill: "text-fuchsia-200",
                  },
                  {
                    key: "Atlas" as const,
                    title: getAvatarLabel("Atlas"),
                    subtitle: getAvatarSubtitle("Atlas"),
                    personality: getAvatarRole("Atlas"),
                    blurb: "Disciplined, strong, performance-first.",
                    accent: "from-blue-500/25 via-indigo-500/18 to-slate-950",
                    pill: "text-blue-200",
                  },
                ].map((avatar) => {
                  const active = selectedAvatar === avatar.key;
                  return (
                    <button
                      key={avatar.key}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.key)}
                      className={`group relative overflow-hidden rounded-[1.55rem] border p-4 text-left transition lg:p-5 ${
                        active
                          ? "border-fuchsia-400/45 bg-white/10 shadow-[0_0_40px_rgba(99,102,241,0.28)]"
                          : "border-white/8 bg-slate-900/70 hover:border-blue-400/18 hover:bg-slate-900/85"
                      }`}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-black text-white lg:text-xl">{avatar.title}</p>
                          <p className={`mt-1 text-[11px] font-black uppercase tracking-[0.22em] ${avatar.pill}`}>
                            {avatar.subtitle}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-200">{avatar.personality}</p>
                        </div>
                        <div className={`relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${avatar.accent} shadow-[0_18px_38px_rgba(15,23,42,0.34)] lg:h-32 lg:w-32 ${active ? "ring-2 ring-fuchsia-300/30" : ""}`}>
                          <div className="absolute inset-3 rounded-full border border-white/10" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_35%)]" />
                          <Image
                            src={getAvatarAsset(avatar.key)}
                            alt={`${avatar.title} avatar`}
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
                      <p className="mt-4 text-sm leading-relaxed text-slate-300">{avatar.blurb}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">AI Coach Choice</span>
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

            <section className="rounded-[1.7rem] border border-red-500/18 bg-red-950/20 p-5 text-sm leading-relaxed text-red-100 shadow-[0_18px_42px_rgba(127,29,29,0.12)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-base">
                  ⚠
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-red-200">Safety Notice</p>
                  <p className="mt-2 text-sm leading-relaxed text-red-100/85">
                    This app provides general fitness guidance, not medical advice. Stop if you feel sharp pain, dizziness, or chest pain.
                  </p>
                  <label className="mt-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-red-100">
                    <input
                      type="checkbox"
                      checked={hasAcceptedSafety}
                      onChange={(e) => setHasAcceptedSafety(e.target.checked)}
                      className="h-5 w-5 accent-purple-600"
                    />
                    I understand and will stop if I feel pain.
                  </label>
                </div>
              </div>
            </section>

            {!hasAcceptedSafety ? (
              <p className="px-1 text-xs leading-relaxed text-slate-500">
                Accept the safety notice before starting the workout.
              </p>
            ) : null}

            <button
              onClick={onGeneratePreview}
              disabled={!hasAcceptedSafety}
              className={`${primaryButton} ${!hasAcceptedSafety ? "cursor-not-allowed opacity-40 active:scale-100" : ""}`}
            >
              Generate & Preview Routine
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
