"use client";

import { useState } from "react";
import { Coach3D } from "@/components/Coach3D";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { clearBodyProfile, saveBodyProfile } from "@/lib/bodyProfileStorage";
import type {
  AvatarDisplayMode,
  AvatarDisplaySettings,
  BodyProfile,
  CoachAvatar,
  CoachTalkativeness,
} from "@/types";

type SettingsScreenProps = {
  onBackHome: () => void;
  onOpenCameraSandbox: () => void;
  onOpenModelLab: () => void;
  onResetLocalData?: () => void;
  selectedAvatar?: CoachAvatar;
  bodyProfile?: BodyProfile | null;
  onBodyProfileChange?: (profile: BodyProfile | null) => void;
  avatarDisplaySettings: AvatarDisplaySettings;
  onAvatarDisplaySettingsChange: (settings: AvatarDisplaySettings) => void;
};

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">{title}</p>
      <div className="mt-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export function SettingsScreen({
  onBackHome,
  onOpenCameraSandbox,
  onOpenModelLab,
  onResetLocalData,
  selectedAvatar = "Nova",
  bodyProfile,
  onBodyProfileChange,
  avatarDisplaySettings,
  onAvatarDisplaySettingsChange,
}: SettingsScreenProps) {
  const [draftProfile, setDraftProfile] = useState<BodyProfile>(() => ({
      sex: "prefer_not_to_say",
      activityGoal: "",
      ...bodyProfile,
    }));
  const avatarModeOptions: Array<{
    mode: AvatarDisplayMode;
    title: string;
    description: string;
  }> = [
    {
      mode: "coach_card",
      title: "Coach Card",
      description: "Keep the avatar in the normal coach panel.",
    },
    {
      mode: "floating_overlay",
      title: "Floating Overlay",
      description: "Float the coach above the workout layout.",
    },
    {
      mode: "camera_corner",
      title: "Camera Corner",
      description: "Keep the coach small near the camera area.",
    },
    {
      mode: "hidden",
      title: "Hidden",
      description: "Hide avatar visuals and keep coaching text only.",
    },
  ];

  function updateField<K extends keyof BodyProfile>(field: K, value: BodyProfile[K]) {
    setDraftProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function parseNumberInput(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function handleSaveBodyProfile() {
    const nextProfile: BodyProfile = {
      ...draftProfile,
      activityGoal: draftProfile.activityGoal?.trim() || undefined,
      lastUpdated: new Date().toISOString(),
    };

    saveBodyProfile(nextProfile);
    onBodyProfileChange?.(nextProfile);
  }

  function handleClearBodyProfile() {
    clearBodyProfile();
    const cleared: BodyProfile = {
      sex: "prefer_not_to_say",
      activityGoal: "",
    };
    setDraftProfile(cleared);
    onBodyProfileChange?.(null);
  }

  function updateAvatarDisplaySettings(patch: Partial<AvatarDisplaySettings>) {
    onAvatarDisplaySettingsChange({
      ...avatarDisplaySettings,
      ...patch,
    });
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
            >
              ← Home
            </button>
          </div>
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">System Controls</p>
            <h2 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Settings
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Manage your GymTwin AI beta experience.
            </p>
          </header>

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <div className="lg:col-span-2">
            <SettingsCard title="Avatar System">
              <div className="space-y-4">
                <Coach3D
                  selectedAvatar={selectedAvatar}
                  animationHint="idle"
                  previewFrame="bust"
                  compact
                  lightingMode="neutral"
                />
                <p className="text-xs text-slate-400">Current coach: {getAvatarLabel(selectedAvatar)}. 3D preview loads when model files are available.</p>
                <p className="text-slate-400">Nova and Atlas stay visually consistent across workouts, camera coaching, summaries, and progress screens.</p>
                <button
                  onClick={onOpenModelLab}
                  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                >
                  Open 3D Model Lab
                </button>
              </div>
            </SettingsCard>
            </div>

            <SettingsCard title="Avatar Display">
              <div className="space-y-4">
                <div>
                  <p>Choose how Nova/Atlas appears while you train.</p>
                  <p className="mt-2 text-slate-400">
                    Avatar selection is still managed from the session builder so the coaching style stays consistent.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {avatarModeOptions.map((option) => {
                    const isActive = avatarDisplaySettings.mode === option.mode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => updateAvatarDisplaySettings({ mode: option.mode })}
                        className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-blue-400/28 bg-gradient-to-br from-blue-500/14 via-slate-950/72 to-fuchsia-500/14 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                            : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <p className="text-sm font-black">{option.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">{option.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "show3DCoach" as const,
                      label: "Show 3D Coach",
                      description: "Prefer the full 3D coach card where supported.",
                    },
                    {
                      key: "compactInWorkout" as const,
                      label: "Compact in Workout",
                      description: "Keep the avatar tighter so main controls stay clear.",
                    },
                    {
                      key: "showDuringCamera" as const,
                      label: "Show During Camera",
                      description: "Allow avatar overlays while camera coaching is active.",
                    },
                    {
                      key: "showExerciseDemos" as const,
                      label: "Show Exercise Demos",
                      description: "Keep workout demo cards visible while real exercise clips are phased in.",
                    },
                    {
                      key: "minimalCameraHud" as const,
                      label: "Minimal Camera HUD",
                      description: "Reduce lower-priority camera panels during active tracking and focus mode.",
                    },
                  ].map((toggle) => (
                    <label
                      key={toggle.key}
                      className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-slate-900/72 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-black text-white">{toggle.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{toggle.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={avatarDisplaySettings[toggle.key]}
                        onChange={(event) =>
                          updateAvatarDisplaySettings({
                            [toggle.key]: event.target.checked,
                          } as Partial<AvatarDisplaySettings>)
                        }
                        className="mt-1 h-5 w-5 rounded border-white/15 bg-slate-950 text-blue-500 accent-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Coach Persona">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Talkativeness</p>
                  <p className="mt-1 text-xs text-slate-400">How often the coach speaks during reps and form tracking.</p>
                  <div className="mt-3 flex gap-2">
                    {(["quiet", "normal", "hype"] as CoachTalkativeness[]).map((level) => {
                      const isActive = avatarDisplaySettings.talkativeness === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateAvatarDisplaySettings({ talkativeness: level })}
                          className={`flex-1 rounded-2xl border px-3 py-3 text-xs font-black capitalize transition ${
                            isActive
                              ? "border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-fuchsia-500/15 text-white shadow-[0_0_16px_rgba(99,102,241,0.2)]"
                              : "border-white/8 bg-slate-900/72 text-slate-400 hover:border-white/15 hover:text-white"
                          }`}
                        >
                          {level === "quiet" ? "🤫 Quiet" : level === "normal" ? "💬 Normal" : "🔥 Hype"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                  <div>
                    <p className="text-sm font-black text-white">Rep Counting Callouts</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">Coach announces rep milestones during tracked sets.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={avatarDisplaySettings.repCountingEnabled}
                    onChange={(event) => updateAvatarDisplaySettings({ repCountingEnabled: event.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-white/15 bg-slate-950 text-blue-500 accent-blue-500"
                  />
                </label>
              </div>
            </SettingsCard>

            <SettingsCard title="Body Profile">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Height (in)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draftProfile.heightInches ?? ""}
                      onChange={(event) => updateField("heightInches", parseNumberInput(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/30"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Weight (lb)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draftProfile.weightLbs ?? ""}
                      onChange={(event) => updateField("weightLbs", parseNumberInput(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/30"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Goal Weight (lb)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draftProfile.goalWeightLbs ?? ""}
                      onChange={(event) => updateField("goalWeightLbs", parseNumberInput(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/30"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Activity Goal</span>
                    <select
                      value={draftProfile.activityGoal ?? ""}
                      onChange={(event) => updateField("activityGoal", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/30"
                    >
                      <option value="">Select a goal</option>
                      <option value="Fat loss">Fat loss</option>
                      <option value="Lean muscle">Lean muscle</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Performance">Performance</option>
                      <option value="Mobility">Mobility</option>
                    </select>
                  </label>
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  Body metrics are for fitness progress only and are not medical advice.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleSaveBodyProfile}
                    className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                  >
                    Save Body Profile
                  </button>
                  <button
                    onClick={handleClearBodyProfile}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-sm font-black text-slate-100 transition hover:border-blue-400/30 hover:bg-slate-800 active:scale-95"
                  >
                    Clear Body Profile
                  </button>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Voice Commands">
              <p>Voice shortcuts can control sets, camera start/stop, difficulty nudges, and emergency stop flows.</p>
              <p className="mt-2 text-slate-400">Microphone access stays inside the browser and only activates when voice control is turned on.</p>
            </SettingsCard>

            <SettingsCard title="Beta Feedback">
              <p>Help improve GymTwin AI during beta.</p>
              <div className="mt-4 space-y-3">
                <a
                  href="mailto:adonyluisflorencio@gmail.com?subject=GymTwin%20AI%20Beta%20Feedback"
                  className="block w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-center text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                >
                  Send Beta Feedback
                </a>
                <a
                  href="mailto:adonyluisflorencio@gmail.com?subject=GymTwin%20AI%20Camera%20Issue"
                  className="block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-blue-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Report Camera Issue
                </a>
              </div>
            </SettingsCard>

            <SettingsCard title="Camera Privacy">
              <p>Camera processing stays on this device.</p>
              <p className="mt-2 text-slate-400">Video, images, and pose landmarks are not uploaded.</p>
            </SettingsCard>

            <SettingsCard title="Safety">
              <p>Prototype feedback only — not medical advice.</p>
              <p className="mt-2 text-slate-400">Stop if you feel pain, dizziness, chest pain, or unusual discomfort.</p>
            </SettingsCard>

            <SettingsCard title="Camera Coach">
              <p className="text-slate-400">Open the sandbox to test live pose tracking, squat, push-up, and plank feedback in isolation.</p>
              <button
                onClick={onOpenCameraSandbox}
                className="mt-4 w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
              >
                Open Camera Sandbox
              </button>
            </SettingsCard>

            <SettingsCard title="Local Data">
              <p>Workout history, stats, and resume sessions are stored locally in this browser.</p>
              {onResetLocalData ? (
                <button
                  onClick={onResetLocalData}
                  className="mt-4 w-full rounded-2xl border border-red-400/18 bg-red-950/25 px-4 py-4 text-sm font-black text-red-200 transition hover:border-red-400/30 hover:bg-red-950/35 active:scale-95"
                >
                  Reset Local App Data
                </button>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="mt-4 w-full cursor-not-allowed rounded-2xl border border-white/6 bg-slate-900/45 px-4 py-4 text-sm font-black text-slate-500"
                >
                  Reset Local App Data
                </button>
              )}
            </SettingsCard>

            <SettingsCard title="App Info">
              <p>GymTwin AI MVP</p>
              <p className="mt-2 text-slate-400">Camera Coach: Squat, Push-Up, Plank</p>
              <p className="mt-2 text-slate-400">Build: Local beta</p>
            </SettingsCard>
          </div>

        </div>
      </div>
    </main>
  );
}
