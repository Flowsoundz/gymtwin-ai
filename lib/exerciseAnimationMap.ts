import type { WorkoutMovement } from "@/types";

// Maps to clip names in public/models/animations/fitness-animations.glb
const CATEGORY_CLIP: Record<string, string> = {
  legs:        "Squat",
  core:        "Situp",
  cardio:      "JumpingJacks",
  warmup:      "FrontRaises",
  mobility:    "FrontRaises",
  cooldown:    "FrontRaises",
  "upper body": "PushUp",
};

// Exercise name overrides — matched by substring (lowercase)
const NAME_CLIP: Array<[string, string]> = [
  ["plank",          "Plank"],
  ["push",           "PushUp"],
  ["pull-up",        "PushUp"],
  ["row",            "BicepCurl"],
  ["curl",           "BicepCurl"],
  ["raise",          "FrontRaises"],
  ["squat",          "Squat"],
  ["lunge",          "Squat"],
  ["bridge",         "Situp"],
  ["deadbug",        "Situp"],
  ["crunch",         "BicycleCrunch"],
  ["bicycle",        "BicycleCrunch"],
  ["situp",          "Situp"],
  ["sit-up",         "Situp"],
  ["jumping jack",   "JumpingJacks"],
  ["march",          "JumpingJacks"],
  ["step",           "BoxJump"],
  ["box",            "BoxJump"],
  ["burpee",         "Burpee"],
  ["kettlebell",     "KettlebellSwing"],
  ["swing",          "KettlebellSwing"],
  ["shadow box",     "Burpee"],
  ["shuffle",        "JumpingJacks"],
];

export function getExerciseClipName(movement: WorkoutMovement): string | null {
  const lower = movement.name.toLowerCase();

  for (const [keyword, clip] of NAME_CLIP) {
    if (lower.includes(keyword)) return clip;
  }

  return CATEGORY_CLIP[movement.category] ?? null;
}

export function getEmbeddedClipNameForExerciseName(exerciseName: string): string | null {
  const lower = exerciseName.toLowerCase();
  for (const [keyword, clip] of NAME_CLIP) {
    if (lower.includes(keyword)) return clip;
  }
  return null;
}

export const FITNESS_ANIMATION_PACK = "/models/animations/fitness-animations.glb";
