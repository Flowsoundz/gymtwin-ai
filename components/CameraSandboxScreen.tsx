"use client";

import { useState } from "react";
import { Coach3D } from "@/components/Coach3D";
import { Coach3DPlaceholder } from "@/components/Coach3DPlaceholder";
import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { useCameraCoach } from "@/hooks/useCameraCoach";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getAvatarCoachLayerState } from "@/lib/avatarCoachLayer";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import {
  getConversationResponse,
  parseConversationIntent,
  type ConversationIntent,
} from "@/lib/conversationCommands";
import type { AvatarDisplaySettings, CoachAvatar } from "@/types";

type CameraSandboxScreenProps = {
  onBack: () => void;
  primaryButton: string;
  secondaryButton: string;
  selectedAvatar?: CoachAvatar;
  avatarDisplaySettings: AvatarDisplaySettings;
};

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="rounded-[1.6rem] border border-white/8 bg-white/6 p-3 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-[1.1rem] px-2 py-2 text-left transition hover:bg-white/5"
      >
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-300">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

export function CameraSandboxScreen({
  onBack,
  primaryButton,
  secondaryButton,
  selectedAvatar = "Nova",
  avatarDisplaySettings,
}: CameraSandboxScreenProps) {
  const [isCameraFocusMode, setIsCameraFocusMode] = useState(false);
  const [trackingDetailsOpen, setTrackingDetailsOpen] = useState(false);
  const [bodyScanOpen, setBodyScanOpen] = useState(false);
  const [coachPreviewOpen, setCoachPreviewOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [conversationState, setConversationState] = useState<{
    intent: ConversationIntent;
    answer: string;
  } | null>(null);

  const {
    videoRef,
    canvasRef,
    selectedMode,
    setSelectedMode,
    statusLabel,
    errorMessage,
    squatRepCount,
    squatPhase,
    kneeAngleDisplay,
    pushupRepCount,
    pushupPhase,
    elbowAngleDisplay,
    plankHoldSeconds,
    plankPostureStatus,
    plankAlignmentScore,
    trackingWarning,
    feedbackMessage,
    feedbackSeverity,
    trackingReadiness,
    cameraPlacement,
    bodyScanEstimate,
    trackingLost,
    trackingLostReason,
    trackingLostSeconds,
    trackingRecoveredAt,
    trackingRecentlyRecovered,
    latestRepQuality,
    cleanRepCount,
    needsWorkRepCount,
    plankQualityLabel,
    plankQualityMessage,
    latestIssue,
    bestCue,
    trackingConfidenceAverage,
    startCamera,
    stopCamera,
  } = useCameraCoach();

  async function handleStartCamera() {
    setIsCameraFocusMode(true);
    await startCamera();
  }

  function handleStopCamera() {
    stopCamera();
    setIsCameraFocusMode(false);
  }

  const {
    isListening,
    isSupported,
    transcript,
    errorMessage: voiceErrorMessage,
    startListening,
    stopListening,
  } = useVoiceCommands({
    onCommand: (command, rawTranscript) => {
      const intent = parseConversationIntent(rawTranscript);
      if (intent !== "unknown") {
        setConversationState(
          getConversationResponse({
            intent,
            selectedAvatarName: getAvatarLabel(selectedAvatar),
            latestIssue,
            bestCue,
            cleanRepCount,
            needsWorkRepCount,
            trackingConfidence: trackingReadiness.confidenceScore,
            placementMessage: cameraPlacement.message,
            coachBrainMessage: coachBrain.message,
          })
        );
      }

      switch (command) {
        case "start_camera":
          void handleStartCamera();
          break;
        case "stop_camera":
          handleStopCamera();
          break;
        case "switch_squat":
          setSelectedMode("squat");
          break;
        case "switch_pushup":
          setSelectedMode("pushup");
          break;
        case "switch_plank":
          setSelectedMode("plank");
          break;
        default:
          break;
      }
    },
  });

  const isCameraRunning =
    statusLabel === "Camera Starting..." ||
    statusLabel === "Pose Model Loading..." ||
    statusLabel === "Pose Tracking Active";

  const statusTone =
    statusLabel === "Pose Tracking Active"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.16)]"
      : statusLabel === "Camera Error"
        ? "border-red-400/35 bg-red-500/15 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.12)]"
        : statusLabel === "Pose Model Loading..." || statusLabel === "Camera Starting..."
          ? "border-blue-400/35 bg-blue-500/15 text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.16)]"
          : "border-slate-700/60 bg-slate-900/70 text-slate-300 shadow-[0_0_24px_rgba(30,41,59,0.24)]";

  const feedbackTone =
    feedbackSeverity === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : feedbackSeverity === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
        : feedbackSeverity === "error"
          ? "border-red-400/20 bg-red-500/10 text-red-200"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200";

  const hudCardClass =
    "rounded-[1.6rem] border border-white/8 bg-white/6 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]";
  const metricCardClass =
    "rounded-[1.2rem] border border-white/8 bg-slate-950/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
  const controlButtonClass =
    "flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-black tracking-wide text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.35)] transition hover:border-blue-400/30 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/40 disabled:text-slate-600";

  const guidanceCard = (
    <div className="rounded-[1.35rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-left text-sm leading-relaxed text-slate-300">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Camera Setup</p>
      <p className="mt-2">Set up your phone like a workout mirror and keep your whole body visible.</p>
      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        <li>Place your phone 6–8 feet away.</li>
        <li>Keep your head, hips, knees, and feet visible.</li>
        <li>Use good lighting for clearer tracking.</li>
        <li>Camera processing stays on this device.</li>
        <li>Prototype feedback only, not medical advice.</li>
      </ul>
    </div>
  );

  const formatHoldTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  const modeMeta =
    selectedMode === "squat"
      ? {
          label: "Squat",
          coachMessage: feedbackMessage,
          phase: squatPhase,
          reps: squatRepCount,
          angle: kneeAngleDisplay,
        }
      : selectedMode === "pushup"
        ? {
            label: "Push-Up",
            coachMessage: feedbackMessage,
            phase: pushupPhase,
            reps: pushupRepCount,
            angle: elbowAngleDisplay,
          }
        : {
            label: "Plank",
            coachMessage: feedbackMessage,
            phase: plankPostureStatus,
            reps: `Hold ${formatHoldTime(plankHoldSeconds)}`,
            angle: plankAlignmentScore,
          };

  const primaryControlClass = isCameraRunning ? controlButtonClass : primaryButton;
  const stopControlClass =
    !isCameraRunning && statusLabel !== "Camera Error" ? controlButtonClass : secondaryButton;
  const coachBrain = getCoachBrainResponse({
    selectedAvatarName: getAvatarLabel(selectedAvatar),
    screenContext: "camera_sandbox",
    isVoiceListening: isListening,
    isCameraActive: isCameraRunning,
    cameraStatusLabel: statusLabel,
    trackingMode: selectedMode,
    trackingConfidence: trackingReadiness.confidenceScore,
    fullBodyVisible: trackingReadiness.fullBodyVisible,
    trackingReadinessMessage: trackingReadiness.message,
    trackingLost,
    trackingLostReason,
    trackingRecoveredAt,
    placementScore: cameraPlacement.placementScore,
    cameraPlacementMessage: cameraPlacement.message,
    likelyFrontView: cameraPlacement.likelyFrontView,
    likelySideView: cameraPlacement.likelySideView,
    bodyScanConfidence: bodyScanEstimate.scanConfidence,
    bodyScanMessage: bodyScanEstimate.message,
    postureAlignmentScore: bodyScanEstimate.postureAlignmentScore,
    latestRepQualityLabel: latestRepQuality?.label,
    latestRepQualityMessage: latestRepQuality?.message,
    cleanRepCount,
    needsWorkRepCount,
    latestIssue,
    bestCue,
    plankQualityLabel,
    plankQualityMessage,
    phase: selectedMode === "squat" ? squatPhase : selectedMode === "pushup" ? pushupPhase : plankPostureStatus,
    reps: selectedMode === "squat" ? squatRepCount : selectedMode === "pushup" ? pushupRepCount : undefined,
    holdSeconds: selectedMode === "plank" ? plankHoldSeconds : undefined,
    angleLabel: selectedMode === "squat" ? kneeAngleDisplay : selectedMode === "pushup" ? elbowAngleDisplay : plankAlignmentScore,
    formFeedback: feedbackMessage,
    feedbackSeverity,
  });
  const avatarCoachState = getAvatarCoachLayerState({
    surface: "camera_setup",
    selectedAvatar,
    coachBrain,
    exerciseName: modeMeta.label,
    cameraActive: isCameraRunning,
    trackingIssue:
      trackingLost ||
      !trackingReadiness.fullBodyVisible ||
      statusLabel === "Camera Error",
    warningActive:
      feedbackSeverity === "warning" ||
      feedbackSeverity === "error" ||
      Boolean(trackingWarning) ||
      cameraPlacement.placementScore < 75,
    isVoiceListening: isListening,
    highlightDemo: avatarDisplaySettings.showExerciseDemos,
    compactPreference: avatarDisplaySettings.compactInWorkout,
  });
  const showCameraFocusMode = isCameraFocusMode && statusLabel !== "Camera Off";
  const showAvatarVisual = avatarDisplaySettings.mode !== "hidden";
  const showCameraAvatar = showAvatarVisual && avatarDisplaySettings.showDuringCamera;
  const showSidebarCoachCard = showAvatarVisual && avatarDisplaySettings.mode === "coach_card";
  const showStageOverlayAvatar =
    showCameraAvatar && avatarDisplaySettings.mode === "floating_overlay";
  const showStageCornerAvatar =
    showCameraAvatar && avatarDisplaySettings.mode === "camera_corner";
  const useMinimalCameraHud = avatarDisplaySettings.minimalCameraHud && isCameraRunning;
  const MODE_DEMO_CLIP: Record<string, string> = { squat: "Squat", pushup: "PushUp", plank: "Plank" };
  const modeDemoClipName = selectedMode ? (MODE_DEMO_CLIP[selectedMode] ?? null) : null;
  const trackingLockTone =
    statusLabel === "Camera Error"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : trackingReadiness.fullBodyVisible
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : "border-amber-400/20 bg-amber-500/10 text-amber-100";
  const trackingLockLabel =
    statusLabel === "Camera Error"
      ? "Camera Error"
      : trackingReadiness.fullBodyVisible
        ? "Tracking Locked"
        : "Adjust Position";
  const latestRepQualityLabel =
    selectedMode === "plank"
      ? plankQualityLabel === "stable"
        ? "Stable Hold"
        : plankQualityLabel === "hips_high"
          ? "Hips High"
          : plankQualityLabel === "hips_low"
            ? "Hips Low"
            : plankQualityLabel === "lost_tracking"
              ? "Lost Tracking"
              : "Hold Quality"
      : latestRepQuality?.label === "clean"
        ? "Clean"
        : latestRepQuality?.label === "shallow"
          ? "Go Deeper"
          : latestRepQuality?.label === "unstable"
            ? "Unstable"
            : latestRepQuality?.label === "lost_tracking"
              ? "Lost Tracking"
              : latestRepQuality?.label === "unknown"
                ? "Unknown"
                : "Waiting";
  const latestRepQualityMessage =
    selectedMode === "plank"
      ? plankQualityMessage
      : latestRepQuality?.message ?? "Your latest tracked rep quality will show here.";
  const repQualityTone =
    selectedMode === "plank"
      ? plankQualityLabel === "stable"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : plankQualityLabel === "hips_high" || plankQualityLabel === "hips_low" || plankQualityLabel === "lost_tracking"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200"
      : latestRepQuality?.label === "clean"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : latestRepQuality?.label === "shallow" ||
            latestRepQuality?.label === "unstable" ||
            latestRepQuality?.label === "lost_tracking"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200";
  const placementTone =
    cameraPlacement.placementScore >= 75
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : "border-amber-400/20 bg-amber-500/10 text-amber-100";
  const placementLabel = cameraPlacement.placementScore >= 75 ? "Good Placement" : "Adjust Phone";
  const placementViewLabel = cameraPlacement.likelySideView
    ? "Side"
    : cameraPlacement.likelyFrontView
      ? "Front"
      : "Unknown";
  const bodyScanTone =
    (bodyScanEstimate.scanConfidence ?? 0) >= 80
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : (bodyScanEstimate.scanConfidence ?? 0) >= 45
        ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
        : "border-amber-400/20 bg-amber-500/10 text-amber-100";
  const trackingChecklist = [
    { label: "Head / Upper Body", ready: trackingReadiness.headVisible },
    { label: "Shoulders", ready: trackingReadiness.shouldersVisible },
    { label: "Hips", ready: trackingReadiness.hipsVisible },
    { label: "Knees", ready: trackingReadiness.kneesVisible },
    { label: "Feet", ready: trackingReadiness.feetVisible },
  ];
  const repSummaryCount =
    selectedMode === "plank" ? "Live" : `${cleanRepCount}/${cleanRepCount + needsWorkRepCount || 0}`;
  const coachGuidance =
    statusLabel === "Camera Error"
      ? {
          tone: "border-red-400/20 bg-red-500/10 text-red-100",
          eyebrow: "Camera Error",
          title: "Fix camera access before tracking",
          message: errorMessage ?? "Allow camera access and try again.",
          reason: "Tracking cannot run until the camera is available.",
        }
      : trackingLost
        ? {
            tone: "border-amber-400/20 bg-amber-500/10 text-amber-100",
            eyebrow: "Tracking Paused",
            title: "Step back so your full body is visible",
            message: trackingLostReason,
            reason: "Landmarks dropped out and the coach is waiting to re-lock.",
          }
        : !trackingReadiness.fullBodyVisible
          ? {
              tone: trackingLockTone,
              eyebrow: "Tracking Lock",
              title: "Get your full body into frame",
              message: trackingReadiness.message,
              reason: "Head, hips, knees, and feet must stay visible for reliable reps.",
            }
          : cameraPlacement.placementScore < 75
            ? {
                tone: placementTone,
                eyebrow: "Phone Placement",
                title: placementLabel,
                message: cameraPlacement.message,
                reason: `Current view reads as ${placementViewLabel.toLowerCase()} and needs adjustment.`,
              }
            : feedbackSeverity === "warning" || feedbackSeverity === "error"
              ? {
                  tone: feedbackTone,
                  eyebrow: "Coach Guidance",
                  title: latestRepQualityLabel,
                  message: feedbackMessage,
                  reason: bestCue,
                }
              : latestRepQualityMessage
                ? {
                    tone: repQualityTone,
                    eyebrow: selectedMode === "plank" ? "Hold Quality" : "Rep Quality",
                    title: latestRepQualityLabel,
                    message: latestRepQualityMessage,
                    reason: bestCue,
                  }
                : {
                    tone: feedbackTone,
                    eyebrow: "Coach Guidance",
                    title: "Keep stacking quality reps",
                    message: avatarCoachState.message,
                    reason: `Tracking confidence is ${trackingReadiness.confidenceScore}% right now.`,
                  };

  const modeSwitcher = (
    <div className="grid grid-cols-3 gap-2">
      {[
        { key: "squat", label: "Squat" },
        { key: "pushup", label: "Push-Up" },
        { key: "plank", label: "Plank" },
      ].map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => setSelectedMode(mode.key as typeof selectedMode)}
          className={`rounded-2xl border px-3 py-3 text-xs font-black uppercase tracking-[0.2em] transition ${
            selectedMode === mode.key
              ? "border-fuchsia-400/40 bg-gradient-to-r from-blue-500/20 to-fuchsia-500/20 text-white shadow-[0_0_28px_rgba(99,102,241,0.22)]"
              : "border-white/8 bg-slate-900/75 text-slate-400 hover:border-white/15 hover:text-white"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );

  const voiceControlButton = isSupported ? (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`w-full rounded-2xl border px-4 py-3 text-sm font-black tracking-wide transition ${
        isListening
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
          : "border-white/10 bg-slate-900/80 text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.35)] hover:border-blue-400/30 hover:bg-slate-800/90"
      }`}
    >
      {isListening ? "Stop Voice" : "Start Voice"}
    </button>
  ) : null;

  const cameraStage = (isFocusMode: boolean) => (
    <div className="rounded-[2rem] bg-gradient-to-br from-blue-500/18 via-transparent to-fuchsia-500/14 p-[1px] shadow-[0_0_70px_rgba(99,102,241,0.2)]">
      <div className="relative overflow-hidden rounded-[1.95rem] border border-white/8 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.25),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.16),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.05),_rgba(15,23,42,0.35))]" />
        <div
          className={`relative w-full ${
            isFocusMode
              ? "h-[100svh] min-h-[100svh] sm:h-screen sm:min-h-screen"
              : "h-[62vh] min-h-[500px] sm:h-[68vh] lg:h-[78vh] lg:max-h-[860px]"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 z-[1] opacity-80">
            <div className="absolute left-4 top-4 h-10 w-10 rounded-tl-2xl border-l border-t border-blue-300/35 sm:left-6 sm:top-6 sm:h-14 sm:w-14" />
            <div className="absolute right-4 top-4 h-10 w-10 rounded-tr-2xl border-r border-t border-blue-300/35 sm:right-6 sm:top-6 sm:h-14 sm:w-14" />
            <div className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-2xl border-b border-l border-blue-300/35 sm:bottom-6 sm:left-6 sm:h-14 sm:w-14" />
            <div className="absolute bottom-4 right-4 h-10 w-10 rounded-br-2xl border-b border-r border-blue-300/35 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14" />
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] bg-[length:100%_6px]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(59,130,246,0.04)_50%,transparent_100%)] bg-[length:20px_100%]" />
          </div>
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
          />

          {isCameraRunning && !trackingReadiness.fullBodyVisible ? (
            <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
              <div className="absolute inset-[10%] rounded-[2rem] border border-dashed border-amber-300/20" />
              <div className="absolute left-[12%] top-[12%] h-12 w-12 rounded-tl-2xl border-l-2 border-t-2 border-amber-300/26" />
              <div className="absolute right-[12%] top-[12%] h-12 w-12 rounded-tr-2xl border-r-2 border-t-2 border-amber-300/26" />
              <div className="absolute bottom-[12%] left-[12%] h-12 w-12 rounded-bl-2xl border-b-2 border-l-2 border-amber-300/26" />
              <div className="absolute bottom-[12%] right-[12%] h-12 w-12 rounded-br-2xl border-b-2 border-r-2 border-amber-300/26" />
              <div className="rounded-full border border-amber-300/18 bg-slate-950/62 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.22em] text-amber-100 backdrop-blur-md">
                Step back until your full body fits inside the frame.
              </div>
            </div>
          ) : null}

          {isCameraRunning && trackingReadiness.fullBodyVisible ? (
            <div className="pointer-events-none absolute inset-0 z-[3] rounded-[1.95rem] border border-emerald-300/20 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.16),0_0_30px_rgba(59,130,246,0.12)] coach-pulse" />
          ) : null}

          {trackingLost ? (
            <div className="pointer-events-none absolute inset-x-4 top-[30%] z-[4] sm:inset-x-8">
              <div className="mx-auto max-w-md rounded-[1.6rem] border border-amber-400/22 bg-slate-950/78 px-4 py-4 text-left backdrop-blur-xl shadow-[0_18px_50px_rgba(15,23,42,0.42)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">Tracking Paused</p>
                  <p className="text-xs font-black text-white">{Math.max(1, Math.floor(trackingLostSeconds))}s</p>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">{trackingLostReason}</p>
              </div>
            </div>
          ) : trackingRecentlyRecovered ? (
            <div className="pointer-events-none absolute right-3 top-[30%] z-[4] sm:right-5">
              <div className="rounded-2xl border border-emerald-400/24 bg-emerald-500/12 px-4 py-3 text-left backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">Tracking Recovered</p>
                <p className="mt-1 text-xs font-medium text-white">Locked back in. Keep going.</p>
              </div>
            </div>
          ) : null}

          {statusLabel === "Camera Off" ? (
            <div className="absolute inset-0 z-[3] flex items-center justify-center bg-slate-950/84 backdrop-blur-sm">
              <div className="relative mx-auto max-w-md px-6 text-center">
                <div className="absolute inset-x-10 top-5 h-28 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-fuchsia-500/15 blur-3xl" />
                <div className="relative mx-auto mb-6 flex h-24 w-20 items-end justify-center rounded-[2rem] border border-blue-300/18 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[0_0_40px_rgba(99,102,241,0.18)]">
                  <div className="absolute top-4 h-5 w-5 rounded-full bg-blue-200/80" />
                  <div className="absolute top-10 h-10 w-[2px] rounded-full bg-fuchsia-200/80" />
                  <div className="absolute top-[3.1rem] h-[2px] w-10 rounded-full bg-blue-200/80" />
                  <div className="absolute bottom-4 left-[46%] h-12 w-[2px] rotate-[12deg] rounded-full bg-fuchsia-200/70" />
                  <div className="absolute bottom-4 right-[46%] h-12 w-[2px] -rotate-[12deg] rounded-full bg-fuchsia-200/70" />
                </div>
                <p className="text-base font-black uppercase tracking-[0.24em] text-slate-100 sm:text-lg">Camera Preview Idle</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Step back until your full body is visible.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Nothing is recorded or uploaded. Everything stays on this device.
                </p>
                <button onClick={() => void handleStartCamera()} className={`mt-6 min-w-[12rem] ${primaryButton}`}>
                  Start Camera
                </button>
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-3 top-3 z-[4] sm:left-5 sm:top-5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/64 px-4 py-2 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tracking</p>
              <p className="mt-1 text-xs font-bold text-slate-100">
                {trackingWarning ? "Low Confidence" : `${modeMeta.label} Ready`}
              </p>
            </div>
          </div>

          {isFocusMode ? (
            <>
              {isCameraRunning ? (
                <button
                  onClick={() => setIsCameraFocusMode(false)}
                  className="absolute left-3 top-20 z-[5] rounded-full border border-white/12 bg-slate-950/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md transition hover:border-blue-400/30 hover:bg-slate-900/85 sm:left-5 sm:top-24"
                >
                  Exit Focus
                </button>
              ) : null}

              <div className="pointer-events-none absolute right-3 top-20 z-[4] grid w-[min(46vw,17rem)] grid-cols-2 gap-2 sm:right-5 sm:top-24 sm:w-[min(28rem,30vw)]">
                <div className={`col-span-2 rounded-2xl border px-3 py-3 text-left backdrop-blur-md ${trackingLockTone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">{trackingLockLabel}</p>
                    <p className="text-sm font-black text-white">{trackingReadiness.confidenceScore}%</p>
                  </div>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-white">{trackingReadiness.message}</p>
                </div>
                {trackingLost ? (
                  <div className="col-span-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-left backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-100">Tracking Paused</p>
                      <p className="text-sm font-black text-white">{Math.max(1, Math.floor(trackingLostSeconds))}s</p>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-white">{trackingLostReason}</p>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-fuchsia-400/20 bg-slate-950/78 px-3 py-3 backdrop-blur-md shadow-[0_16px_36px_rgba(99,102,241,0.2)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                    {selectedMode === "plank" ? "Hold" : "Reps"}
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">{modeMeta.reps}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/78 px-3 py-3 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Phase</p>
                  <p className="mt-1 text-sm font-bold capitalize text-white sm:text-base">{modeMeta.phase}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-950/78 px-3 py-3 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                    {selectedMode === "squat" ? "Knee Angle" : selectedMode === "pushup" ? "Elbow Angle" : "Alignment Score"}
                  </p>
                  <p className="mt-1 text-lg font-black text-white sm:text-2xl">{modeMeta.angle}</p>
                </div>
                <div className={`col-span-2 rounded-2xl border px-3 py-3 text-left backdrop-blur-md ${feedbackTone}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Form Feedback</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-white sm:text-base">{feedbackMessage}</p>
                </div>
                <div className={`col-span-2 rounded-2xl border px-3 py-3 text-left backdrop-blur-md ${repQualityTone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">
                      {selectedMode === "plank" ? "Hold Quality" : "Last Rep"}
                    </p>
                    <p className="text-sm font-black text-white">{latestRepQualityLabel}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-white">{latestRepQualityMessage}</p>
                </div>
                {cameraPlacement.placementScore < 75 ? (
                  <div className={`col-span-2 rounded-2xl border px-3 py-3 text-left backdrop-blur-md ${placementTone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Phone Placement</p>
                      <p className="text-sm font-black text-white">{cameraPlacement.placementScore}%</p>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-white">{cameraPlacement.message}</p>
                  </div>
                ) : null}
                {(bodyScanEstimate.scanConfidence ?? 0) >= 80 || (bodyScanEstimate.scanConfidence ?? 0) < 45 ? (
                  <div className={`col-span-2 rounded-2xl border px-3 py-3 text-left backdrop-blur-md ${bodyScanTone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Body Scan Beta</p>
                      <p className="text-sm font-black text-white">{bodyScanEstimate.scanConfidence ?? 0}%</p>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-white">{bodyScanEstimate.message}</p>
                  </div>
                ) : null}
              </div>

              {showStageCornerAvatar ? (
                <div className="pointer-events-none absolute bottom-28 left-3 right-3 z-[4] sm:bottom-32 sm:left-5 sm:right-5">
                  <div className="ml-auto max-w-[10rem] sm:max-w-[11rem]">
                    <FloatingCoachAvatar
                      selectedAvatar={selectedAvatar}
                      mood={avatarCoachState.mood}
                      message={`${modeMeta.label} • ${modeMeta.phase}\n${avatarCoachState.message}`}
                      position="stage-overlay"
                      compact
                      emphasis="focus"
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {showStageOverlayAvatar ? (
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[4] sm:bottom-5 sm:left-5 sm:right-5">
                  <div className="ml-auto max-w-[20rem]">
                    <FloatingCoachAvatar
                      selectedAvatar={selectedAvatar}
                      mood={avatarCoachState.mood}
                      message={`${modeMeta.label} • ${modeMeta.phase}\n${avatarCoachState.message}`}
                      position="stage-overlay"
                      compact={avatarDisplaySettings.compactInWorkout}
                      emphasis="standard"
                    />
                  </div>
                </div>
              ) : null}
              {showStageCornerAvatar ? (
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[4] sm:bottom-5 sm:left-5 sm:right-5">
                  <div className="ml-auto max-w-[10rem] sm:max-w-[11rem]">
                    <FloatingCoachAvatar
                      selectedAvatar={selectedAvatar}
                      mood={avatarCoachState.mood}
                      message={`${modeMeta.label} • ${modeMeta.phase}\n${avatarCoachState.message}`}
                      position="stage-overlay"
                      compact
                      emphasis="focus"
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (showCameraFocusMode) {
    return (
      <main className="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_42%,_#030712_100%)] text-white">
        <div className="absolute inset-0">{cameraStage(true)}</div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] p-3 sm:p-5">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.4)]">
            <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCameraFocusMode(false)}
                  className="min-h-11 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 hover:border-white/20 hover:text-white"
                >
                  Exit Focus
                </button>
              <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">
                {modeMeta.label}
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${statusTone}`}>
              <span className="h-2 w-2 rounded-full bg-current opacity-90" />
              {statusLabel}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] p-3 sm:p-5">
          <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.8rem] border border-white/10 bg-slate-950/76 p-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.4)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <button
                onClick={handleStopCamera}
                disabled={!isCameraRunning && statusLabel !== "Camera Error"}
                className={`${stopControlClass} min-h-12`}
              >
                Stop Camera
              </button>
              {voiceControlButton}
            </div>
            {modeSwitcher}
            <div className={`rounded-2xl border px-3 py-3 text-left ${feedbackTone}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Live Form Feedback</p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-white">{feedbackMessage}</p>
            </div>
            {trackingWarning ? (
              <p className="text-center text-xs leading-relaxed text-amber-200">{trackingWarning}</p>
            ) : null}
            {voiceErrorMessage ? (
              <p className="text-center text-xs leading-relaxed text-red-200">{voiceErrorMessage}</p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_45%,_#030712_100%)] px-4 pb-10 pt-5 font-sans text-white antialiased sm:px-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.4)] sm:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
            >
              Back
            </button>
            <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
              Camera Sandbox
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Future Form Correction Lab</p>
            <h1 className="mt-1 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              GymTwin AI
            </h1>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] backdrop-blur ${statusTone}`}>
            <span className="h-2 w-2 rounded-full bg-current opacity-90" />
            {statusLabel}
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
          <section className="order-1 space-y-4">
            {cameraStage(false)}
          </section>

          <aside className="order-2 space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
            {modeDemoClipName ? (
              <div>
                <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">
                  Coach Demo · {modeMeta.label}
                </p>
                <Coach3D
                  selectedAvatar={selectedAvatar}
                  animationHint="idle"
                  demoClipName={modeDemoClipName}
                  compact
                  previewFrame="full_body"
                  lightingMode="neutral"
                />
              </div>
            ) : null}

            <section className={`${hudCardClass} p-4`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Tracking Mode</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{modeMeta.label}</h2>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusTone}`}>
                  {trackingReadiness.confidenceScore}% Ready
                </div>
              </div>
              {modeSwitcher}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={metricCardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                    {selectedMode === "plank" ? "Hold" : "Reps"}
                  </p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-white">{modeMeta.reps}</p>
                </div>
                <div className={metricCardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Phase</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-100">{modeMeta.phase}</p>
                </div>
              </div>

              <div className={`mt-4 rounded-[1.35rem] border px-4 py-4 ${coachGuidance.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">{coachGuidance.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-white">{coachGuidance.title}</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                    {trackingWarning ? "Watch Form" : "Live"}
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-white">{coachGuidance.message}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/75">{coachGuidance.reason}</p>
              </div>
            </section>

            <section className={`${hudCardClass} p-3`}>
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Camera Controls</p>
                <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                  Local Tracking
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => void handleStartCamera()} disabled={isCameraRunning} className={primaryControlClass}>
                  {isCameraRunning ? "Camera Active" : "Start Camera"}
                </button>
                <button onClick={handleStopCamera} disabled={!isCameraRunning && statusLabel !== "Camera Error"} className={stopControlClass}>
                  Stop Camera
                </button>
                <button type="button" className={controlButtonClass} aria-disabled="true" disabled>
                  Flip Camera
                </button>
                <button onClick={onBack} className={secondaryButton}>Back</button>
              </div>
              {trackingWarning ? <p className="mt-3 text-xs leading-relaxed text-amber-200">{trackingWarning}</p> : null}
              {errorMessage ? <p className="mt-2 text-xs leading-relaxed text-red-200">{errorMessage}</p> : null}
            </section>

            <CollapsibleSection
              title="Tracking Details"
              subtitle="Confidence, rep quality, placement, and current thresholds."
              open={trackingDetailsOpen}
              onToggle={() => setTrackingDetailsOpen((value) => !value)}
            >
              <div className="space-y-3">
                <div className={`rounded-[1.25rem] border px-4 py-4 ${trackingLockTone}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Tracking Status</p>
                      <p className="mt-1 text-lg font-black text-white">{trackingLost ? "Tracking Paused" : trackingLockLabel}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-sm font-black text-white">
                      {trackingReadiness.confidenceScore}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-white/90 sm:grid-cols-3">
                    {trackingChecklist.map((zone) => (
                      <div
                        key={zone.label}
                        className={`rounded-xl border px-3 py-2 ${
                          zone.ready
                            ? "border-emerald-300/24 bg-emerald-500/12 text-emerald-50"
                            : "border-white/10 bg-slate-950/35 text-white/70"
                        }`}
                      >
                        {zone.ready ? "✓" : "•"} {zone.label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white">
                    {trackingLost ? trackingLostReason : trackingReadiness.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={metricCardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Quality</p>
                    <p className="mt-1 text-lg font-black text-white">{selectedMode === "plank" ? "Hold Quality" : latestRepQualityLabel}</p>
                    <p className="mt-2 text-xs text-slate-400">{latestRepQualityMessage}</p>
                  </div>
                  <div className={metricCardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Rep Summary</p>
                    <p className="mt-1 text-lg font-black text-white">{repSummaryCount}</p>
                    <p className="mt-2 text-xs text-slate-400">Clean {cleanRepCount} · Needs work {needsWorkRepCount}</p>
                  </div>
                  <div className={metricCardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Placement</p>
                    <p className="mt-1 text-lg font-black text-white">{cameraPlacement.placementScore}%</p>
                    <p className="mt-2 text-xs text-slate-400">{placementViewLabel} view</p>
                  </div>
                  <div className={metricCardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                      {selectedMode === "squat" ? "Knee Angle" : selectedMode === "pushup" ? "Elbow Angle" : "Alignment Score"}
                    </p>
                    <p className="mt-1 text-lg font-black text-white">{modeMeta.angle}</p>
                    <p className="mt-2 text-xs text-slate-400">Average confidence {trackingConfidenceAverage}%</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">{bestCue}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {selectedMode === "squat"
                      ? "Counts a rep after the knee angle drops below 110° and returns above 160°."
                      : selectedMode === "pushup"
                        ? "Counts a rep after the elbow angle drops below 95° and returns above 155°."
                        : "Tracks hold time while scoring shoulder-hip-ankle body-line alignment from 0 to 100."}
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {!useMinimalCameraHud ? (
              <CollapsibleSection
                title="Body Scan Beta"
                subtitle="Prototype posture and proportion estimates."
                open={bodyScanOpen}
                onToggle={() => setBodyScanOpen((value) => !value)}
              >
                <div className={`rounded-[1.25rem] border px-4 py-4 ${bodyScanTone}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Body Scan Beta</p>
                      <p className="mt-1 text-lg font-black text-white">
                        {isCameraRunning ? "Posture & Proportions" : "Camera Required"}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-sm font-black text-white">
                      {isCameraRunning ? `${bodyScanEstimate.scanConfidence ?? 0}%` : "--"}
                    </div>
                  </div>
                  {isCameraRunning ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={metricCardClass}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Posture Alignment</p>
                        <p className="mt-1 text-2xl font-black text-white">{bodyScanEstimate.postureAlignmentScore ?? "--"}</p>
                      </div>
                      <div className={metricCardClass}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Shoulder / Hip Ratio</p>
                        <p className="mt-1 text-2xl font-black text-white">{bodyScanEstimate.shoulderToHipRatio ?? "--"}</p>
                      </div>
                      <div className={metricCardClass}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Visible Height</p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {bodyScanEstimate.visibleHeightRatio !== undefined
                            ? `${Math.round(bodyScanEstimate.visibleHeightRatio * 100)}%`
                            : "--"}
                        </p>
                      </div>
                      <div className={metricCardClass}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Scan Confidence</p>
                        <p className="mt-1 text-2xl font-black text-white">{bodyScanEstimate.scanConfidence ?? "--"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-white">Start camera to run Body Scan Beta.</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-white">{bodyScanEstimate.message}</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300/80">
                    Body Scan Beta estimates posture and body proportions from landmarks. It does not measure weight or diagnose body fat.
                  </p>
                </div>
              </CollapsibleSection>
            ) : null}

            {!useMinimalCameraHud ? (
              <CollapsibleSection
                title="3D Coach Preview"
                subtitle="Avatar visibility and demo preview."
                open={coachPreviewOpen}
                onToggle={() => setCoachPreviewOpen((value) => !value)}
              >
                {showSidebarCoachCard ? (
                  avatarDisplaySettings.show3DCoach ? (
                    <Coach3DPlaceholder
                      selectedAvatar={selectedAvatar}
                      mood={avatarCoachState.mood}
                      animationHint={avatarCoachState.animationHint}
                    />
                  ) : (
                    <div className={`${hudCardClass} p-4`}>
                      <FloatingCoachAvatar
                        selectedAvatar={selectedAvatar}
                        mood={avatarCoachState.mood}
                        message={avatarCoachState.message}
                        position="inline"
                        compact={avatarDisplaySettings.compactInWorkout}
                        emphasis="standard"
                      />
                    </div>
                  )
                ) : (
                  <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-left">
                    <p className="text-sm leading-relaxed text-slate-300">
                      {avatarDisplaySettings.mode === "hidden"
                        ? "Avatar visuals are hidden here, but tracking cues and coaching text remain active."
                        : avatarDisplaySettings.mode === "camera_corner"
                          ? "Avatar visuals stay near the camera stage so the side HUD remains focused."
                          : "Avatar visuals float over the camera stage while the sidebar stays dedicated to tracking."}
                    </p>
                  </div>
                )}
              </CollapsibleSection>
            ) : null}

            {!useMinimalCameraHud ? (
              <CollapsibleSection
                title="Voice Control"
                subtitle="Local voice commands and conversation mode."
                open={voiceOpen}
                onToggle={() => setVoiceOpen((value) => !value)}
              >
                <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-left text-sm leading-relaxed text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Voice Control</p>
                      <p className="mt-1 text-xs font-bold text-slate-100">
                        {isSupported ? (isListening ? "Listening" : "Off") : "Unavailable"}
                      </p>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${isListening ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 bg-slate-900/70 text-slate-300"}`}>
                      {isListening ? "Listening" : "Voice"}
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    {isSupported
                      ? "Try “start camera”, “stop camera”, “switch to squat”, “switch to push up”, or “switch to plank”."
                      : "Voice commands are not supported in this browser yet."}
                  </p>
                  {transcript ? (
                    <p className="mt-3 rounded-xl border border-white/8 bg-slate-900/75 px-3 py-2 text-xs text-slate-200">
                      Heard: <span className="font-semibold">{transcript}</span>
                    </p>
                  ) : null}
                  {voiceErrorMessage ? (
                    <p className="mt-3 text-xs leading-relaxed text-red-200">{voiceErrorMessage}</p>
                  ) : null}
                  {conversationState ? (
                    <div className="mt-4 rounded-[1.2rem] border border-fuchsia-400/18 bg-gradient-to-br from-blue-500/10 via-slate-950/65 to-fuchsia-500/10 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">Conversation Mode</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            Intent: {conversationState.intent.replaceAll("_", " ")}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">
                          Local
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-white">{conversationState.answer}</p>
                    </div>
                  ) : null}
                  {voiceControlButton ? <div className="mt-4">{voiceControlButton}</div> : null}
                </div>
              </CollapsibleSection>
            ) : null}

            {!useMinimalCameraHud ? (
              <CollapsibleSection
                title="Privacy & Setup"
                subtitle="Setup guidance and on-device processing notes."
                open={privacyOpen}
                onToggle={() => setPrivacyOpen((value) => !value)}
              >
                <div className="space-y-3">
                  <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-left">
                    <p className="text-sm leading-relaxed text-slate-300">
                      Camera processing stays on this device. No video, images, or pose landmarks are uploaded.
                    </p>
                  </div>
                  {guidanceCard}
                </div>
              </CollapsibleSection>
            ) : null}
          </aside>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-white/8 bg-slate-950/92 px-4 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5 xl:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-4 gap-2">
          <button onClick={onBack} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200">
            Back
          </button>
          <button onClick={() => void handleStartCamera()} disabled={isCameraRunning} className="rounded-2xl border border-blue-400/25 bg-blue-500/15 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-blue-100 disabled:border-slate-800 disabled:bg-slate-900/40 disabled:text-slate-600">
            {isCameraRunning ? "Active" : "Start"}
          </button>
          <button onClick={handleStopCamera} disabled={!isCameraRunning && statusLabel !== "Camera Error"} className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/12 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-100 disabled:border-slate-800 disabled:bg-slate-900/40 disabled:text-slate-600">
            Stop
          </button>
          <button type="button" disabled className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 disabled:text-slate-600">
            Flip
          </button>
        </div>
      </div>
    </main>
  );
}
