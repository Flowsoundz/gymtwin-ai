import type { WorkoutMovement } from "@/types";

// Category fallbacks — used when no name keyword matches
const CATEGORY_CLIP: Record<string, string> = {
  legs:         "GT_MaximoAnimFitnessGtsquatdemo01",
  core:         "GT_MaximoAnimFitnessSituptoidle02",
  cardio:       "GT_MaximoAnimFitnessJumpingjacks02",
  warmup:       "GT_MaximoAnimFitnessFrontraises02",
  mobility:     "GT_MaximoAnimFitnessGtsquatdemo01",
  cooldown:     "GT_MaximoAnimFitnessSituptoidle02",
  "upper body": "GT_Pushup_Demo_001",
};

// Name overrides — longest/most-specific match wins, checked in order
const NAME_CLIP: Array<[string, string]> = [
  // ── Multi-word exact phrases first ────────────────────────────────────────
  ["shadow box",        "GT_Burpee_Demo"],
  ["seal jack",         "GT_MaximoAnimFitnessJumpingjacks02"],
  ["jumping jack",      "GT_MaximoAnimFitnessJumpingjacks02"],
  ["air squat",         "GT_MaximoAnimFitnessAirsquatbentarms01"],
  ["back squat",        "GT_MaximoAnimFitnessBacksquat01"],
  ["goblet squat",      "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["split squat",       "GT_MaximoAnimFitnessPistolstart01"],
  ["overhead squat",    "GT_MaximoAnimFitnessOverheadsquat02"],
  ["overhead press",    "GT_MaximoAnimFitnessOverheadsquat02"],
  ["pull-apart",        "GT_MaximoAnimFitnessFrontraises02"],
  ["pull apart",        "GT_MaximoAnimFitnessFrontraises02"],
  ["pull-up",           "GT_MaximoAnimFitnessOverheadsquat02"],
  ["pull up",           "GT_MaximoAnimFitnessOverheadsquat02"],
  ["push-up",           "GT_Pushup_Demo_001"],
  ["push up",           "GT_Pushup_Demo_001"],
  ["sit-up",            "GT_MaximoAnimFitnessSituptoidle02"],
  ["dead bug",          "GT_MaximoAnimFitnessSituptoidle02"],
  ["knee tuck",         "GT_MaximoAnimFitnessCirclecrunch02"],
  ["step-up",           "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["step up",           "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["hip flexor",        "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["hip circular",      "GT_MaximoAnimFitnessFrontraises02"],
  ["glute bridge",      "GT_MaximoAnimFitnessSituptoidle02"],
  ["child",             "GT_MaximoAnimFitnessSituptoidle02"],
  ["hamstring",         "GT_MaximoAnimFitnessSituptoidle02"],

  // ── Single keywords ────────────────────────────────────────────────────────
  ["bulgarian",         "GT_MaximoAnimFitnessPistolstart01"],
  ["pistol",            "GT_MaximoAnimFitnessPistolstart01"],
  ["plank",             "GT_Plank_Hold"],
  ["burpee",            "GT_Burpee_Demo"],
  ["snatch",            "GT_MaximoAnimFitnessSnatch03"],
  ["kettlebell",        "GT_MaximoAnimFitnessKettlebellswing04"],
  ["swing",             "GT_MaximoAnimFitnessKettlebellswing04"],
  ["pike",              "GT_MaximoAnimFitnessPikewalk01"],
  ["bicycle",           "GT_MaximoAnimFitnessCirclecrunch02"],
  ["crunch",            "GT_MaximoAnimFitnessCirclecrunch02"],
  ["tuck",              "GT_MaximoAnimFitnessCirclecrunch02"],
  ["situp",             "GT_MaximoAnimFitnessSituptoidle02"],
  ["pushup",            "GT_Pushup_Demo_001"],
  ["deadbug",           "GT_MaximoAnimFitnessSituptoidle02"],
  ["bridge",            "GT_MaximoAnimFitnessSituptoidle02"],
  ["glute",             "GT_MaximoAnimFitnessSituptoidle02"],
  ["pallof",            "GT_MaximoAnimFitnessSituptoidle02"],
  ["cat",               "GT_MaximoAnimFitnessSituptoidle02"],
  ["squat",             "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["lunge",             "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["step",              "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["hip",               "GT_MaximoAnimFitnessGtsquatdemo01"],
  ["push",              "GT_Pushup_Demo_001"],
  ["press",             "GT_Pushup_Demo_001"],
  ["chest",             "GT_Pushup_Demo_001"],
  ["overhead",          "GT_MaximoAnimFitnessOverheadsquat02"],
  ["curl",              "GT_MaximoAnimFitnessBicepurl02"],
  ["row",               "GT_MaximoAnimFitnessBicepurl02"],
  ["rotation",          "GT_MaximoAnimFitnessFrontraises02"],
  ["raise",             "GT_MaximoAnimFitnessFrontraises02"],
  ["shoulder",          "GT_MaximoAnimFitnessFrontraises02"],
  ["spine",             "GT_MaximoAnimFitnessFrontraises02"],
  ["t-spine",           "GT_MaximoAnimFitnessFrontraises02"],
  ["opener",            "GT_MaximoAnimFitnessFrontraises02"],
  ["jack",              "GT_MaximoAnimFitnessJumpingjacks02"],
  ["jump",              "GT_MaximoAnimFitnessJumpingjacks02"],
  ["march",             "GT_MaximoAnimFitnessJumpingjacks02"],
  ["shuffle",           "GT_MaximoAnimFitnessJumpingjacks02"],
  ["tap",               "GT_MaximoAnimFitnessJumpingjacks02"],
  ["box",               "GT_Burpee_Demo"],
];

export function getExerciseClipName(movement: WorkoutMovement): string | null {
  const lower = movement.name.toLowerCase();
  for (const [keyword, clip] of NAME_CLIP) {
    if (lower.includes(keyword)) return clip;
  }
  return CATEGORY_CLIP[movement.category] ?? null;
}

// Movements performed on the floor (hands/knees/back/stomach) where the camera
// should orbit to a side profile and the spine path overlay is most useful.
const FLOOR_MOVEMENT_KEYWORDS = [
  "plank", "push-up", "push up", "pushup", "sit-up", "situp", "crunch",
  "bicycle", "dead bug", "deadbug", "glute bridge", "bridge", "glute",
  "cat", "cow", "child", "hamstring", "pike", "knee tuck", "cobra",
  "bird dog", "pallof", "dead lift floor",
];

export function isFloorMovementName(name: string): boolean {
  const lower = name.toLowerCase();
  return FLOOR_MOVEMENT_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function getEmbeddedClipNameForExerciseName(exerciseName: string): string | null {
  const lower = exerciseName.toLowerCase();
  for (const [keyword, clip] of NAME_CLIP) {
    if (lower.includes(keyword)) return clip;
  }
  return null;
}

export const FITNESS_ANIMATION_PACK = "/models/animations/fitness-animations.glb";
