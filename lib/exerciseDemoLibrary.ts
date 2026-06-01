import { getAvatarAnimationClipById } from "@/lib/avatarAnimationLibrary";
import { getEmbeddedClipNameForExerciseName } from "@/lib/exerciseAnimationMap";
import { getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
import type { AvatarAnimationClip, CoachAvatar } from "@/types";

export type ExerciseDemoStatus =
  | "available"
  | "prepared"
  | "camera_ready"
  | "planned"
  | "unmapped";

export type DemoFamily = "squat" | "pushup" | "plank" | null;

export type ExerciseDemoDescriptor = {
  exerciseKey: string;
  demoFamily: DemoFamily;
  title: string;
  status: ExerciseDemoStatus;
  clipId: string | null;
  clip: AvatarAnimationClip | null;
  embeddedClipName: string | null;
  summary: string;
  detail: string;
  targetPath: string | null;
  isWorkoutReady: boolean;
  isFallbackOnly: boolean;
};

type DemoSpec = {
  exerciseKey: string;
  demoFamily: NonNullable<DemoFamily>;
  title: string;
  clipId: string;
  targetPath: string;
  summary: string;
  detail: string;
};

const demoSpecs: DemoSpec[] = [
  {
    exerciseKey: "squat",
    demoFamily: "squat",
    title: "Squat Demo",
    clipId: "squat_demo_placeholder",
    targetPath: "/animations/fitness/squat/{avatar}_squat_demo_01.glb",
    summary: "Prepared — fitness animation clip is mapped and plays in Coach3D. Dedicated standalone file not yet exported.",
    detail: "Use this mapping for air squat, bodyweight squat, squat hold, lunge, and other squat-family sessions.",
  },
  {
    exerciseKey: "pushup",
    demoFamily: "pushup",
    title: "Push-Up Demo",
    clipId: "pushup_demo_placeholder",
    targetPath: "/animations/fitness/pushup/{avatar}_pushup_demo_01.glb",
    summary: "Prepared — fitness animation clip is mapped and plays in Coach3D. Dedicated standalone file not yet exported.",
    detail: "Use this mapping for push-ups, knee push-ups, incline/decline variations, and pressing movements.",
  },
  {
    exerciseKey: "plank",
    demoFamily: "plank",
    title: "Plank Demo",
    clipId: "plank_demo_placeholder",
    targetPath: "/animations/fitness/plank/{avatar}_plank_demo_01.glb",
    summary: "Prepared — fitness animation clip is mapped and plays in Coach3D. Dedicated standalone file not yet exported.",
    detail: "Use this mapping for plank holds, forearm plank, high plank, side plank, and core brace teaching.",
  },
];

// Keyword → demo family. Checked as lowercase substrings after normalization.
// Multi-word phrases listed before single-word catch-alls so more specific matches win.
const FAMILY_KEYWORDS: Array<[string, NonNullable<DemoFamily>]> = [
  // squat family
  ["air squat",        "squat"],
  ["bodyweight squat", "squat"],
  ["squat hold",       "squat"],
  ["squat jump",       "squat"],
  ["goblet squat",     "squat"],
  ["sumo squat",       "squat"],
  ["split squat",      "squat"],
  ["squat",            "squat"],
  ["lunge",            "squat"],
  // pushup family
  ["knee push",        "pushup"],
  ["incline push",     "pushup"],
  ["decline push",     "pushup"],
  ["diamond push",     "pushup"],
  ["wide push",        "pushup"],
  ["push-up",          "pushup"],
  ["push up",          "pushup"],
  ["pushup",           "pushup"],
  ["push",             "pushup"],
  // plank family
  ["forearm plank",    "plank"],
  ["high plank",       "plank"],
  ["side plank",       "plank"],
  ["plank hold",       "plank"],
  ["plank",            "plank"],
];

function detectDemoFamily(exerciseName: string): NonNullable<DemoFamily> | null {
  // Camera coach mapping takes priority (exact canonical names)
  const cameraMode = getCameraCoachModeForMovementName(exerciseName);
  if (cameraMode) return cameraMode as NonNullable<DemoFamily>;

  const lower = exerciseName.trim().toLowerCase();
  for (const [keyword, family] of FAMILY_KEYWORDS) {
    if (lower.includes(keyword)) return family;
  }
  return null;
}

export function getExerciseDemoDescriptor(
  exerciseName: string,
  selectedAvatar: CoachAvatar
): ExerciseDemoDescriptor {
  const family = detectDemoFamily(exerciseName);
  const cameraMode = getCameraCoachModeForMovementName(exerciseName);
  const spec = family ? (demoSpecs.find((s) => s.demoFamily === family) ?? null) : null;
  const embeddedClipName = getEmbeddedClipNameForExerciseName(exerciseName);

  if (!spec) {
    return {
      exerciseKey: "unmapped",
      demoFamily: null,
      title: cameraMode ? `${cameraMode} Coach Demo` : "Demo Mapping Pending",
      status: cameraMode ? "camera_ready" : "planned",
      clipId: null,
      clip: null,
      embeddedClipName,
      summary: cameraMode
        ? "Camera coaching is ready. A dedicated demo clip is not mapped for this movement yet."
        : "This movement does not have a demo mapping yet. Coach text and form tips are still available.",
      detail: cameraMode
        ? "Live camera feedback is active even without a visual demo clip."
        : "Keep using form tips and coach text until a matching demonstration clip is promoted into the runtime library.",
      targetPath: null,
      isWorkoutReady: Boolean(embeddedClipName || cameraMode),
      isFallbackOnly: !embeddedClipName && !cameraMode,
    };
  }

  const clip = getAvatarAnimationClipById(spec.clipId, selectedAvatar);
  const standaloneAvailable = Boolean(clip?.isAvailable && clip.filePath);

  let status: ExerciseDemoStatus;
  if (standaloneAvailable) {
    status = "available";
  } else if (embeddedClipName) {
    status = "prepared";
  } else if (cameraMode) {
    status = "camera_ready";
  } else {
    status = "planned";
  }

  const isWorkoutReady = standaloneAvailable || Boolean(embeddedClipName);

  return {
    exerciseKey: spec.exerciseKey,
    demoFamily: spec.demoFamily,
    title: spec.title,
    status,
    clipId: spec.clipId,
    clip,
    embeddedClipName,
    summary: standaloneAvailable
      ? "Dedicated demo clip file is available for playback."
      : spec.summary,
    detail: spec.detail,
    targetPath: spec.targetPath,
    isWorkoutReady,
    isFallbackOnly: !isWorkoutReady && !cameraMode,
  };
}
