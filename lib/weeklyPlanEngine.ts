import type {
  Equipment,
  WeeklyPlan,
  WeeklyPlanDay,
  WeeklyPlanDayConfig,
  WeeklyPlanDayType,
  WorkoutGoal,
  WorkoutLevel,
} from "@/types";

const WEEKDAY_LABELS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export function getTodayWeeklyPlanLabel() {
  return WEEKDAY_LABELS[new Date().getDay()];
}

// ─── Split Templates ──────────────────────────────────────────────────────────

interface DayTemplate {
  focus: string;
  splitType: WeeklyPlanDayType;
  durationOffset: number;      // minutes added to base session length
  muscleGroups: string[];
  goalOverride?: WorkoutGoal;  // recovery/mobility days use a different goal
}

// 3-day full body (all goals, Beginner)
const BEGINNER_FULL_BODY: DayTemplate[] = [
  { focus: "Full Body A", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Full Body B", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Full Body C", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
];

// Upper / Lower (Build muscle, Intermediate)
const UPPER_LOWER: DayTemplate[] = [
  { focus: "Upper Body Push", splitType: "push", durationOffset: 0, muscleGroups: ["Chest", "Shoulders", "Triceps"] },
  { focus: "Lower Body", splitType: "legs", durationOffset: 5, muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { focus: "Active Recovery", splitType: "recovery", durationOffset: -15, muscleGroups: [], goalOverride: "Mobility" },
  { focus: "Upper Body Pull", splitType: "pull", durationOffset: 0, muscleGroups: ["Back", "Biceps"] },
  { focus: "Lower Body + Core", splitType: "legs", durationOffset: 5, muscleGroups: ["Quads", "Glutes", "Core"] },
  { focus: "Full Body Strength", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
];

// Push / Pull / Legs (Build muscle, Advanced)
const PPL: DayTemplate[] = [
  { focus: "Push — Chest & Shoulders", splitType: "push", durationOffset: 0, muscleGroups: ["Chest", "Shoulders", "Triceps"] },
  { focus: "Pull — Back & Biceps", splitType: "pull", durationOffset: 0, muscleGroups: ["Back", "Biceps"] },
  { focus: "Legs — Quads & Glutes", splitType: "legs", durationOffset: 5, muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Push — Variation", splitType: "push", durationOffset: 0, muscleGroups: ["Chest", "Shoulders", "Triceps"] },
  { focus: "Pull — Variation", splitType: "pull", durationOffset: 0, muscleGroups: ["Back", "Biceps"] },
  { focus: "Legs + Core", splitType: "legs", durationOffset: 5, muscleGroups: ["Quads", "Glutes", "Core"] },
];

// Fat loss conditioning (Lose weight / Stamina, Intermediate+)
const FAT_LOSS_CIRCUIT: DayTemplate[] = [
  { focus: "Full Body Circuit A", splitType: "conditioning", durationOffset: 5, muscleGroups: ["Full Body"] },
  { focus: "Lower Body Conditioning", splitType: "legs", durationOffset: 5, muscleGroups: ["Legs", "Glutes"] },
  { focus: "Active Recovery", splitType: "recovery", durationOffset: -15, muscleGroups: [], goalOverride: "Mobility" },
  { focus: "Upper Body Circuit", splitType: "conditioning", durationOffset: 0, muscleGroups: ["Chest", "Back", "Shoulders"] },
  { focus: "Full Body Circuit B", splitType: "conditioning", durationOffset: 5, muscleGroups: ["Full Body"] },
  { focus: "Conditioning + Core", splitType: "conditioning", durationOffset: 0, muscleGroups: ["Core", "Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
];

// Advanced fat loss / stamina
const FAT_LOSS_ADVANCED: DayTemplate[] = [
  { focus: "Full Body HIIT A", splitType: "conditioning", durationOffset: 10, muscleGroups: ["Full Body"] },
  { focus: "Lower Body Power", splitType: "legs", durationOffset: 5, muscleGroups: ["Legs", "Glutes"] },
  { focus: "Upper Body Circuit", splitType: "conditioning", durationOffset: 5, muscleGroups: ["Chest", "Back", "Shoulders"] },
  { focus: "Active Recovery", splitType: "recovery", durationOffset: -15, muscleGroups: [], goalOverride: "Mobility" },
  { focus: "Full Body HIIT B", splitType: "conditioning", durationOffset: 10, muscleGroups: ["Full Body"] },
  { focus: "Lower Body Endurance", splitType: "legs", durationOffset: 5, muscleGroups: ["Legs", "Core"] },
  { focus: "Upper Body Finisher", splitType: "push", durationOffset: 0, muscleGroups: ["Chest", "Shoulders", "Arms"] },
];

// Tone balanced (Tone, Intermediate+)
const TONE_BALANCED: DayTemplate[] = [
  { focus: "Upper Body + Core", splitType: "push", durationOffset: 0, muscleGroups: ["Chest", "Shoulders", "Core"] },
  { focus: "Lower Body + Glutes", splitType: "legs", durationOffset: 5, muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Full Body A", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Rest", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Full Body B", splitType: "full_body", durationOffset: 0, muscleGroups: ["Full Body"] },
  { focus: "Mobility & Recovery", splitType: "recovery", durationOffset: -10, muscleGroups: [], goalOverride: "Mobility" },
];

// Mobility daily flow (Mobility, any level)
const MOBILITY_FLOW: DayTemplate[] = [
  { focus: "Hip & Lower Body Flow", splitType: "core_mobility", durationOffset: 0, muscleGroups: ["Hips", "Hip Flexors", "Hamstrings"], goalOverride: "Mobility" },
  { focus: "Spine & Thoracic Flow", splitType: "core_mobility", durationOffset: 0, muscleGroups: ["Spine", "Upper Back"], goalOverride: "Mobility" },
  { focus: "Full Body Mobility", splitType: "core_mobility", durationOffset: 0, muscleGroups: ["Full Body"], goalOverride: "Mobility" },
  { focus: "Rest & Passive Stretch", splitType: "rest", durationOffset: 0, muscleGroups: [] },
  { focus: "Hip Flexor & Hamstring", splitType: "core_mobility", durationOffset: 0, muscleGroups: ["Hip Flexors", "Hamstrings"], goalOverride: "Mobility" },
  { focus: "Shoulder & Upper Back", splitType: "core_mobility", durationOffset: 0, muscleGroups: ["Shoulders", "Upper Back"], goalOverride: "Mobility" },
  { focus: "Breathing & Reset", splitType: "recovery", durationOffset: -10, muscleGroups: [], goalOverride: "Mobility" },
];

// ─── Split Selection Logic ────────────────────────────────────────────────────

function selectSplit(
  goal: WorkoutGoal,
  level: WorkoutLevel
): { template: DayTemplate[]; splitName: string } {
  if (goal === "Mobility") {
    return { template: MOBILITY_FLOW, splitName: "Mobility Flow" };
  }
  if (level === "Beginner") {
    return { template: BEGINNER_FULL_BODY, splitName: "Full Body 3×" };
  }
  if (goal === "Build muscle") {
    if (level === "Advanced") return { template: PPL, splitName: "Push / Pull / Legs" };
    return { template: UPPER_LOWER, splitName: "Upper / Lower Split" };
  }
  if (goal === "Lose weight" || goal === "Stamina") {
    if (level === "Advanced") return { template: FAT_LOSS_ADVANCED, splitName: "Advanced Conditioning" };
    return { template: FAT_LOSS_CIRCUIT, splitName: "Conditioning Circuit" };
  }
  if (goal === "Tone") {
    return { template: TONE_BALANCED, splitName: "Sculpt & Balance" };
  }
  return { template: BEGINNER_FULL_BODY, splitName: "Full Body 3×" };
}

function getBaseSessionLength(level: WorkoutLevel, goal: WorkoutGoal): number {
  const base = level === "Advanced" ? 45 : level === "Intermediate" ? 30 : 20;
  if (goal === "Stamina" || goal === "Lose weight") return base + 5;
  if (goal === "Mobility") return base - 5;
  return base;
}

function getDayGoal(template: DayTemplate, planGoal: WorkoutGoal): WorkoutGoal {
  return template.goalOverride ?? planGoal;
}

function getSplitTypeLabel(type: WeeklyPlanDayType): string {
  const labels: Record<WeeklyPlanDayType, string> = {
    push: "Push",
    pull: "Pull",
    legs: "Legs",
    full_body: "Full Body",
    conditioning: "Conditioning",
    core_mobility: "Mobility",
    recovery: "Recovery",
    rest: "Rest",
  };
  return labels[type];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateWeeklyPlan(
  goal?: WorkoutGoal | string,
  level?: WorkoutLevel | string,
  equipment?: Equipment | string
): WeeklyPlan {
  const safeGoal: WorkoutGoal = (goal as WorkoutGoal) ?? "Tone";
  const safeLevel: WorkoutLevel = (level as WorkoutLevel) ?? "Beginner";
  const safeEquipment: Equipment = (equipment as Equipment) ?? "None";
  const difficulty =
    safeLevel === "Advanced" ? "advanced" : safeLevel === "Intermediate" ? "intermediate" : "beginner";

  const { template, splitName } = selectSplit(safeGoal, safeLevel);
  const baseLength = getBaseSessionLength(safeLevel, safeGoal);
  const todayIndex = new Date().getDay();

  const days: WeeklyPlanDay[] = template.map((t, i) => {
    const weekdayLabel = WEEKDAY_LABELS[(todayIndex + i) % 7];
    const isRest = t.splitType === "rest";
    const isRecovery = t.splitType === "recovery" || t.splitType === "core_mobility";
    const sessionMins = isRest ? 0 : Math.max(10, baseLength + t.durationOffset);
    const dayGoal = getDayGoal(t, safeGoal);

    const workoutConfig: WeeklyPlanDayConfig | undefined = isRest
      ? undefined
      : {
          goal: dayGoal,
          level: safeLevel,
          equipment: safeEquipment,
          sessionLength: String(sessionMins),
          focusLabel: t.focus,
          muscleGroups: t.muscleGroups,
        };

    const recommendedWorkout = isRest
      ? "Full rest — let the body recover and adapt."
      : isRecovery
        ? `${t.focus} · light intensity · ${sessionMins} min`
        : `${getSplitTypeLabel(t.splitType)} · ${dayGoal.toLowerCase()} focus · ${sessionMins} min`;

    return {
      id: `${weekdayLabel.toLowerCase()}-${i}`,
      dayLabel: weekdayLabel,
      focus: t.focus,
      durationMinutes: sessionMins,
      difficulty: isRest || isRecovery ? "beginner" : difficulty,
      recommendedWorkout,
      completed: false,
      isRestDay: isRest,
      splitType: t.splitType,
      workoutConfig,
    };
  });

  return {
    id: `plan-${safeGoal}-${safeLevel}-${safeEquipment}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    goal: safeGoal,
    level: safeLevel,
    equipment: safeEquipment,
    days,
    splitName,
    isDeloadWeek: false,
  };
}
