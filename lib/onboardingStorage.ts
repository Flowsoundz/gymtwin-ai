import type { CoachAvatar, CoachName, Equipment, WorkoutGoal, WorkoutLevel } from "@/types";
import {
  ONBOARDING_DONE_KEY,
  QUICK_START_KEY,
  SAFETY_ACCEPTED_KEY,
  CAMERA_TRIED_KEY,
  FIRST_HINTS_SHOWN_KEY,
} from "@/lib/storageKeys";

export type QuickStartDefaults = {
  goal: WorkoutGoal;
  level: WorkoutLevel;
  equipment: Equipment;
  sessionLength: string;
  avatar: CoachAvatar;
  coach: CoachName;
};

function ls() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function isOnboardingDone(): boolean {
  return ls()?.getItem(ONBOARDING_DONE_KEY) === "true";
}

export function markOnboardingDone(): void {
  ls()?.setItem(ONBOARDING_DONE_KEY, "true");
}

export function saveQuickStartDefaults(d: QuickStartDefaults): void {
  ls()?.setItem(QUICK_START_KEY, JSON.stringify(d));
}

export function readQuickStartDefaults(): QuickStartDefaults | null {
  try {
    const raw = ls()?.getItem(QUICK_START_KEY);
    return raw ? (JSON.parse(raw) as QuickStartDefaults) : null;
  } catch {
    return null;
  }
}

export function isSafetyAccepted(): boolean {
  return ls()?.getItem(SAFETY_ACCEPTED_KEY) === "true";
}

export function markSafetyAccepted(): void {
  ls()?.setItem(SAFETY_ACCEPTED_KEY, "true");
}

export function isCameraTried(): boolean {
  return ls()?.getItem(CAMERA_TRIED_KEY) === "true";
}

export function markCameraTried(): void {
  ls()?.setItem(CAMERA_TRIED_KEY, "true");
}

export function areFirstHintsShown(): boolean {
  return ls()?.getItem(FIRST_HINTS_SHOWN_KEY) === "true";
}

export function markFirstHintsShown(): void {
  ls()?.setItem(FIRST_HINTS_SHOWN_KEY, "true");
}
