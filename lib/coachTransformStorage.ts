import { COACH_TRANSFORM_PRESETS_KEY } from "@/lib/storageKeys";
import { isSharedRuntimeHumanoidModel } from "@/lib/avatarAssets";
import type { PreviewTransform } from "@/components/Coach3D";

type SavedPresets = Record<string, PreviewTransform>;
type PreviewFrameKey = "full_body" | "in_frame" | "bust";

function buildPresetKey(modelPath: string, previewFrame: PreviewFrameKey): string {
  return `${modelPath}::${previewFrame}`;
}

function isNear(a: number | undefined, b: number, epsilon = 0.02): boolean {
  return typeof a === "number" && Math.abs(a - b) <= epsilon;
}

function isLegacyAtlasMobilePreset(
  modelPath: string,
  preset: PreviewTransform
): boolean {
  if (!isSharedRuntimeHumanoidModel(modelPath)) {
    return false;
  }

  return (
    isNear(preset.scale, 1) &&
    isNear(preset.position?.[0], 0) &&
    isNear(preset.position?.[1], -1.05) &&
    isNear(preset.position?.[2], 0) &&
    isNear(preset.rotation?.[0], 0) &&
    isNear(preset.rotation?.[1], 0) &&
    isNear(preset.rotation?.[2], 0) &&
    isNear(preset.cameraPosition?.[0], 0) &&
    isNear(preset.cameraPosition?.[1], 1.1) &&
    isNear(preset.cameraPosition?.[2], 4.8)
  );
}

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

export function saveTransformPreset(
  modelPath: string,
  previewFrame: PreviewFrameKey,
  transform: PreviewTransform
): void {
  if (typeof window === "undefined") return;
  const all = readAllPresets();
  all[buildPresetKey(modelPath, previewFrame)] = transform;
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

export function loadTransformPreset(
  modelPath: string,
  previewFrame: PreviewFrameKey
): PreviewTransform | null {
  const preset = readAllPresets()[buildPresetKey(modelPath, previewFrame)] ?? null;
  if (!preset || !isValidPreset(preset)) return null;
  if (isLegacyAtlasMobilePreset(modelPath, preset)) {
    clearTransformPreset(modelPath, previewFrame);
    return null;
  }
  return preset;
}

export function clearTransformPreset(
  modelPath: string,
  previewFrame: PreviewFrameKey
): void {
  if (typeof window === "undefined") return;
  const all = readAllPresets();
  delete all[buildPresetKey(modelPath, previewFrame)];
  window.localStorage.setItem(COACH_TRANSFORM_PRESETS_KEY, JSON.stringify(all));
}
