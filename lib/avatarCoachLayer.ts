import type { CoachAnimationHint, CoachBrainMood, CoachBrainOutput } from "@/lib/coachBrain";
import { getExerciseDemoDescriptor, type ExerciseDemoDescriptor } from "@/lib/exerciseDemoLibrary";
import type { AvatarCoachRole, AvatarCoachSurface, CoachAvatar } from "@/types";

export type AvatarCoachLayerInput = {
  surface: AvatarCoachSurface;
  selectedAvatar: CoachAvatar;
  coachBrain: CoachBrainOutput;
  exerciseName?: string | null;
  cameraActive?: boolean;
  trackingIssue?: boolean;
  warningActive?: boolean;
  isVoiceListening?: boolean;
  isRestPhase?: boolean;
  isWorkoutComplete?: boolean;
  highlightDemo?: boolean;
  compactPreference?: boolean;
};

export type AvatarCoachLayerState = {
  surface: AvatarCoachSurface;
  role: AvatarCoachRole;
  mood: CoachBrainMood;
  animationHint: CoachAnimationHint;
  demoClipName: string | null;
  title: string;
  message: string;
  shouldShowDemoCard: boolean;
  shouldPreferCompact: boolean;
  demoDescriptor: ExerciseDemoDescriptor | null;
};

function getSurfaceTitle(surface: AvatarCoachSurface) {
  switch (surface) {
    case "workout_tracking":
      return "Live Coach";
    case "camera_setup":
      return "Setup Coach";
    case "summary":
      return "Recovery Coach";
    case "progress":
      return "Progress Coach";
    case "model_lab":
      return "Preview Coach";
    default:
      return "Coach";
  }
}

export function getAvatarCoachLayerState(
  input: AvatarCoachLayerInput
): AvatarCoachLayerState {
  const demoDescriptor = input.exerciseName
    ? getExerciseDemoDescriptor(input.exerciseName, input.selectedAvatar)
    : null;

  let role: AvatarCoachRole = "presence";
  let title = getSurfaceTitle(input.surface);
  let mood = input.coachBrain.mood;
  let animationHint = input.coachBrain.animationHint;
  let message = input.coachBrain.message;

  if (input.isVoiceListening) {
    role = "presence";
    title = "Listening";
    mood = "listening";
    animationHint = "listening";
    message = "I’m listening. You can control the workout hands-free.";
  } else if (input.trackingIssue || input.warningActive) {
    role = "warning";
    title = input.surface === "camera_setup" ? "Setup Fix" : "Coach Warning";
    mood = input.coachBrain.mood === "error" ? "error" : "warning";
    animationHint = input.coachBrain.mood === "error" ? "warning" : "pointing";
  } else if (input.isWorkoutComplete) {
    role = "celebration";
    title = "Workout Complete";
    mood = input.coachBrain.mood === "celebrating" ? "celebrating" : "good";
    animationHint = input.coachBrain.mood === "celebrating" ? "celebrate" : "thumbs_up";
  } else if (input.isRestPhase) {
    role = "encouragement";
    title = "Between Sets";
    mood = "coaching";
    animationHint = "talking";
  } else if (
    input.highlightDemo &&
    demoDescriptor &&
    (demoDescriptor.status === "available" || demoDescriptor.status === "prepared")
  ) {
    role = "demo";
    title = demoDescriptor.title;
    mood = "coaching";
    animationHint = "pointing";
    message =
      demoDescriptor.status === "available"
        ? "Demo clip is ready for this movement."
        : "This movement is prepared for a dedicated demo clip as soon as it is exported.";
  } else if (input.surface === "camera_setup") {
    role = "setup";
    title = "Camera Setup";
  } else if (input.surface === "progress") {
    role = "encouragement";
    title = "Progress Focus";
  }

  return {
    surface: input.surface,
    role,
    mood,
    animationHint,
    demoClipName: demoDescriptor?.embeddedClipName ?? null,
    title,
    message,
    shouldShowDemoCard:
      Boolean(input.highlightDemo) &&
      Boolean(demoDescriptor) &&
      !input.cameraActive &&
      (demoDescriptor?.status === "available" || demoDescriptor?.status === "prepared"),
    shouldPreferCompact:
      (input.compactPreference ?? false) || input.surface === "camera_setup" || input.surface === "workout_tracking",
    demoDescriptor,
  };
}
