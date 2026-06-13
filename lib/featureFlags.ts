"use client";

function readFlag(rawValue: string | undefined, defaultValue = true) {
  if (rawValue === undefined || rawValue === "") {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized !== "0" && normalized !== "false";
}

export const ENABLE_COACH3D = readFlag(process.env.NEXT_PUBLIC_ENABLE_COACH3D);
export const ENABLE_CAMERA_TRACKING = readFlag(process.env.NEXT_PUBLIC_ENABLE_CAMERA_TRACKING);
export const ENABLE_MEDIAPIPE = readFlag(process.env.NEXT_PUBLIC_ENABLE_MEDIAPIPE);
export const ENABLE_EXERCISE_DEMOS = readFlag(process.env.NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS);

export const FEATURE_ISOLATION_FLAGS = {
  ENABLE_COACH3D,
  ENABLE_CAMERA_TRACKING,
  ENABLE_MEDIAPIPE,
  ENABLE_EXERCISE_DEMOS,
} as const;
