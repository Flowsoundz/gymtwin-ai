"use client";

import { useEffect, useMemo, useState } from "react";
import { Coach3D, type Coach3DMood } from "@/components/Coach3D";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachAvatar } from "@/types";

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
                      onClick={() => setSelectedModelId(option.id)}
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
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-300">Current Model</p>
                <p className="mt-3 text-sm font-semibold text-slate-100">{selectedModel.path}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Coach3D uses `modelPathOverride` here, so you can test each file directly without changing workout screens.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Live Preview</p>
                    <h3 className="mt-1 text-xl font-black text-white">{selectedModel.label}</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">
                    {selectedMood}
                  </div>
                </div>
                <Coach3D
                  selectedAvatar={selectedModel.avatar}
                  mood={selectedMood}
                  modelPathOverride={selectedModel.path}
                  animationHint={selectedAnimationHint}
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Animation hint: <span className="font-semibold text-slate-200">{selectedAnimationHint}</span>
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {modelOptions.map((option) => (
                  <StatusCard
                    key={option.path}
                    path={option.path}
                    status={modelStatuses[option.path] ?? "checking"}
                  />
                ))}
              </div>

              <div className="rounded-[1.7rem] border border-blue-400/14 bg-gradient-to-r from-blue-500/10 via-slate-950/30 to-fuchsia-500/10 p-5 text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">Notes</p>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                  <p>GLB files must live in `public/models`.</p>
                  <p>The mobile model should be lighter for phone testing and sandbox previews.</p>
                  <p>If a selected model is missing, Coach3D falls back to the premium placeholder card instead of crashing.</p>
                </div>
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
