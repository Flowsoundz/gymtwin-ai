import type { WorkoutMovement } from "@/types";

// Maps to clip names embedded in atlas-coach-mobile.glb (GT_ prefix)
const CATEGORY_CLIP: Record<string, string> = {
  legs:         "GT_MaximoAnimFitnessGtsquatdemo01",
  core:         "GT_MaximoAnimFitnessSituptoidle02",
  cardio:       "GT_MaximoAnimFitnessJumpingjacks02",
  warmup:       "GT_MaximoAnimFitnessFrontraises02",
  mobility:     "GT_MaximoAnimFitnessFrontraises02",
  cooldown:     "GT_MaximoAnimFitnessFrontraises02",
  "upper body": "GT_Pushup_Demo_001",
};

// Exercise name overrides — matched by substring (lowercase), longest match first
const NAME_CLIP: Array<[string, string]> = [
  ["plank",          "GT_Plank_Hold"],
  ["push-up",        "GT_Pushup_Demo_001"],
  ["pushup",         "GT_Pushup_Demo_001"],
  ["push up",        "GT_Pushup_Demo_001"],
  ["push",           "GT_Pushup_Demo_001"],
  ["pull-up",        "GT_MaximoAnimFitnessOverheadsquat02"],
  ["jumping jack",   "GT_MaximoAnimFitnessJumpingjacks02"],
  ["jump",           "GT_MaximoAnimFitnessJumpingjacks02"],
  ["march",          "GT_MaximoAnimFitnessJumpingjacks02"],
  ["shuffle",        "GT_MaximoAnimFitnessJumpingjacks02"],
  ["kettlebell",     "GT_MaximoAnimFitnessKettlebellswing04"],
  ["swing",          "GT_MaximoAnimFitnessKettlebellswing04"],
  ["bicycle",        "GT_MaximoAnimFitnessCirclecrunch02"],
  ["crunch",         "GT_MaximoAnimFitnessCirclecrunch02"],
  ["situp",          "GT_MaximoAnimFitnessSituptoidle02"],
  ["sit-up",         "GT_MaximoAnimFitnessSituptoidle02"],
  ["squat",          "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["lunge",          "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["bridge",         "GT_MaximoAnimFitnessSituptoidle02"],
  ["deadbug",        "GT_MaximoAnimFitnessSituptoidle02"],
  ["curl",           "GT_MaximoAnimFitnessBicepurl02"],
  ["row",            "GT_MaximoAnimFitnessBicepurl02"],
  ["raise",          "GT_MaximoAnimFitnessFrontraises02"],
  ["step",           "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["box",            "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["burpee",         "GT_Burpee_Demo"],
  ["snatch",         "GT_MaximoAnimFitnessSnatch03"],
  ["overhead",       "GT_MaximoAnimFitnessOverheadsquat02"],
  ["pike",           "GT_MaximoAnimFitnessPikewalk01"],
  ["pistol",         "GT_MaximoAnimFitnessPistolstart01"],
  ["shadow box",     "GT_Burpee_Demo"],
  ["air squat",      "GT_MaximoAnimFitnessAirsquatbentarms01"],
  ["back squat",     "GT_MaximoAnimFitnessBacksquat01"],
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
