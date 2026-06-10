"use client";

import { useState } from "react";
import { Coach3D } from "@/components/Coach3D";
import {
  countCameraReadyExercises,
  getCameraCoachLabel,
} from "@/lib/cameraCoachMapping";
import {
  generateNovaDeloadNote,
  getAFIBand,
  getNovaDeloadProgressionIntent,
  getPhaseBadgeColor,
  getPhaseLabel,
} from "@/lib/macrocycleEngine";
import type {
  CoachAvatar,
  CoachName,
  PersonalizedExercise,
  PersonalizedWorkoutPlan,
  WorkoutGoal,
  WorkoutLevel,
} from "@/types";
import type { Macrocycle } from "@/types/macrocycle";

type WorkoutPlanScreenProps = {
  plan: PersonalizedWorkoutPlan;
  macrocycle?: Macrocycle | null;
  selectedCoach: CoachName;
  selectedAvatar: CoachAvatar;
  selectedGoal: WorkoutGoal;
  selectedLevel: WorkoutLevel;
  onBeginWorkout: () => void;
  onBackToSetup: () => void;
  primaryButton: string;
  secondaryButton: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function goalAccentClass(goal: WorkoutGoal): string {
  switch (goal) {
    case "Lose weight": return "text-orange-400";
    case "Build muscle": return "text-blue-400";
    case "Stamina": return "text-yellow-400";
    case "Tone": return "text-fuchsia-400";
    case "Mobility": return "text-teal-400";
    default: return "text-purple-400";
  }
}

function goalBadgeClass(goal: WorkoutGoal): string {
  switch (goal) {
    case "Lose weight": return "border-orange-900/50 bg-orange-950/40 text-orange-300";
    case "Build muscle": return "border-blue-900/50 bg-blue-950/40 text-blue-300";
    case "Stamina": return "border-yellow-900/50 bg-yellow-950/40 text-yellow-300";
    case "Tone": return "border-fuchsia-900/50 bg-fuchsia-950/40 text-fuchsia-300";
    case "Mobility": return "border-teal-900/50 bg-teal-950/40 text-teal-300";
    default: return "border-purple-900/50 bg-purple-950/40 text-purple-300";
  }
}

function levelBadgeClass(level: WorkoutLevel): string {
  switch (level) {
    case "Beginner": return "border-emerald-900/50 bg-emerald-950/40 text-emerald-300";
    case "Intermediate": return "border-blue-900/50 bg-blue-950/40 text-blue-300";
    case "Advanced": return "border-red-900/50 bg-red-950/40 text-red-300";
  }
}

function equipmentIcon(equipment: string): string {
  if (equipment === "Bodyweight") return "◈";
  if (equipment === "Dumbbells") return "◑";
  if (equipment === "Resistance Bands") return "⌀";
  if (equipment === "Bench") return "▬";
  return "◈";
}

function getUniqueEquipment(exercises: PersonalizedExercise[]): string[] {
  return [...new Set(exercises.map((ex) => ex.equipment))];
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  index,
  sectionColor,
}: {
  exercise: PersonalizedExercise;
  index: number;
  sectionColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const repLabel = exercise.duration
    ? `${exercise.duration}s hold`
    : `${exercise.sets} × ${exercise.reps} reps`;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/4 shadow-[0_12px_40px_rgba(15,23,42,0.3)] backdrop-blur-xl">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${sectionColor}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                {equipmentIcon(exercise.equipment)} {exercise.equipment}
              </span>
              <span className="rounded-full border border-white/8 bg-slate-900/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                {exercise.muscleGroup}
              </span>
            </div>
            <p className="text-sm font-extrabold leading-snug text-slate-100">
              {index + 1}. {exercise.name}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-mono text-base font-black text-purple-300 tabular-nums">{repLabel}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Rest {exercise.rest}s
            </p>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-400 italic">
          &ldquo;{exercise.coachingCue}&rdquo;
        </p>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>{expanded ? "▲" : "▼"}</span>
          <span>Options</span>
        </button>

        {expanded && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-2.5">
              <p className="mb-1 text-[8px] font-black uppercase tracking-wider text-emerald-500">↓ Easier</p>
              <p className="text-[10px] leading-relaxed text-emerald-200">{exercise.easierOption}</p>
            </div>
            <div className="rounded-xl border border-orange-900/30 bg-orange-950/20 p-2.5">
              <p className="mb-1 text-[8px] font-black uppercase tracking-wider text-orange-500">↑ Harder</p>
              <p className="text-[10px] leading-relaxed text-orange-200">{exercise.harderOption}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────

function SectionBlock({
  label,
  sublabel,
  exercises,
  accentColor,
  gradientFrom,
  gradientTo,
}: {
  label: string;
  sublabel: string;
  exercises: PersonalizedExercise[];
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`h-px flex-1 bg-gradient-to-r ${gradientFrom} to-transparent`} />
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${accentColor}`}>{label}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{sublabel}</p>
        </div>
        <div className={`h-px flex-1 bg-gradient-to-l ${gradientFrom} to-transparent`} />
      </div>
      <div className="space-y-2.5">
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={`${label}-${ex.name}-${i}`}
            exercise={ex}
            index={i}
            sectionColor={gradientTo}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WorkoutPlanScreen({
  plan,
  macrocycle,
  selectedCoach,
  selectedAvatar,
  selectedGoal,
  selectedLevel,
  onBeginWorkout,
  onBackToSetup,
  primaryButton,
  secondaryButton,
}: WorkoutPlanScreenProps) {
  const allEquipment = getUniqueEquipment([...plan.warmup, ...plan.mainBlock, ...plan.cooldown]);
  const totalExercises = plan.warmup.length + plan.mainBlock.length + plan.cooldown.length;
  const totalSets = [...plan.warmup, ...plan.mainBlock, ...plan.cooldown].reduce(
    (sum, ex) => sum + ex.sets,
    0
  );

  const coachFirstName =
    selectedCoach === "High Energy"
      ? "Coach"
      : selectedCoach === "Motivational"
        ? "Coach"
        : selectedCoach;

  const allExerciseNames = [
    ...plan.warmup,
    ...plan.mainBlock,
    ...plan.cooldown,
  ].map((ex) => ex.name);
  const cameraStats = countCameraReadyExercises(allExerciseNames);

  const isDeloadWeek = macrocycle?.currentPhase === "deload";
  const isNearingDeload = macrocycle?.currentPhase === "loaded warning";
  const macroWeekLabel = macrocycle
    ? `Week ${macrocycle.currentWeek} of ${macrocycle.targetWeeks}`
    : null;
  const macroPhaseLabel = macrocycle ? getPhaseLabel(macrocycle.currentPhase) : null;
  const macroPhaseBadge = macrocycle ? getPhaseBadgeColor(macrocycle.currentPhase) : null;
  const afiBand = macrocycle ? getAFIBand(macrocycle.accumulatedFatigueIndex) : null;
  const novaDeloadNote = isDeloadWeek && macrocycle ? generateNovaDeloadNote(macrocycle) : null;
  const novaDeloadIntent = isDeloadWeek && macrocycle ? getNovaDeloadProgressionIntent(macrocycle) : null;

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.1),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-16 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-6xl xl:max-w-7xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">

          {/* ─ Back Button ──────────────────────────────────────────────── */}
          <button
            onClick={onBackToSetup}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white transition-colors"
          >
            ← Adjust Setup
          </button>

          {/* ─ Plan Header ──────────────────────────────────────────────── */}
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${goalBadgeClass(selectedGoal)}`}>
                {plan.goalFocus}
              </span>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${levelBadgeClass(selectedLevel)}`}>
                {plan.difficulty}
              </span>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                ~{plan.estimatedDuration} min
              </span>
              {macroWeekLabel && macroPhaseLabel && macroPhaseBadge && (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${macroPhaseBadge}`}>
                  {macroWeekLabel} · {macroPhaseLabel}
                </span>
              )}
              {isNearingDeload && !isDeloadWeek && (
                <span className="rounded-full border border-yellow-900/50 bg-yellow-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-300">
                  ⚠ Heavy Load Week
                </span>
              )}
              {afiBand && (afiBand === "overloaded" || afiBand === "critical") && !isDeloadWeek && (
                <span className="rounded-full border border-red-900/50 bg-red-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-300">
                  High Fatigue
                </span>
              )}
            </div>
            <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${goalAccentClass(selectedGoal)} [background:linear-gradient(135deg,#fff_0%,currentColor_100%)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]`}>
              {plan.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Personalized for your <span className="text-slate-200 font-bold">{selectedGoal.toLowerCase()}</span> goal &mdash; adapted to your equipment, level, and session length.
            </p>

            {/* Equipment needed */}
            <div className="mt-4 flex flex-wrap gap-2">
              {allEquipment.map((equip) => (
                <span
                  key={equip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300"
                >
                  {equipmentIcon(equip)} {equip}
                </span>
              ))}
            </div>
          </header>

          {/* ─ Desktop Grid Layout ──────────────────────────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.7fr)]">

            {/* ─── Left column: Exercises ──────────────────────────────── */}
            <div className="space-y-8">

              {/* Deload Week Announcement — shown when macrocycle triggers a deload */}
              {isDeloadWeek && novaDeloadNote && (
                <div className="relative overflow-hidden rounded-[1.8rem] border border-blue-500/30 bg-[linear-gradient(135deg,rgba(30,58,138,0.18),rgba(15,23,42,0.88))] p-6 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/40 bg-blue-950/60 text-sm font-black text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.3)]">
                      ◈
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400">
                        Deload Week · Nova
                      </p>
                      <p className="text-base font-black text-white">This Week We Shift the Target</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{novaDeloadNote}</p>
                  {novaDeloadIntent && (
                    <p className="mt-3 text-[11px] leading-relaxed text-blue-200/70 italic border-t border-blue-900/30 pt-3">
                      {novaDeloadIntent}
                    </p>
                  )}
                </div>
              )}

              {/* Warmup */}
              <SectionBlock
                label="Warm-Up"
                sublabel={`${plan.warmup.length} movement${plan.warmup.length !== 1 ? "s" : ""} · prepare joints & elevate heart rate`}
                exercises={plan.warmup}
                accentColor="text-blue-400"
                gradientFrom="from-blue-900/40"
                gradientTo="from-transparent via-blue-400/20 to-fuchsia-400/10"
              />

              {/* Main Block */}
              <SectionBlock
                label="Main Block"
                sublabel={`${plan.mainBlock.length} exercises · ${plan.goalFocus.toLowerCase()}`}
                exercises={plan.mainBlock}
                accentColor="text-purple-400"
                gradientFrom="from-purple-900/40"
                gradientTo="from-transparent via-purple-400/25 to-blue-400/10"
              />

              {/* Cooldown */}
              <SectionBlock
                label="Cool-Down"
                sublabel={`${plan.cooldown.length} movement${plan.cooldown.length !== 1 ? "s" : ""} · recover & reduce soreness`}
                exercises={plan.cooldown}
                accentColor="text-teal-400"
                gradientFrom="from-teal-900/40"
                gradientTo="from-transparent via-teal-400/20 to-emerald-400/10"
              />
            </div>

            {/* ─── Right column: Summary & Actions ────────────────────── */}
            <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">

              {/* 3D Coach */}
              <Coach3D
                selectedAvatar={selectedAvatar}
                animationHint="idle"
                previewFrame="bust"
                freezeAnimation
                compact
                lightingMode="neutral"
              />

              {/* Session Stats */}
              <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.42)]">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Session Summary</p>
                <h3 className="mt-1.5 text-xl font-black tracking-tight text-white">Ready to Train</h3>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Duration", value: `~${plan.estimatedDuration}m` },
                    { label: "Exercises", value: String(totalExercises) },
                    { label: "Total Sets", value: String(totalSets) },
                    { label: "Focus", value: plan.goalFocus.split(" & ")[0] },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/55 px-3 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
                      <p className="mt-1 text-lg font-black text-white leading-none">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Notes */}
              <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/60 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-[10px] font-black text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                    {selectedAvatar[0]}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-300">
                    {coachFirstName} Says
                  </p>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">&ldquo;{plan.coachNotes}&rdquo;</p>
              </div>

              {/* Progression Intent */}
              <div className="rounded-[1.6rem] border border-purple-900/30 bg-purple-950/15 p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.26em] text-purple-400">Next Session Plan</p>
                <p className="text-[11px] leading-relaxed text-slate-300">{plan.progressionIntent}</p>
              </div>

              {/* Camera Coach Readiness Card */}
              <div className="relative overflow-hidden rounded-[1.6rem] border border-fuchsia-900/30 bg-[linear-gradient(135deg,rgba(88,28,135,0.1),rgba(15,23,42,0.65))] p-5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-fuchsia-900/40 bg-fuchsia-950/40 text-[11px] text-fuchsia-400">
                      ◎
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-400">Camera Form Coach</p>
                  </div>
                  {cameraStats.total > 0 ? (
                    <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-950/50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-fuchsia-300">
                      {cameraStats.total} ready
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-700/40 bg-slate-900/50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      0 this session
                    </span>
                  )}
                </div>

                {cameraStats.total > 0 ? (
                  <>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {cameraStats.total} exercise{cameraStats.total !== 1 ? "s" : ""} in this session support live form tracking. Tap <span className="text-fuchsia-300 font-bold">Start Camera Coach</span> when you reach them.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cameraStats.squat > 0 && (
                        <span className="rounded-full border border-blue-900/40 bg-blue-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-300">
                          {getCameraCoachLabel("squat")} · {cameraStats.squat}
                        </span>
                      )}
                      {cameraStats.lunge > 0 && (
                        <span className="rounded-full border border-amber-900/40 bg-amber-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-300">
                          {getCameraCoachLabel("lunge")} · {cameraStats.lunge}
                        </span>
                      )}
                      {cameraStats.pushup > 0 && (
                        <span className="rounded-full border border-purple-900/40 bg-purple-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-purple-300">
                          {getCameraCoachLabel("pushup")} · {cameraStats.pushup}
                        </span>
                      )}
                      {cameraStats.curl > 0 && (
                        <span className="rounded-full border border-rose-900/40 bg-rose-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-rose-300">
                          {getCameraCoachLabel("curl")} · {cameraStats.curl}
                        </span>
                      )}
                      {cameraStats.plank > 0 && (
                        <span className="rounded-full border border-teal-900/40 bg-teal-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-teal-300">
                          {getCameraCoachLabel("plank")} · {cameraStats.plank}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    This session&apos;s exercises don&apos;t have camera tracking yet. Sessions with squats, push-ups, or planks unlock live form coaching.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button onClick={onBeginWorkout} className={primaryButton}>
                  Begin Workout
                </button>
                <button onClick={onBackToSetup} className={secondaryButton}>
                  Back to Setup
                </button>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </main>
  );
}
