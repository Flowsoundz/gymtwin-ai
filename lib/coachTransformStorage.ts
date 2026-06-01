import { COACH_TRANSFORM_PRESETS_KEY } from "@/lib/storageKeys";
import type { PreviewTransform } from "@/components/Coach3D";

type SavedPresets = Record<string, PreviewTransform>;

function readAllPresets(): SavedPresets {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(COACH_TRANSFORM_PRESETS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SavedPresets;
  } catch {
    return {};
  }
}

export function saveTransformPreset(modelPath: string, transform: PreviewTransform): void {
  if (typeof window === "undefined") return;
  const all = readAllPresets();
  all[modelPath] = transform;
  window.localStorage.setItem(COACH_TRANSFORM_PRESETS_KEY, JSON.stringify(all));
}

export function loadTransformPreset(modelPath: string): PreviewTransform | null {
  return readAllPresets()[modelPath] ?? null;
}

export function clearTransformPreset(modelPath: string): void {
  if (typeof window === "undefined") return;
  const all = readAllPresets();
  delete all[modelPath];
  window.localStorage.setItem(COACH_TRANSFORM_PRESETS_KEY, JSON.stringify(all));
}
