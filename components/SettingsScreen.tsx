"use client";

import Link from "next/link";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CharacterViewer } from "@/components/CharacterViewer";
import { CHARACTERS } from "@/lib/characters";
import { useCoachStore } from "@/store/useCoachStore";
import type { CoachSize } from "@/store/useCoachStore";
import Image from "next/image";
import {
  SUPPORTED_BACKGROUND_AUDIO_SERVICES,
  getWorkoutAudioLevelLabel,
  getWorkoutAudioModeLabel,
} from "@/lib/audioExperience";
import {
  GYMTWIN_PRIVACY_PATH,
  GYMTWIN_SUPPORT_EMAIL,
  GYMTWIN_SUPPORT_URL,
  GYMTWIN_TERMS_PATH,
  buildSupportMailto,
} from "@/lib/appInfo";
import { getAvatarAsset, getAvatarLabel, getAvatarPersonality, getAvatarRole, getAvatarSubtitle } from "@/lib/avatarAssets";
import { clearBodyProfile, saveBodyProfile } from "@/lib/bodyProfileStorage";
import type {
  AvatarDisplayMode,
  AvatarDisplaySettings,
  BodyProfile,
  CoachAvatar,
  CoachTalkativeness,
  WorkoutAudioLevel,
  WorkoutAudioMode,
} from "@/types";

type SettingsScreenProps = {
  onBackHome: () => void;
  onOpenCameraSandbox: () => void;
  onOpenModelLab: () => void;
  onResetLocalData?: () => void;
  onSignOut?: () => void;
  supabaseUser?: User | null;
  selectedAvatar?: CoachAvatar;
  onSelectedAvatarChange?: (avatar: CoachAvatar) => void;
  onOpenFlowsoundzRadio?: () => void;
  onDeleteCloudData?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<{ ok: boolean; reason?: string; message?: string }>;
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

function DisplayModePreview({
  mode,
  compact,
  presenceLabel,
  show3DCoach,
  minimalHud,
}: {
  mode: AvatarDisplayMode;
  compact: boolean;
  presenceLabel: string;
  show3DCoach: boolean;
  minimalHud: boolean;
}) {
  const coachCardClass =
    mode === "hidden"
      ? "opacity-0 scale-90"
      : mode === "floating_overlay"
        ? "left-[56%] top-[18%] w-[34%]"
        : mode === "camera_corner"
          ? "right-[6%] top-[10%] w-[24%]"
          : "left-[6%] bottom-[8%] w-[34%]";

  const coachHeightClass = compact ? "h-14" : "h-20";

  return (
    <div className="rounded-[1.45rem] border border-white/8 bg-slate-900/72 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Live Mock Preview</p>
          <p className="mt-1 text-xs text-slate-400">See where the coach lands before starting a workout.</p>
        </div>
        <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
          {mode.replace("_", " ")}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.92))] p-3">
        <div className="relative aspect-[16/10] rounded-[1.1rem] border border-white/8 bg-slate-950/88">
          <div className="absolute inset-3 rounded-[0.95rem] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.96))]" />
          <div className="absolute left-6 top-5 h-20 w-10 rounded-full border border-blue-400/14 bg-blue-500/8 blur-xl" />
          <div className="absolute bottom-5 right-6 h-16 w-16 rounded-full border border-fuchsia-400/14 bg-fuchsia-500/8 blur-xl" />
          <div className="absolute inset-x-6 bottom-4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

          {!minimalHud ? (
            <>
              <div className="absolute left-4 top-4 h-10 w-[34%] rounded-xl border border-white/8 bg-slate-900/76" />
              <div className="absolute right-4 top-4 h-8 w-[20%] rounded-full border border-emerald-400/14 bg-emerald-500/10" />
              <div className="absolute right-4 bottom-4 h-16 w-[28%] rounded-2xl border border-white/8 bg-slate-900/72" />
            </>
          ) : (
            <div className="absolute left-4 top-4 h-8 w-[26%] rounded-full border border-blue-400/16 bg-blue-500/10" />
          )}

          {show3DCoach ? (
            <div
              className={`absolute rounded-[1rem] border border-blue-400/24 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(217,70,239,0.14))] backdrop-blur-md shadow-[0_0_24px_rgba(59,130,246,0.16)] transition-all duration-200 ${coachCardClass} ${coachHeightClass}`}
            >
              <div className="flex h-full items-end gap-2 p-2">
                <div className="h-9 w-7 rounded-full bg-gradient-to-b from-blue-300/80 to-fuchsia-400/70" />
                <div className="min-w-0 flex-1">
                  <div className="h-2 w-3/4 rounded-full bg-white/80" />
                  <div className="mt-2 h-2 w-full rounded-full bg-white/20" />
                  <div className="mt-1 h-2 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          <div className="rounded-full border border-white/8 bg-slate-950/70 px-2 py-1 text-center">
            {presenceLabel}
          </div>
          <div className="rounded-full border border-white/8 bg-slate-950/70 px-2 py-1 text-center">
            {minimalHud ? "Minimal HUD" : "Full HUD"}
          </div>
          <div className="rounded-full border border-white/8 bg-slate-950/70 px-2 py-1 text-center">
            {show3DCoach ? "3D On" : "Text Only"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsScreen({
  onBackHome,
  onOpenCameraSandbox,
  onOpenModelLab,
  onResetLocalData,
  onSignOut,
  supabaseUser,
  selectedAvatar = "Nova",
  onSelectedAvatarChange,
  onOpenFlowsoundzRadio,
  onDeleteCloudData,
  onDeleteAccount,
  bodyProfile,
  onBodyProfileChange,
  avatarDisplaySettings,
  onAvatarDisplaySettingsChange,
}: SettingsScreenProps) {
  const [isDeletingCloudData, setIsDeletingCloudData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountDeletionMessage, setAccountDeletionMessage] = useState<string | null>(null);
  const [draftProfile, setDraftProfile] = useState<BodyProfile>(() => ({
      sex: "prefer_not_to_say",
      activityGoal: "",
      ...bodyProfile,
    }));
  const avatarModeOptions: Array<{
    mode: AvatarDisplayMode;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      mode: "coach_card",
      title: "Coach Card",
      description: "Coach shows in the sidebar panel during workouts.",
      icon: "🪟",
    },
    {
      mode: "floating_overlay",
      title: "Floating Overlay",
      description: "Draggable card that floats over any screen.",
      icon: "🫧",
    },
    {
      mode: "camera_corner",
      title: "Camera Corner",
      description: "Small overlay near the camera view during tracking.",
      icon: "📷",
    },
    {
      mode: "hidden",
      title: "Hidden",
      description: "No 3D avatar — text coaching only.",
      icon: "🚫",
    },
  ];
  const avatarPresenceMode = avatarDisplaySettings.compactInWorkout
    ? "compact"
    : avatarDisplaySettings.minimalCameraHud
      ? "balanced"
      : "immersive";

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

  const { setCharacter, setDisplayLayout, setCoachSize } = useCoachStore();

  function updateAvatarDisplaySettings(patch: Partial<AvatarDisplaySettings>) {
    const next = { ...avatarDisplaySettings, ...patch };
    onAvatarDisplaySettingsChange(next);
    // Keep global store in sync with display layout
    if (patch.mode) setDisplayLayout(patch.mode);
  }

  function applyAvatarPresenceMode(mode: "compact" | "balanced" | "immersive") {
    setCoachSize(mode as CoachSize);
    if (mode === "compact") {
      updateAvatarDisplaySettings({
        show3DCoach: true,
        compactInWorkout: true,
        minimalCameraHud: true,
      });
      return;
    }

    if (mode === "balanced") {
      updateAvatarDisplaySettings({
        show3DCoach: true,
        compactInWorkout: false,
        minimalCameraHud: true,
      });
      return;
    }

    updateAvatarDisplaySettings({
      show3DCoach: true,
      compactInWorkout: false,
      minimalCameraHud: false,
    });
  }

  const audioModeOptions: WorkoutAudioMode[] = ["external", "flowsoundz_radio"];
  const audioLevelOptions: WorkoutAudioLevel[] = ["low", "normal", "high"];

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
                <CharacterViewer
                  character={CHARACTERS[selectedAvatar === "Atlas" ? "atlas" : "nova"]}
                  height="h-[380px]"
                />
                <p className="text-xs text-slate-400">Current coach: {getAvatarLabel(selectedAvatar)}. 3D preview loads when model files are available.</p>
                <p className="text-slate-400">Nova and Atlas stay visually consistent across workouts, camera coaching, summaries, and progress screens.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["Nova", "Atlas"] as CoachAvatar[]).map((avatar) => {
                    const active = selectedAvatar === avatar;
                    return (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => {
                          onSelectedAvatarChange?.(avatar);
                          setCharacter(avatar === "Atlas" ? "atlas" : "nova");
                        }}
                        className={`group relative overflow-hidden rounded-[1.45rem] border p-4 text-left transition ${
                          active
                            ? "border-fuchsia-400/35 bg-gradient-to-br from-blue-500/16 via-slate-950/78 to-fuchsia-500/14 text-white shadow-[0_0_28px_rgba(99,102,241,0.18)]"
                            : "border-white/8 bg-slate-900/72 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-fuchsia-400/35" />
                        <div className="flex items-start gap-3">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0f172a]">
                            <Image
                              src={getAvatarAsset(avatar)}
                              alt={`${getAvatarLabel(avatar)} avatar`}
                              fill
                              sizes="80px"
                              className="object-cover object-[center_20%]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-black text-white">{getAvatarLabel(avatar)}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                              {getAvatarSubtitle(avatar)}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-slate-200">{getAvatarPersonality(avatar)}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{getAvatarRole(avatar)}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Coach Avatar</span>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                            active
                              ? "border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-100"
                              : "border-white/10 bg-slate-950/70 text-slate-400"
                          }`}>
                            {active ? "Selected" : "Switch"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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

                <DisplayModePreview
                  mode={avatarDisplaySettings.mode}
                  compact={avatarDisplaySettings.compactInWorkout}
                  presenceLabel={
                    avatarPresenceMode === "compact"
                      ? "Compact"
                      : avatarPresenceMode === "balanced"
                        ? "Balanced"
                        : "Immersive"
                  }
                  show3DCoach={avatarDisplaySettings.show3DCoach}
                  minimalHud={avatarDisplaySettings.minimalCameraHud}
                />

                <div className="rounded-[1.35rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Coach Size</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    How large and prominent the coach appears on screen during workouts.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      {
                        key: "compact" as const,
                        title: "Compact",
                        description: "Smallest footprint. More space for controls and camera tracking.",
                      },
                      {
                        key: "balanced" as const,
                        title: "Balanced",
                        description: "Default feel. Clear presence without taking over the screen.",
                      },
                      {
                        key: "immersive" as const,
                        title: "Immersive",
                        description: "Largest coach view with a fuller HUD stage.",
                      },
                    ].map((option) => {
                      const isActive = avatarPresenceMode === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => applyAvatarPresenceMode(option.key)}
                          className={`rounded-[1.15rem] border px-4 py-4 text-left transition active:scale-95 ${
                            isActive
                              ? "border-cyan-400/28 bg-gradient-to-br from-cyan-500/16 via-slate-950/74 to-blue-500/14 text-white shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                              : "border-white/8 bg-slate-950/55 text-slate-300 hover:border-white/15 hover:text-white"
                          }`}
                        >
                          <p className="text-sm font-black">{option.title}</p>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">{option.description}</p>
                          {isActive ? (
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Selected Size</p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Display Layout</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Where and how the coach card is positioned during your workout.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {avatarModeOptions.map((option) => {
                    const isActive = avatarDisplaySettings.mode === option.mode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => updateAvatarDisplaySettings({ mode: option.mode })}
                        className={`rounded-[1.15rem] border px-4 py-4 text-left transition active:scale-95 ${
                          isActive
                            ? "border-blue-400/28 bg-gradient-to-br from-blue-500/14 via-slate-950/72 to-fuchsia-500/14 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                            : "border-white/8 bg-slate-950/55 text-slate-300 hover:border-white/15 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black">{option.title}</p>
                          <span className="text-base">{option.icon}</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">{option.description}</p>
                        {isActive && (
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Active Layout</p>
                        )}
                      </button>
                    );
                  })}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {avatarDisplaySettings.mode === "floating_overlay"
                      ? "Floating overlay is active — drag the coach card anywhere on screen."
                      : avatarDisplaySettings.mode === "hidden"
                      ? "Avatar hidden — you'll still get voice coaching and text feedback."
                      : "This layout takes effect during workouts."}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "show3DCoach" as const,
                      label: "Show 3D Coach",
                      description: "Prefer the full 3D coach card where supported.",
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
                    {
                      key: "countdownAudioEnabled" as const,
                      label: "Countdown Audio",
                      description: "Play clean set-start countdown cues during workout transitions and rest finishes.",
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

            <SettingsCard title="Workout Audio">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Music Source</p>
                  <p className="mt-1 text-xs text-slate-400">GymTwin is designed to work beside your music, not interrupt it.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {audioModeOptions.map((mode) => {
                      const isActive = avatarDisplaySettings.workoutAudioMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateAvatarDisplaySettings({ workoutAudioMode: mode })}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            isActive
                              ? "border-fuchsia-400/30 bg-gradient-to-br from-blue-500/16 to-fuchsia-500/14 text-white shadow-[0_0_16px_rgba(99,102,241,0.18)]"
                              : "border-white/8 bg-slate-900/72 text-slate-400 hover:border-white/15 hover:text-white"
                          }`}
                        >
                          <p className="text-xs font-black">{getWorkoutAudioModeLabel(mode)}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                            {mode === "external" ? "Use any music app or player that runs well in the background." : "Pair the session with Flowsoundz Radio in a parallel tab."}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                    Works well with {SUPPORTED_BACKGROUND_AUDIO_SERVICES.join(", ")}.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Coach Voice</p>
                    <div className="mt-3 flex gap-2">
                      {audioLevelOptions.map((level) => {
                        const isActive = avatarDisplaySettings.coachVoiceVolume === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateAvatarDisplaySettings({ coachVoiceVolume: level })}
                            className={`flex-1 rounded-xl border px-2 py-2 text-[11px] font-black transition ${
                              isActive
                                ? "border-blue-400/28 bg-blue-500/14 text-white"
                                : "border-white/8 bg-slate-950/70 text-slate-400 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            {getWorkoutAudioLevelLabel(level)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Cue Volume</p>
                    <div className="mt-3 flex gap-2">
                      {audioLevelOptions.map((level) => {
                        const isActive = avatarDisplaySettings.cueVolume === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateAvatarDisplaySettings({ cueVolume: level })}
                            className={`flex-1 rounded-xl border px-2 py-2 text-[11px] font-black transition ${
                              isActive
                                ? "border-cyan-400/28 bg-cyan-500/14 text-white"
                                : "border-white/8 bg-slate-950/70 text-slate-400 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            {getWorkoutAudioLevelLabel(level)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <label className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-slate-900/72 px-4 py-4">
                  <div>
                    <p className="text-sm font-black text-white">Duck Music During Coach Voice</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Recommended when using Flowsoundz Radio or any external player in parallel.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={avatarDisplaySettings.duckExternalMusic}
                    onChange={(event) => updateAvatarDisplaySettings({ duckExternalMusic: event.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-white/15 bg-slate-950 text-blue-500 accent-blue-500"
                  />
                </label>

                <div className="rounded-[1.25rem] border border-fuchsia-400/12 bg-[linear-gradient(135deg,rgba(217,70,239,0.08),rgba(15,23,42,0.82),rgba(34,211,238,0.08))] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">Flowsoundz Radio</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        Featured option: open your station in a parallel tab and let GymTwin handle coaching and cues.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenFlowsoundzRadio) onOpenFlowsoundzRadio();
                      }}
                      className="shrink-0 rounded-xl border border-fuchsia-400/24 bg-fuchsia-500/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-100 transition hover:bg-fuchsia-500/18"
                    >
                      Launch
                    </button>
                  </div>
                </div>
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
                  href={buildSupportMailto("GymTwin AI Beta Feedback")}
                  className="block w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-center text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                >
                  Send Beta Feedback
                </a>
                <a
                  href={buildSupportMailto("GymTwin AI Camera Issue")}
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

            <SettingsCard title="Account">
              {supabaseUser ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-black text-white">
                      {supabaseUser.email?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-200">{supabaseUser.email}</p>
                      <p className="text-[10px] text-emerald-400">Synced to cloud</p>
                    </div>
                  </div>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="w-full rounded-2xl border border-white/8 bg-slate-900/60 px-4 py-3.5 text-sm font-black text-slate-300 transition hover:border-red-400/30 hover:text-red-300 active:scale-95"
                    >
                      Sign Out
                    </button>
                  )}
                  {onDeleteCloudData && (
                    <button
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          const shouldDelete = window.confirm(
                            "Delete synced GymTwin workout data and reset local synced progress for this account?"
                          );
                          if (!shouldDelete) return;
                        }
                        setIsDeletingCloudData(true);
                        try {
                          await onDeleteCloudData();
                        } finally {
                          setIsDeletingCloudData(false);
                        }
                      }}
                      disabled={isDeletingCloudData}
                      className="w-full rounded-2xl border border-red-400/18 bg-red-950/25 px-4 py-3.5 text-sm font-black text-red-200 transition hover:border-red-400/30 hover:bg-red-950/35 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isDeletingCloudData ? "Deleting Synced Data..." : "Delete Synced Workout Data"}
                    </button>
                  )}
                  {onDeleteAccount && (
                    <button
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          const shouldDelete = window.confirm(
                            "Delete your GymTwin account and all synced backend data? This cannot be undone."
                          );
                          if (!shouldDelete) return;
                        }
                        setIsDeletingAccount(true);
                        setAccountDeletionMessage(null);
                        try {
                          const result = await onDeleteAccount();
                          if (!result.ok) {
                            setAccountDeletionMessage(
                              result.reason === "not_configured"
                                ? "Automated account deletion is not configured yet. Use the support request below for now."
                                : result.message ?? "Unable to delete account right now."
                            );
                          }
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      }}
                      disabled={isDeletingAccount}
                      className="w-full rounded-2xl border border-red-500/24 bg-red-950/40 px-4 py-3.5 text-sm font-black text-red-100 transition hover:border-red-400/40 hover:bg-red-950/50 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
                    </button>
                  )}
                  <a
                    href={buildSupportMailto(
                      "GymTwin AI Account Deletion Request",
                      "Please delete my GymTwin AI account and associated backend data."
                    )}
                    className="block w-full rounded-2xl border border-white/8 bg-slate-900/60 px-4 py-3.5 text-center text-sm font-black text-slate-200 transition hover:border-fuchsia-400/24 hover:text-white active:scale-95"
                  >
                    Request Full Account Deletion
                  </a>
                  <p className="text-xs leading-relaxed text-slate-400">
                    If automated deletion is unavailable in the current environment, use the support request below.
                  </p>
                  {accountDeletionMessage ? (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-xs leading-relaxed text-amber-100">
                      {accountDeletionMessage}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-slate-400">Sign in to sync your progress and settings across devices. It&apos;s free.</p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("gymtwin:goto-auth"))}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_0_16px_rgba(139,92,246,0.3)] transition active:scale-95"
                  >
                    Sign In / Create Account
                  </button>
                </div>
              )}
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

            <SettingsCard title="Support & Policies">
              <p className="text-slate-300">
                Keep these links inside the app for App Store support, legal, and privacy review.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href={`mailto:${GYMTWIN_SUPPORT_EMAIL}`}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-cyan-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Email Support
                </a>
                <a
                  href={GYMTWIN_SUPPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-cyan-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Support Page
                </a>
                <Link
                  href={GYMTWIN_PRIVACY_PATH}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-cyan-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Privacy Policy
                </Link>
                <Link
                  href={GYMTWIN_TERMS_PATH}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-fuchsia-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Terms of Use
                </Link>
              </div>
            </SettingsCard>

            <SettingsCard title="App Info">
              <p>GymTwin AI MVP</p>
              <p className="mt-2 text-slate-400">Camera Coach: Squat, Push-Up, Plank</p>
              <p className="mt-2 text-slate-400">Build: Launch hardening beta</p>
            </SettingsCard>
          </div>

        </div>
      </div>
    </main>
  );
}
