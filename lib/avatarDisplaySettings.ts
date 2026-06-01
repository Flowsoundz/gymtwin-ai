import { AVATAR_DISPLAY_SETTINGS_KEY } from "@/lib/storageKeys";
import type { AvatarDisplayMode, AvatarDisplaySettings } from "@/types";

export const defaultAvatarDisplaySettings: AvatarDisplaySettings = {
  mode: "coach_card",
  show3DCoach: true,
  compactInWorkout: true,
  showDuringCamera: true,
  showExerciseDemos: true,
  minimalCameraHud: true,
};

function isAvatarDisplayMode(value: unknown): value is AvatarDisplayMode {
  return (
    value === "coach_card" ||
    value === "floating_overlay" ||
    value === "camera_corner" ||
    value === "hidden"
  );
}

export function sanitizeAvatarDisplaySettings(
  value: AvatarDisplaySettings | Partial<AvatarDisplaySettings> | null | undefined
): AvatarDisplaySettings {
  return {
    mode: isAvatarDisplayMode(value?.mode) ? value.mode : defaultAvatarDisplaySettings.mode,
    show3DCoach:
      typeof value?.show3DCoach === "boolean"
        ? value.show3DCoach
        : defaultAvatarDisplaySettings.show3DCoach,
    compactInWorkout:
      typeof value?.compactInWorkout === "boolean"
        ? value.compactInWorkout
        : defaultAvatarDisplaySettings.compactInWorkout,
    showDuringCamera:
      typeof value?.showDuringCamera === "boolean"
        ? value.showDuringCamera
        : defaultAvatarDisplaySettings.showDuringCamera,
    showExerciseDemos:
      typeof value?.showExerciseDemos === "boolean"
        ? value.showExerciseDemos
        : defaultAvatarDisplaySettings.showExerciseDemos,
    minimalCameraHud:
      typeof value?.minimalCameraHud === "boolean"
        ? value.minimalCameraHud
        : defaultAvatarDisplaySettings.minimalCameraHud,
  };
}

export function readAvatarDisplaySettings(): AvatarDisplaySettings {
  if (typeof window === "undefined") {
    return defaultAvatarDisplaySettings;
  }

  const raw = window.localStorage.getItem(AVATAR_DISPLAY_SETTINGS_KEY);
  if (!raw) {
    return defaultAvatarDisplaySettings;
  }

  try {
    return sanitizeAvatarDisplaySettings(JSON.parse(raw) as Partial<AvatarDisplaySettings>);
  } catch {
    window.localStorage.removeItem(AVATAR_DISPLAY_SETTINGS_KEY);
    return defaultAvatarDisplaySettings;
  }
}

export function saveAvatarDisplaySettings(settings: AvatarDisplaySettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    AVATAR_DISPLAY_SETTINGS_KEY,
    JSON.stringify(sanitizeAvatarDisplaySettings(settings))
  );
}
