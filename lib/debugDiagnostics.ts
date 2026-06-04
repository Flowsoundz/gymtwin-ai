"use client";

import {
  ENABLE_CAMERA_TRACKING,
  ENABLE_COACH3D,
  ENABLE_EXERCISE_DEMOS,
  ENABLE_MEDIAPIPE,
} from "@/lib/featureFlags";

export type TrackingLoopDiagnostics = {
  active: boolean;
  mode: string | null;
  status: string;
  lastTickAt: number | null;
};

export type ClientFeatureFlagsSnapshot = {
  coach3DEnabled: boolean;
  cameraTrackingEnabled: boolean;
  mediapipeEnabled: boolean;
  exerciseDemosEnabled: boolean;
};

export type ClientDiagnosticsSnapshot = {
  activeCoach3DCount: number;
  activeThreeCanvasCount: number;
  loadedGLTFCount: number;
  loadedGLTFPaths: string[];
  routePath: string;
  currentScreen: string | null;
  featureFlags: ClientFeatureFlagsSnapshot;
  trackingLoop: TrackingLoopDiagnostics;
  updatedAt: number;
};

declare global {
  interface Window {
    __GYMTWIN_DEBUG_CLIENT__?: ClientDiagnosticsSnapshot;
  }
}

export const diagnosticsEnabled =
  process.env.NEXT_PUBLIC_GYMTWIN_DEBUG_DIAGNOSTICS === "1";

const defaultSnapshot = (): ClientDiagnosticsSnapshot => ({
  activeCoach3DCount: 0,
  activeThreeCanvasCount: 0,
  loadedGLTFCount: 0,
  loadedGLTFPaths: [],
  routePath: "/",
  currentScreen: null,
  featureFlags: {
    coach3DEnabled: ENABLE_COACH3D,
    cameraTrackingEnabled: ENABLE_CAMERA_TRACKING,
    mediapipeEnabled: ENABLE_MEDIAPIPE,
    exerciseDemosEnabled: ENABLE_EXERCISE_DEMOS,
  },
  trackingLoop: {
    active: false,
    mode: null,
    status: "stopped",
    lastTickAt: null,
  },
  updatedAt: Date.now(),
});

export function readClientDiagnostics(): ClientDiagnosticsSnapshot {
  if (typeof window === "undefined") {
    return defaultSnapshot();
  }

  if (!window.__GYMTWIN_DEBUG_CLIENT__) {
    window.__GYMTWIN_DEBUG_CLIENT__ = defaultSnapshot();
  }

  return window.__GYMTWIN_DEBUG_CLIENT__;
}

export function mutateClientDiagnostics(
  updater: (current: ClientDiagnosticsSnapshot) => ClientDiagnosticsSnapshot
) {
  if (!diagnosticsEnabled || typeof window === "undefined") {
    return;
  }

  const current = readClientDiagnostics();
  window.__GYMTWIN_DEBUG_CLIENT__ = {
    ...updater(current),
    updatedAt: Date.now(),
  };
}

export function updateTrackingLoopDiagnostics(next: Partial<TrackingLoopDiagnostics>) {
  mutateClientDiagnostics((current) => ({
    ...current,
    trackingLoop: {
      ...current.trackingLoop,
      ...next,
    },
  }));
}

export function setClientDiagnosticsContext(next: {
  currentScreen: string | null;
  routePath: string;
}) {
  mutateClientDiagnostics((current) => ({
    ...current,
    currentScreen: next.currentScreen,
    routePath: next.routePath,
    featureFlags: {
      coach3DEnabled: ENABLE_COACH3D,
      cameraTrackingEnabled: ENABLE_CAMERA_TRACKING,
      mediapipeEnabled: ENABLE_MEDIAPIPE,
      exerciseDemosEnabled: ENABLE_EXERCISE_DEMOS,
    },
  }));
}
