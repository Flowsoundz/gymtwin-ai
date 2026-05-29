import type { TrackingMode } from "@/hooks/useCameraCoach";

function normalizeMovementName(name: string) {
  return name.replace(/-instance-\d+$/i, "").trim();
}

export function getCameraCoachModeForMovementName(name: string): TrackingMode | null {
  const normalizedName = normalizeMovementName(name);

  if (normalizedName === "Tempo Bodyweight Squats") return "squat";
  if (normalizedName === "Core-Braced Floor Push-Ups") return "pushup";
  if (normalizedName === "Forearm Plank Hold") return "plank";
  return null;
}

export function getCameraCoachLabel(mode: TrackingMode) {
  if (mode === "squat") return "Squat";
  if (mode === "pushup") return "Push-Up";
  return "Plank";
}
