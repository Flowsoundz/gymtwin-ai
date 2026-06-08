import type { AvatarDisplaySettings, WorkoutAudioLevel, WorkoutAudioMode } from "@/types";

export const FLOWSOUNDZ_RADIO_URL = "https://flowsoundz.com";
export const FLOWSOUNDZ_RADIO_ACTIVE = process.env.NEXT_PUBLIC_RADIO_ACTIVE === "true";
export const FLOWSOUNDZ_RADIO_STAGING_MESSAGE =
  "Flowsoundz Radio is staging right now. Live stream coming soon.";
export const SUPPORTED_BACKGROUND_AUDIO_SERVICES = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "SoundCloud",
  "Flowsoundz Radio",
];

const VOICE_VOLUME_MULTIPLIER: Record<WorkoutAudioLevel, number> = {
  low: 0.6,
  normal: 0.82,
  high: 1,
};

const CUE_GAIN_MULTIPLIER: Record<WorkoutAudioLevel, number> = {
  low: 0.65,
  normal: 1,
  high: 1.22,
};

export function getWorkoutAudioModeLabel(mode: WorkoutAudioMode): string {
  return mode === "flowsoundz_radio" ? "Flowsoundz Radio" : "Any Background Music";
}

export function getWorkoutAudioLevelLabel(level: WorkoutAudioLevel): string {
  return level === "low" ? "Low" : level === "high" ? "High" : "Normal";
}

export function getWorkoutVoiceVolumeMultiplier(level: WorkoutAudioLevel): number {
  return VOICE_VOLUME_MULTIPLIER[level];
}

export function getWorkoutCueGainMultiplier(level: WorkoutAudioLevel): number {
  return CUE_GAIN_MULTIPLIER[level];
}

export function buildWorkoutAudioStatus(settings: AvatarDisplaySettings): string {
  const source = getWorkoutAudioModeLabel(settings.workoutAudioMode);
  const ducking = settings.duckExternalMusic ? "ducking on" : "ducking off";
  return `${source} · voice ${getWorkoutAudioLevelLabel(settings.coachVoiceVolume)} · ${ducking}`;
}
