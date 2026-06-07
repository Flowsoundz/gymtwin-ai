import type { AvatarDisplaySettings, WorkoutAudioLevel, WorkoutAudioMode } from "@/types";

export const FLOWSOUNDZ_RADIO_URL = "https://flowsoundz.com";

export function getWorkoutAudioModeLabel(mode: WorkoutAudioMode): string {
  return mode === "flowsoundz_radio" ? "Flowsoundz Radio" : "External";
}

export function getWorkoutAudioLevelLabel(level: WorkoutAudioLevel): string {
  return level === "low" ? "Low" : level === "high" ? "High" : "Normal";
}

export function buildWorkoutAudioStatus(settings: AvatarDisplaySettings): string {
  const source = getWorkoutAudioModeLabel(settings.workoutAudioMode);
  const ducking = settings.duckExternalMusic ? "ducking on" : "ducking off";
  return `${source} · voice ${getWorkoutAudioLevelLabel(settings.coachVoiceVolume)} · ${ducking}`;
}
