import type { TrackingMode } from "@/hooks/useCameraCoach";

function normalize(name: string) {
  return name.replace(/-instance-\d+$/i, "").trim();
}

// ─── Exercise → Tracking Mode Map ────────────────────────────────────────────
// Maps exercise names (from both the old fitnessLibrary and the new personalized
// engine) to the appropriate MediaPipe tracking mode.
//
// Rules for inclusion:
//   squat  — standing exercises with significant knee flexion (squats, lunges, step-ups)
//   pushup — exercises where elbow angle drives rep detection (push-up variations, dips)
//   plank  — floor/horizontal exercises where hip/spine alignment is the key signal
//            (planks, glute bridges, floor holds, cat-cow)
//
// Exercises are excluded when the tracking mode would not add genuine signal
// (e.g. rows, curls, lateral raises, mobility stretches).

const SQUAT_EXERCISES = new Set([
  // ── Bodyweight squats & variations ──────────────────────────────────────
  "Tempo Bodyweight Squats",
  "Bodyweight Squats",
  "Squat Jumps",
  "Wall Sit Hold",
  "Deep Squat Hold",
  "Supported Deep Squat Hold",

  // ── Loaded squat variations ──────────────────────────────────────────────
  "Dumbbell Goblet Squats",
  "Dumbbell Goblet Squat",
  "Banded Squats",
  "Dumbbell Thrusters",

  // ── Lunge & single-leg variations ───────────────────────────────────────
  "Alternating Reverse Lunges",
  "Reverse Lunge with Hold",
  "Reverse Lunge Hold",
  "Supported Step Lunges",
  "Dumbbell Walking Lunges",

  // ── Split squats ─────────────────────────────────────────────────────────
  "Bulgarian Split Squats",
  "Bench Bulgarian Split Squats",

  // ── Step-ups ─────────────────────────────────────────────────────────────
  "Step-Ups with Pause",
  "Bench Step-Ups",
  "Bench Step-Up Knee Drives",

  // ── Lateral ──────────────────────────────────────────────────────────────
  "Banded Lateral Walks",
  "Lateral Resisted Shuffles",
]);

const PUSHUP_EXERCISES = new Set([
  // ── Standard push-up variations ─────────────────────────────────────────
  "Push-Ups",
  "Core-Braced Floor Push-Ups",
  "Diamond Push-Ups",
  "Pike Push-Ups",
  "Wide Push-Ups",
  "Push-Up to Plank Hold",

  // ── Elevated push-up variations ──────────────────────────────────────────
  "Incline Push-Ups",
  "Incline Bench Push-Ups",
  "Decline Push-Ups",
  "Banded Push-Ups",
  "Decline Tricep Push-Up",
  "Archer Push-Ups",

  // ── Dip variations ───────────────────────────────────────────────────────
  "Chair Tricep Dips",
  "Bench Dips",
  "Tricep Floor Dips",
]);

const PLANK_EXERCISES = new Set([
  // ── Direct plank holds ───────────────────────────────────────────────────
  "Forearm Plank Hold",
  "Plank Shoulder Taps",

  // ── Horizontal floor exercises with spinal alignment signal ─────────────
  "Mountain Climbers",
  "Renegade Rows",
  "Deadbug Core Stabilization",

  // ── Hip-hinge / glute bridge (lying horizontal, hip elevation tracked) ──
  "Glute Bridges",
  "Banded Glute Bridges",
  "Single-Leg Glute Bridge",
  "Banded Hip Thrusts",

  // ── Hands-and-knees mobility (hip/spine alignment) ───────────────────────
  "Cat-Cow Flow",
  "Standing Cat-Cow",
]);

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCameraCoachModeForMovementName(name: string): TrackingMode | null {
  const n = normalize(name);
  if (SQUAT_EXERCISES.has(n)) return "squat";
  if (PUSHUP_EXERCISES.has(n)) return "pushup";
  if (PLANK_EXERCISES.has(n)) return "plank";
  return null;
}

export function getCameraCoachLabel(mode: TrackingMode): string {
  if (mode === "squat") return "Squat & Lunge Tracker";
  if (mode === "pushup") return "Push-Up Tracker";
  return "Plank & Alignment Tracker";
}

export function getCameraCoachHint(mode: TrackingMode): string {
  if (mode === "squat") return "Stand 6–8 ft away facing the camera. Your full body must be visible.";
  if (mode === "pushup") return "Place the camera at floor level to your side. Keep your whole body in frame.";
  return "Camera at floor level to your side. Your hips, shoulders, and feet must all be visible.";
}

// Returns how many exercises in a list are camera-trackable and which modes they use
export function countCameraReadyExercises(exerciseNames: string[]): {
  total: number;
  squat: number;
  pushup: number;
  plank: number;
} {
  let squat = 0, pushup = 0, plank = 0;
  for (const name of exerciseNames) {
    const mode = getCameraCoachModeForMovementName(name);
    if (mode === "squat") squat++;
    else if (mode === "pushup") pushup++;
    else if (mode === "plank") plank++;
  }
  return { total: squat + pushup + plank, squat, pushup, plank };
}
