"use client";

function readFlag(name: string, defaultValue = true) {
  const rawValue = process.env[name];
  if (rawValue === undefined) {
    return defaultValue;
  }

  return rawValue !== "0";
}

export const ENABLE_COACH3D = readFlag("NEXT_PUBLIC_ENABLE_COACH3D");
export const ENABLE_CAMERA_TRACKING = readFlag("NEXT_PUBLIC_ENABLE_CAMERA_TRACKING");
export const ENABLE_MEDIAPIPE = readFlag("NEXT_PUBLIC_ENABLE_MEDIAPIPE");
export const ENABLE_EXERCISE_DEMOS = readFlag("NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS");

export const FEATURE_ISOLATION_FLAGS = {
  ENABLE_COACH3D,
  ENABLE_CAMERA_TRACKING,
  ENABLE_MEDIAPIPE,
  ENABLE_EXERCISE_DEMOS,
} as const;
