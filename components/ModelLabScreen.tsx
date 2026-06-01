"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coach3D,
  getCoachModelTransformPreset,
  type Coach3DMood,
  type PreviewTransform,
} from "@/components/Coach3D";
import { saveTransformPreset, loadTransformPreset, clearTransformPreset } from "@/lib/coachTransformStorage";
import {
  getAnimationForHint,
  getAvatarAnimationLibrary,
  getAvatarAnimationClipById,
} from "@/lib/avatarAnimationLibrary";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { AvatarAnimationClip, CoachAvatar } from "@/types";

type ModelLabScreenProps = {
  onBackHome: () => void;
  primaryButton: string;
  secondaryButton: string;
};

type ModelOption = {
  id: "nova" | "atlas_full" | "atlas_mobile";
  label: string;
  avatar: CoachAvatar;
  path: string;
};

type ModelStatusState = "checking" | "found" | "missing" | "error";
type PreviewFrameMode = "full_body" | "in_frame";

const modelOptions: ModelOption[] = [
  { id: "nova", label: "Nova", avatar: "Nova", path: "/models/nova-coach.glb" },
  { id: "atlas_full", label: "Atlas Full", avatar: "Atlas", path: "/models/atlas-coach.glb" },
  { id: "atlas_mobile", label: "Atlas Mobile", avatar: "Atlas", path: "/models/atlas-coach-mobile.glb" },
];

const moods: Coach3DMood[] = [
  "idle",
  "listening",
  "coaching",
  "good",
  "warning",
  "error",
  "celebrating",
];

const moodAnimationMap: Record<Coach3DMood, CoachAnimationHint> = {
  idle: "idle",
  listening: "listening",
  coaching: "talking",
  good: "thumbs_up",
  warning: "warning",
  error: "warning",
  celebrating: "celebrate",
};

type TransformControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function formatTransformNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function createPreviewTransformFromPreset(modelPath: string): Required<PreviewTransform> {
  const preset = getCoachModelTransformPreset(modelPath);
  return {
    position: [...preset.position] as [number, number, number],
    scale: preset.scale,
    rotation: [...preset.rotation] as [number, number, number],
    cameraPosition: [...preset.cameraPosition] as [number, number, number],
  };
}

function StatusCard({
  path,
  status,
}: {
  path: string;
  status: ModelStatusState;
}) {
  const tone =
    status === "found"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : status === "missing"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
        : status === "error"
          ? "border-red-400/20 bg-red-500/10 text-red-100"
          : "border-blue-400/20 bg-blue-500/10 text-blue-100";

  const label =
    status === "found"
      ? "Found"
      : status === "missing"
        ? "Missing"
        : status === "error"
          ? "Error"
          : "Checking";

  return (
    <div className="rounded-[1.45rem] border border-white/8 bg-slate-950/58 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Model Path</p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-100">{path}</p>
        </div>
        <div className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${tone}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function ModelLabScreen({
  onBackHome,
  primaryButton,
  secondaryButton,
}: ModelLabScreenProps) {
  const [selectedModelId, setSelectedModelId] = useState<ModelOption["id"]>("atlas_mobile");
  const [selectedMood, setSelectedMood] = useState<Coach3DMood>("idle");
  const [previewFrame, setPreviewFrame] = useState<PreviewFrameMode>("full_body");
  const [selectedLibraryClipId, setSelectedLibraryClipId] = useState<string | null>(null);
  const [detectedClips, setDetectedClips] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [savePresetState, setSavePresetState] = useState<"idle" | "saved" | "cleared">("idle");
  const [hasSavedPreset, setHasSavedPreset] = useState(false);
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatusState>>({
    "/models/nova-coach.glb": "checking",
    "/models/atlas-coach.glb": "checking",
    "/models/atlas-coach-mobile.glb": "checking",
  });

  const selectedModel = useMemo(
    () => modelOptions.find((option) => option.id === selectedModelId) ?? modelOptions[0],
    [selectedModelId]
  );
  const selectedAnimationHint = moodAnimationMap[selectedMood];
  const animationLibrary = useMemo(
    () => getAvatarAnimationLibrary(selectedModel.avatar),
    [selectedModel.avatar]
  );
  const selectedLibraryClip = useMemo(
    () =>
      (selectedLibraryClipId
        ? getAvatarAnimationClipById(selectedLibraryClipId, selectedModel.avatar)
        : null) ?? null,
    [selectedLibraryClipId, selectedModel.avatar]
  );
  const autoLibraryClip = useMemo(
    () => getAnimationForHint(selectedAnimationHint, selectedModel.avatar),
    [selectedAnimationHint, selectedModel.avatar]
  );
  const previewAnimationHint = selectedLibraryClip?.animationHint ?? selectedAnimationHint;
  const presetTransform = useMemo(
    () => createPreviewTransformFromPreset(selectedModel.path),
    [selectedModel.path]
  );
  const [previewTransform, setPreviewTransform] = useState<Required<PreviewTransform>>(() =>
    createPreviewTransformFromPreset("/models/atlas-coach-mobile.glb")
  );

  const updatePreviewTransform = (
    field: keyof Required<PreviewTransform>,
    value: number,
    index?: number
  ) => {
    setPreviewTransform((current) => {
      if (field === "scale") {
        return { ...current, scale: value };
      }

      const nextTuple = [...current[field]] as [number, number, number];
      nextTuple[index ?? 0] = value;
      return { ...current, [field]: nextTuple };
    });
  };

  const controlGroups = useMemo<TransformControl[]>(
    () => [
      {
        key: "scale",
        label: "Scale",
        min: 0.5,
        max: 3,
        step: 0.01,
        value: previewTransform.scale,
        onChange: (value) => updatePreviewTransform("scale", value),
      },
      {
        key: "position-x",
        label: "Position X",
        min: -2,
        max: 2,
        step: 0.01,
        value: previewTransform.position[0],
        onChange: (value) => updatePreviewTransform("position", value, 0),
      },
      {
        key: "position-y",
        label: "Position Y",
        min: -3,
        max: 2,
        step: 0.01,
        value: previewTransform.position[1],
        onChange: (value) => updatePreviewTransform("position", value, 1),
      },
      {
        key: "position-z",
        label: "Position Z",
        min: -2,
        max: 2,
        step: 0.01,
        value: previewTransform.position[2],
        onChange: (value) => updatePreviewTransform("position", value, 2),
      },
      {
        key: "rotation-y",
        label: "Rotation Y",
        min: -3.14,
        max: 3.14,
        step: 0.01,
        value: previewTransform.rotation[1],
        onChange: (value) => updatePreviewTransform("rotation", value, 1),
      },
      {
        key: "camera-z",
        label: "Camera Z",
        min: 2,
        max: 8,
        step: 0.01,
        value: previewTransform.cameraPosition[2],
        onChange: (value) => updatePreviewTransform("cameraPosition", value, 2),
      },
      {
        key: "camera-y",
        label: "Camera Y",
        min: -1,
        max: 3,
        step: 0.01,
        value: previewTransform.cameraPosition[1],
        onChange: (value) => updatePreviewTransform("cameraPosition", value, 1),
      },
    ],
    [previewTransform]
  );

  const currentValuesBlock = useMemo(
    () =>
      `{\n  position: [${previewTransform.position.map(formatTransformNumber).join(", ")}],\n  scale: ${formatTransformNumber(previewTransform.scale)},\n  rotation: [${previewTransform.rotation.map(formatTransformNumber).join(", ")}],\n  cameraPosition: [${previewTransform.cameraPosition.map(formatTransformNumber).join(", ")}]\n}`,
    [previewTransform]
  );

  const handleCopyValues = async () => {
    try {
      await navigator.clipboard.writeText(currentValuesBlock);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  };

  useEffect(() => {
    setHasSavedPreset(Boolean(loadTransformPreset(selectedModel.path)));
    setSavePresetState("idle");
  }, [selectedModel.path]);

  useEffect(() => {
    let cancelled = false;

    async function checkModels() {
      const entries = await Promise.all(
        modelOptions.map(async ({ path }) => {
          try {
            const response = await fetch(path, { method: "HEAD" });
            return [path, response.ok ? "found" : "missing"] as const;
          } catch {
            return [path, "error"] as const;
          }
        })
      );

      if (cancelled) {
        return;
      }

      setModelStatuses(Object.fromEntries(entries));
    }

    void checkModels();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-6xl xl:max-w-7xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">3D Coach Pipeline</p>
                <h2 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                  3D Model Lab
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Test Nova and Atlas model files before using them in workouts.
                </p>
              </div>
              <button onClick={onBackHome} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 hover:border-white/20 hover:text-white">
                Back Home
              </button>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
            <section className="space-y-4">
              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Model Selector</p>
                <div className="mt-4 grid gap-3">
                  {modelOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedModelId(option.id);
                        setPreviewTransform(createPreviewTransformFromPreset(option.path));
                        setSelectedLibraryClipId(null);
                        setDetectedClips([]);
                      }}
                      className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                        selectedModel.id === option.id
                          ? "border-fuchsia-400/35 bg-gradient-to-r from-blue-500/16 to-fuchsia-500/14 text-white shadow-[0_0_28px_rgba(99,102,241,0.18)]"
                          : "border-white/8 bg-slate-900/70 text-slate-300 hover:border-blue-400/20 hover:text-white"
                      }`}
                    >
                      <p className="text-sm font-black">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{option.path}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300">Mood Selector</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setSelectedMood(mood)}
                      className={`rounded-2xl border px-3 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                        selectedMood === mood
                          ? "border-fuchsia-400/35 bg-gradient-to-r from-blue-500/16 to-fuchsia-500/14 text-white shadow-[0_0_24px_rgba(99,102,241,0.16)]"
                          : "border-white/8 bg-slate-900/70 text-slate-400 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300">Preview Framing</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "full_body" as const,
                      label: "Full Body",
                      description: "Show the full avatar clearly from head to feet.",
                    },
                    {
                      id: "in_frame" as const,
                      label: "In Frame",
                      description: "Use a tighter in-app coaching crop.",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPreviewFrame(option.id)}
                      className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                        previewFrame === option.id
                          ? "border-cyan-400/35 bg-gradient-to-r from-cyan-500/14 to-blue-500/14 text-white shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                          : "border-white/8 bg-slate-900/70 text-slate-300 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      <p className="text-sm font-black">{option.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-300">Current Model</p>
                <p className="mt-3 text-sm font-semibold text-slate-100">{selectedModel.path}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Coach3D uses `modelPathOverride` here, so you can test each file directly without changing workout screens.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-violet-300">Animation Library</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      Preview available clips now. Placeholder entries reserve future packs without affecting stability.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLibraryClipId(null)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    Use Mood Auto
                  </button>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-slate-900/70 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Preview Source</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedLibraryClip?.label ?? autoLibraryClip?.label ?? "Mood Default"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {selectedLibraryClip
                      ? selectedLibraryClip.isAvailable
                        ? `Manual preview using ${selectedLibraryClip.animationHint}.`
                        : "Animation placeholder selected. Coach3D will keep the current safe fallback behavior."
                      : `Mood auto currently maps ${selectedMood} to ${autoLibraryClip?.animationHint ?? selectedAnimationHint}.`}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {animationLibrary.map((clip: AvatarAnimationClip) => {
                    const isSelected = selectedLibraryClipId === clip.id;
                    const statusTone = clip.isAvailable
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : "border-amber-400/20 bg-amber-500/10 text-amber-100";

                    return (
                      <div
                        key={clip.id}
                        className={`rounded-[1.25rem] border px-4 py-4 transition ${
                          isSelected
                            ? "border-violet-400/35 bg-gradient-to-r from-blue-500/12 to-violet-500/14 shadow-[0_0_24px_rgba(99,102,241,0.14)]"
                            : "border-white/8 bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white">{clip.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{clip.description}</p>
                          </div>
                          <div className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone}`}>
                            {clip.isAvailable ? "Available" : "Animation Placeholder"}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                            {clip.category.replace("_", " ")}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                            Hint {clip.animationHint}
                          </span>
                          {clip.isPremium ? (
                            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-100">
                              Premium Later
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            disabled={!clip.isAvailable}
                            onClick={() => setSelectedLibraryClipId(clip.id)}
                            className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                              clip.isAvailable
                                ? "border border-violet-400/24 bg-violet-500/10 text-violet-100 hover:border-violet-300/40"
                                : "cursor-not-allowed border border-white/8 bg-slate-950/55 text-slate-500"
                            }`}
                          >
                            {clip.isAvailable ? "Preview Clip" : "Animation Placeholder"}
                          </button>
                          {clip.embeddedClipName ? (
                            <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                              Embedded {clip.embeddedClipName}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-300">Transform Tuner</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      Preview-only transform overrides for the current Model Lab session.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewTransform(presetTransform)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {controlGroups.map((control) => (
                    <label
                      key={control.key}
                      className="rounded-[1.2rem] border border-white/8 bg-slate-900/70 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-200">
                          {control.label}
                        </span>
                        <span className="font-mono text-xs text-blue-200">
                          {formatTransformNumber(control.value)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={control.value}
                        onChange={(event) => control.onChange(Number(event.target.value))}
                        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-400"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-blue-400/14 bg-blue-500/8 px-3 py-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                    Live Scale
                  </span>
                  <span className="rounded-full border border-blue-300/20 bg-slate-950/70 px-3 py-1 font-mono text-xs text-white">
                    x{formatTransformNumber(previewTransform.scale)}
                  </span>
                  <span className="text-xs leading-relaxed text-slate-300">
                    Scale updates the viewport immediately, so use this first when dialing in how large the avatar reads.
                  </span>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-950/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Current Values</p>
                    <button
                      type="button"
                      onClick={() => void handleCopyValues()}
                      className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition ${
                        copyState === "copied"
                          ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                          : copyState === "error"
                            ? "border-red-400/30 bg-red-500/12 text-red-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy Failed" : "Copy Values"}
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 text-blue-100">
                    <code>{currentValuesBlock}</code>
                  </pre>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-amber-400/16 bg-amber-500/8 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Save Preset</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Saves current position, scale, and camera to device storage. Applies across all screens for this model — no restart needed.
                  </p>
                  {hasSavedPreset && savePresetState === "idle" && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                      ✓ Saved preset active
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveTransformPreset(selectedModel.path, previewTransform);
                        setHasSavedPreset(true);
                        setSavePresetState("saved");
                        window.setTimeout(() => setSavePresetState("idle"), 2000);
                      }}
                      className={`rounded-2xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition ${
                        savePresetState === "saved"
                          ? "border-emerald-400/30 bg-emerald-500/14 text-emerald-100"
                          : "border-amber-400/24 bg-amber-500/12 text-amber-100 hover:border-amber-400/40"
                      }`}
                    >
                      {savePresetState === "saved" ? "Saved!" : "Save Preset"}
                    </button>
                    {hasSavedPreset && (
                      <button
                        type="button"
                        onClick={() => {
                          clearTransformPreset(selectedModel.path);
                          setHasSavedPreset(false);
                          setSavePresetState("cleared");
                          setPreviewTransform(createPreviewTransformFromPreset(selectedModel.path));
                          window.setTimeout(() => setSavePresetState("idle"), 2000);
                        }}
                        className={`rounded-2xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition ${
                          savePresetState === "cleared"
                            ? "border-red-400/30 bg-red-500/12 text-red-100"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {savePresetState === "cleared" ? "Cleared" : "Clear Preset"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 xl:sticky xl:top-8 xl:self-start">
              {/* Live Preview */}
              <div className="overflow-hidden rounded-[1.7rem] border border-white/8 bg-slate-950/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Live Preview</p>
                    <h3 className="mt-1 text-xl font-black text-white">{selectedModel.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                      modelStatuses[selectedModel.path] === "found"
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                        : modelStatuses[selectedModel.path] === "missing"
                          ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                          : "border-white/10 bg-white/5 text-slate-300"
                    }`}>
                      {modelStatuses[selectedModel.path] === "found" ? "Model Found" : modelStatuses[selectedModel.path] === "missing" ? "Missing" : "Checking"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                      {selectedMood}
                    </span>
                  </div>
                </div>
                <Coach3D
                  selectedAvatar={selectedModel.avatar}
                  mood={selectedMood}
                  modelPathOverride={selectedModel.path}
                  animationHint={previewAnimationHint}
                  animationClipId={selectedLibraryClipId}
                  previewTransform={previewTransform}
                  previewFrame={previewFrame}
                  lightingMode="neutral"
                  onClipsDetected={setDetectedClips}
                />
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Hint</span>
                  <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                    {previewAnimationHint}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Frame</span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                    {previewFrame === "full_body" ? "Full Body" : "In Frame"}
                  </span>
                </div>
              </div>

              {/* Detected GLB Clips */}
              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-violet-300">Detected GLB Clips</p>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                    detectedClips.length > 0
                      ? "border-violet-400/25 bg-violet-500/10 text-violet-200"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}>
                    {detectedClips.length} clip{detectedClips.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {detectedClips.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detectedClips.map((clip) => (
                      <span
                        key={clip}
                        className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 font-mono text-[10px] text-slate-200"
                      >
                        {clip}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    {modelStatuses[selectedModel.path] === "found"
                      ? "No embedded animation clips detected in this GLB."
                      : "Load a model to see its embedded clip names."}
                  </p>
                )}
              </div>

              {/* Model Path Status */}
              <div className="grid gap-3 sm:grid-cols-3">
                {modelOptions.map((option) => (
                  <StatusCard
                    key={option.path}
                    path={option.path}
                    status={modelStatuses[option.path] ?? "checking"}
                  />
                ))}
              </div>

              {/* Notes */}
              <div className="rounded-[1.7rem] border border-blue-400/14 bg-gradient-to-r from-blue-500/8 via-slate-950/30 to-fuchsia-500/8 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Notes</p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
                  <li>GLB files must live in <code className="rounded bg-white/8 px-1 py-0.5 font-mono text-slate-300">public/models/</code></li>
                  <li>Use Transform Tuner to frame new GLBs, then copy values into Coach3D presets.</li>
                  <li>Missing models fall back to the placeholder card — no crash.</li>
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={onBackHome} className={secondaryButton}>
                  Return Home
                </button>
                <button onClick={onBackHome} className={primaryButton}>
                  Done Testing
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
