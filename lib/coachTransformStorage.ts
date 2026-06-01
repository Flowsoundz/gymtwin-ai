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

function isValidPreset(p: PreviewTransform): boolean {
  if (p.scale !== undefined && (p.scale <= 0 || !isFinite(p.scale))) return false;
  if (p.position?.some((v) => !isFinite(v))) return false;
  if (p.cameraPosition) {
    const [x, y, z] = p.cameraPosition;
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return false;
    if (x === 0 && y === 0 && z === 0) return false;
  }
  return true;
}

export function loadTransformPreset(modelPath: string): PreviewTransform | null {
  const preset = readAllPresets()[modelPath] ?? null;
  if (!preset || !isValidPreset(preset)) return null;
  return preset;
}

export function clearTransformPreset(modelPath: string): void {
  if (typeof window === "undefined") return;
  const all = readAllPresets();
  delete all[modelPath];
  window.localStorage.setItem(COACH_TRANSFORM_PRESETS_KEY, JSON.stringify(all));
}
