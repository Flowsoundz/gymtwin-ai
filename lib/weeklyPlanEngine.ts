import type { Equipment, WeeklyPlan, WeeklyPlanDay, WorkoutGoal, WorkoutLevel } from "@/types";

const DAY_FOCUSES = [
  { focus: "Full Body Foundation", workout: "Foundational full-body session" },
  { focus: "Core + Mobility", workout: "Core stability and mobility flow" },
  { focus: "Lower Body Strength", workout: "Lower-body strength session" },
  { focus: "Active Recovery", workout: "Active recovery and light mobility" },
  { focus: "Upper Body + Push", workout: "Upper-body push and control session" },
  { focus: "Conditioning", workout: "Conditioning and stamina session" },
  { focus: "Recovery / Stretch", workout: "Recovery stretch and reset" },
] as const;

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getDifficulty(level?: string): WeeklyPlanDay["difficulty"] {
  if (level === "Advanced") return "advanced";
  if (level === "Intermediate") return "intermediate";
  return "beginner";
}

function getBaseDuration(level?: string) {
  if (level === "Advanced") return 34;
  if (level === "Intermediate") return 26;
  return 20;
}

function getGoalAdjustment(goal?: string) {
  if (goal === "Stamina") return 6;
  if (goal === "Mobility") return -4;
  if (goal === "Lose weight") return 4;
  return 0;
}

function getWorkoutLabel(
  focus: string,
  goal?: string,
  equipment?: string
) {
  const equipmentLabel = equipment && equipment !== "None" ? ` with ${equipment}` : "";
  if (goal === "Mobility") return `${focus} mobility session${equipmentLabel}`;
  if (goal === "Build muscle") return `${focus} strength session${equipmentLabel}`;
  if (goal === "Lose weight") return `${focus} fat-loss session${equipmentLabel}`;
  if (goal === "Stamina") return `${focus} conditioning session${equipmentLabel}`;
  return `${focus} training session${equipmentLabel}`;
}

export function getTodayWeeklyPlanLabel() {
  return WEEKDAY_LABELS[new Date().getDay()];
}

export function generateWeeklyPlan(
  goal?: WorkoutGoal | string,
  level?: WorkoutLevel | string,
  equipment?: Equipment | string
): WeeklyPlan {
  const difficulty = getDifficulty(level);
  const baseDuration = getBaseDuration(level) + getGoalAdjustment(goal);
  const todayIndex = new Date().getDay();

  const days: WeeklyPlanDay[] = DAY_FOCUSES.map((entry, index) => {
    const weekdayLabel = WEEKDAY_LABELS[(todayIndex + index) % 7];
    const durationShift =
      entry.focus === "Active Recovery" || entry.focus === "Recovery / Stretch"
        ? -6
        : entry.focus === "Conditioning"
          ? 4
          : entry.focus === "Core + Mobility"
            ? -2
            : 0;

    return {
      id: `${weekdayLabel.toLowerCase()}-${index + 1}`,
      dayLabel: weekdayLabel,
      focus: entry.focus,
      durationMinutes: Math.max(12, baseDuration + durationShift),
      difficulty,
      recommendedWorkout: getWorkoutLabel(entry.workout, goal, equipment),
      completed: false,
    };
  });

  return {
    id: `weekly-plan-${goal ?? "general"}-${level ?? "beginner"}-${equipment ?? "none"}`,
    createdAt: new Date().toISOString(),
    goal,
    level,
    equipment,
    days,
  };
}
