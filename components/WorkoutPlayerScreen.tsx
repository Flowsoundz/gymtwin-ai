import { useEffect, useMemo, useState } from "react";
import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { useCameraCoach } from "@/hooks/useCameraCoach";
import type { TrackingMode } from "@/hooks/useCameraCoach";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getCameraCoachLabel, getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import type { CoachAvatar, CoachName, WorkoutMovement } from "@/types";

type WorkoutPlayerScreenProps = {
  activeMovement: WorkoutMovement;
  activeRoutine: WorkoutMovement[];
  movementIndex: number;
  workingSet: number;
  currentReps: number;
  progressPercent: number;
  isRestPhase: boolean;
  restCountdown: number;
  exerciseCountdown: number;
  elapsedMinutes: number;
  selectedCoach: CoachName;
  selectedAvatar: CoachAvatar;
  isMuted: boolean;
  displayedSpeech: string;
  cleanMovementName: (name: string) => string;
  secondsToClock: (totalSeconds: number) => string;
  onToggleMute: () => void;
  onSafetyStop: () => void;
  onRecallCoachDialogue: () => void;
  onAdvanceExecutionTrack: () => void;
  onTriggerRestPhase: () => void;
  onChangeDifficultyEasy: () => void;
  onChangeDifficultyHard: () => void;
  primaryButton: string;
};

export function WorkoutPlayerScreen({
  activeMovement,
  activeRoutine,
  movementIndex,
  workingSet,
  currentReps,
  progressPercent,
  isRestPhase,
  restCountdown,
  exerciseCountdown,
  elapsedMinutes,
  selectedCoach,
  selectedAvatar,
  isMuted,
  displayedSpeech,
  cleanMovementName,
  secondsToClock,
  onToggleMute,
  onSafetyStop,
  onRecallCoachDialogue,
  onAdvanceExecutionTrack,
  onTriggerRestPhase,
  onChangeDifficultyEasy,
  onChangeDifficultyHard,
  primaryButton,
}: WorkoutPlayerScreenProps) {
  const [isCameraCoachOpen, setIsCameraCoachOpen] = useState(false);
  const [formRecap, setFormRecap] = useState<{
    cleanRepCount: number;
    needsWorkRepCount: number;
    latestIssue: string | null;
    bestCue: string;
    trackingConfidenceAverage: number;
    coachNote: string;
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
    resetRepQualityLog,
    startCamera,
    stopCamera,
  } = useCameraCoach();
  const {
    isListening,
    isSupported,
    transcript,
    errorMessage: voiceErrorMessage,
    startListening,
    stopListening,
  } = useVoiceCommands({
    onCommand: (command) => {
      switch (command) {
        case "complete_set":
          if (!isRestPhase) handleCompleteSet();
          break;
        case "skip_rest":
          if (isRestPhase) onAdvanceExecutionTrack();
          break;
        case "too_easy":
          if (!isRestPhase) onChangeDifficultyEasy();
          break;
        case "too_hard":
          if (!isRestPhase) onChangeDifficultyHard();
          break;
        case "pain_stop":
          handleSafetyStop();
          break;
        case "mute":
          if (!isMuted) onToggleMute();
          break;
        case "unmute":
          if (isMuted) onToggleMute();
          break;
        case "start_camera":
          void handleStartCameraCoach();
          break;
        case "stop_camera":
          handleStopCameraCoach();
          break;
        default:
          break;
      }
    },
  });

  const supportedCameraMode = useMemo<TrackingMode | null>(() => {
    return getCameraCoachModeForMovementName(activeMovement.name);
  }, [activeMovement.name]);

  useEffect(() => {
    if (!supportedCameraMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCameraCoachOpen(false);
      stopCamera();
      return;
    }

    setSelectedMode(supportedCameraMode);
    setIsCameraCoachOpen(false);
    stopCamera();
  }, [setSelectedMode, stopCamera, supportedCameraMode]);

  useEffect(() => {
    return () => {
      stopListening();
      stopCamera();
    };
  }, [stopCamera, stopListening]);

  const handleStartCameraCoach = async () => {
    if (!supportedCameraMode) return;
    setSelectedMode(supportedCameraMode);
    setIsCameraCoachOpen(true);
    await startCamera();
  };

  const handleStopCameraCoach = () => {
    setIsCameraCoachOpen(false);
    stopCamera();
  };

  const handleCompleteSet = () => {
    const shouldShowRecap =
      Boolean(supportedCameraMode) &&
      (cleanRepCount > 0 ||
        needsWorkRepCount > 0 ||
        latestIssue !== null ||
        plankQualityLabel !== "unknown");

    if (shouldShowRecap) {
      setFormRecap({
        cleanRepCount,
        needsWorkRepCount,
        latestIssue,
        bestCue,
        trackingConfidenceAverage,
        coachNote:
          latestIssue === "shallow"
            ? "Next set, go a little deeper."
            : latestIssue === "lost_tracking"
              ? "Next set, step back before you start."
              : latestIssue === "unstable"
                ? "Next set, slow down and control the movement."
                : bestCue,
      });
      resetRepQualityLog();
    } else {
      setFormRecap(null);
    }

    onTriggerRestPhase();
  };

  const handleSafetyStop = () => {
    setIsCameraCoachOpen(false);
    stopCamera();
    stopListening();
    onSafetyStop();
  };

  const statusTone =
    statusLabel === "Pose Tracking Active"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.16)]"
      : statusLabel === "Camera Error"
        ? "border-red-400/30 bg-red-500/15 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.16)]"
        : statusLabel === "Pose Model Loading..." || statusLabel === "Camera Starting..."
          ? "border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-[0_0_24px_rgba(59,130,246,0.16)]"
          : "border-slate-700/60 bg-slate-900/70 text-slate-300";

  const feedbackTone =
    feedbackSeverity === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : feedbackSeverity === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
        : feedbackSeverity === "error"
          ? "border-red-400/20 bg-red-500/10 text-red-200"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200";

  const formatHoldTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  const cameraModeLabel = supportedCameraMode ? getCameraCoachLabel(supportedCameraMode) : null;
  const cameraMetrics =
    selectedMode === "squat"
      ? {
          metricLabel: "Knee Angle",
          metricValue: kneeAngleDisplay,
          reps: squatRepCount,
          phase: squatPhase,
        }
      : selectedMode === "pushup"
        ? {
            metricLabel: "Elbow Angle",
            metricValue: elbowAngleDisplay,
            reps: pushupRepCount,
            phase: pushupPhase,
          }
        : {
            metricLabel: "Alignment Score",
            metricValue: plankAlignmentScore,
            reps: `Hold ${formatHoldTime(plankHoldSeconds)}`,
            phase: plankPostureStatus,
          };

  const cameraGuidanceCard = (
    <div className="rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-4 text-left text-sm leading-relaxed text-slate-300">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Camera Setup</p>
      <p className="mt-2">Set up your phone like a workout mirror before you start live camera coaching.</p>
      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        <li>Place your phone 6–8 feet away.</li>
        <li>Keep your head, hips, knees, and feet visible.</li>
        <li>Use good lighting for clearer tracking.</li>
        <li>Camera processing stays on this device.</li>
        <li>Prototype feedback only, not medical advice.</li>
      </ul>
    </div>
  );

  const voicePanel = (
    <div className="rounded-[1.7rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
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
            ? "Try “complete set”, “skip rest”, “start camera”, “stop camera”, or “pain stop”."
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
        {isSupported ? (
          <button
            onClick={isListening ? stopListening : startListening}
            className={`mt-4 w-full ${isListening ? "rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-black tracking-wide text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.35)] transition hover:border-blue-400/30 hover:bg-slate-800/90" : primaryButton}`}
          >
            {isListening ? "Stop Voice" : "Start Voice"}
          </button>
        ) : null}
      </div>
    </div>
  );

  const coachBrain = useMemo(
    () =>
      getCoachBrainResponse({
        selectedAvatarName: getAvatarLabel(selectedAvatar),
        screenContext: "player",
        isVoiceListening: isListening,
        isCameraActive: isCameraCoachOpen && statusLabel === "Pose Tracking Active",
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
        latestRepQualityLabel: latestRepQuality?.label,
        latestRepQualityMessage: latestRepQuality?.message,
        cleanRepCount,
        needsWorkRepCount,
        latestIssue,
        bestCue,
        plankQualityLabel,
        plankQualityMessage,
        phase: cameraMetrics.phase,
        reps: selectedMode === "plank" ? undefined : Number(cameraMetrics.reps),
        holdSeconds: selectedMode === "plank" ? plankHoldSeconds : undefined,
        angleLabel: String(cameraMetrics.metricValue),
        formFeedback: feedbackMessage,
        feedbackSeverity,
      }),
    [
      selectedAvatar,
      isListening,
      isCameraCoachOpen,
      statusLabel,
      selectedMode,
      cameraMetrics.phase,
      cameraMetrics.reps,
      cameraMetrics.metricValue,
      plankHoldSeconds,
      trackingReadiness.confidenceScore,
      trackingReadiness.fullBodyVisible,
      trackingReadiness.message,
      trackingLost,
      trackingLostReason,
      trackingRecoveredAt,
      cameraPlacement.placementScore,
      cameraPlacement.message,
      cameraPlacement.likelyFrontView,
      cameraPlacement.likelySideView,
      latestRepQuality,
      cleanRepCount,
      needsWorkRepCount,
      latestIssue,
      bestCue,
      plankQualityLabel,
      plankQualityMessage,
      feedbackMessage,
      feedbackSeverity,
    ]
  );
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
  const placementViewLabel = cameraPlacement.likelySideView
    ? "Side"
    : cameraPlacement.likelyFrontView
      ? "Front"
      : "Unknown";

  const persistentCoachMessage =
    coachBrain.mood === "idle" && displayedSpeech ? displayedSpeech : coachBrain.message;

  const cameraCoachPanel = supportedCameraMode ? (
    <div className="rounded-[1.7rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-300">Camera Coach Available</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{cameraModeLabel}</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusTone}`}>
          {statusLabel}
        </div>
      </div>

      {!isCameraCoachOpen ? (
        <div className="mt-4 space-y-3">
          {cameraGuidanceCard}
          <button onClick={handleStartCameraCoach} className={primaryButton}>
            Start Camera Coach
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-500/18 via-transparent to-fuchsia-500/14 p-[1px] shadow-[0_0_40px_rgba(99,102,241,0.18)]">
            <div className="relative overflow-hidden rounded-[1.55rem] border border-white/8 bg-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.05),_rgba(15,23,42,0.38))]" />
              <div className="relative aspect-[16/13] sm:aspect-[5/4]">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Mode</p>
                  <p className="mt-1 text-xs font-bold text-slate-100">{cameraModeLabel}</p>
                </div>
                <div className="max-w-[13rem]">
                  <FloatingCoachAvatar
                    selectedAvatar={selectedAvatar}
                    mood={coachBrain.mood}
                    message={`${cameraMetrics.phase}\n${coachBrain.message}`}
                    position="stage-overlay"
                    compact
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className={`col-span-2 rounded-2xl border px-4 py-3 ${trackingLockTone}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">{trackingLockLabel}</p>
                <p className="text-sm font-black text-white">{trackingReadiness.confidenceScore}%</p>
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white">{trackingReadiness.message}</p>
            </div>
            {trackingLost ? (
              <div className="col-span-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-100">Tracking Paused</p>
                  <p className="text-sm font-black text-white">{Math.max(1, Math.floor(trackingLostSeconds))}s</p>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">{trackingLostReason}</p>
              </div>
            ) : trackingRecentlyRecovered ? (
              <div className="col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">Tracking Recovered</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">Tracking recovered. Let’s keep going.</p>
              </div>
            ) : null}
            <div className={`col-span-2 rounded-2xl border px-4 py-3 ${repQualityTone}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">
                  {selectedMode === "plank" ? "Hold Quality" : "Rep Quality"}
                </p>
                <p className="text-sm font-black text-white">{latestRepQualityLabel}</p>
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white">{latestRepQualityMessage}</p>
              <div className="mt-3 flex items-center gap-3 text-xs font-bold">
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-white">
                  Clean {cleanRepCount}
                </span>
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-white/80">
                  Needs Work {needsWorkRepCount}
                </span>
              </div>
            </div>
            {cameraPlacement.placementScore < 75 ? (
              <div className={`col-span-2 rounded-2xl border px-4 py-3 ${placementTone}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Phone Placement</p>
                  <p className="text-sm font-black text-white">
                    {placementViewLabel} · {cameraPlacement.placementScore}%
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">{cameraPlacement.message}</p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tracked</p>
              <p className="mt-1 text-lg font-black text-white">{cameraModeLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Metric</p>
              <p className="mt-1 text-lg font-black text-white">{cameraMetrics.metricValue}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                {selectedMode === "plank" ? "Hold" : "Reps"}
              </p>
              <p className="mt-1 text-lg font-black text-white">{cameraMetrics.reps}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Phase</p>
              <p className="mt-1 text-base font-bold capitalize text-slate-100">{cameraMetrics.phase}</p>
            </div>
          </div>

          <div className={`rounded-[1.25rem] border px-4 py-4 text-left ${feedbackTone}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15 text-[11px] font-black">
                AI
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">
                  {cameraMetrics.metricLabel}
                </p>
                <p className="mt-2 text-sm font-bold leading-relaxed">{feedbackMessage}</p>
              </div>
            </div>
            {trackingWarning ? <p className="mt-2 text-xs leading-relaxed opacity-80">{trackingWarning}</p> : null}
            {errorMessage ? <p className="mt-2 text-xs leading-relaxed text-red-200">{errorMessage}</p> : null}
            <p className="mt-3 text-[11px] leading-relaxed text-slate-300/80">
              Camera processing stays on this device.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300/70">
              Prototype feedback only — not medical advice.
            </p>
          </div>

          <button onClick={handleStopCameraCoach} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-black tracking-wide text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.35)] transition hover:border-blue-400/30 hover:bg-slate-800/90">
            Stop Camera Coach
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="rounded-[1.7rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
      <p className="text-xs font-bold tracking-wide text-slate-500">
        Camera coaching not available for this movement yet.
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      <header className="border-b border-slate-900 bg-slate-900/50 px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 text-xs font-bold tracking-wider">
            <div>
              <p className="text-slate-500 uppercase">{activeMovement.phase} phase</p>
              <p className="text-slate-300">Movement {movementIndex + 1} / {activeRoutine.length} • {elapsedMinutes} min</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onToggleMute} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm active:scale-95">{isMuted ? "🔇" : "🔊"}</button>
              <button onClick={handleSafetyStop} className="rounded-xl border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300 active:scale-95">Stop</button>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <section className="px-4 py-6 lg:px-6 lg:py-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.92fr)]">
          <div className="space-y-6">
            {isRestPhase ? (
              <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.5)] lg:p-8">
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-300">Rest</h2>
                <div className="mt-4 text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-600 font-mono lg:text-[7rem]">
                  {secondsToClock(restCountdown)}
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  Next: <span className="font-bold text-slate-300">{workingSet < activeMovement.sets ? `${cleanMovementName(activeMovement.name)} — Set ${workingSet + 1}` : activeRoutine[movementIndex + 1] ? cleanMovementName(activeRoutine[movementIndex + 1].name) : "Finish"}</span>
                </p>
                {formRecap ? (
                  <div className="mx-auto mt-6 max-w-2xl rounded-[1.6rem] border border-white/8 bg-white/6 p-4 text-left backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Form Recap</p>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-white">Set Review</h3>
                      </div>
                      <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-200">
                        {formRecap.trackingConfidenceAverage}% avg
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Clean Reps</p>
                        <p className="mt-1 text-3xl font-black text-white">{formRecap.cleanRepCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Needs Work</p>
                        <p className="mt-1 text-3xl font-black text-white">{formRecap.needsWorkRepCount}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-bold text-white">
                      Main fix:{" "}
                      <span className="text-slate-200">
                        {formRecap.latestIssue === "shallow"
                          ? "Go a little deeper."
                          : formRecap.latestIssue === "lost_tracking"
                            ? "Step back before you start."
                            : formRecap.latestIssue === "unstable"
                              ? "Slow down and control the movement."
                              : formRecap.latestIssue === "hips_high"
                                ? "Lower your hips slightly."
                                : formRecap.latestIssue === "hips_low"
                                  ? "Lift your hips and brace your core."
                                  : "Keep stacking clean reps."}
                      </span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Coach note: <span className="font-semibold text-white">{formRecap.coachNote}</span>
                    </p>
                  </div>
                ) : null}
              </section>
            ) : (
              <>
                <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.5)] lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">Active Movement</p>
                      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white lg:text-[2.6rem]">
                        {cleanMovementName(activeMovement.name)}
                      </h2>
                    </div>
                    <div className="shrink-0 rounded-[1.4rem] border border-blue-900/50 bg-blue-950/40 px-4 py-3 text-sm font-black tracking-wide text-blue-300 lg:px-5 lg:py-4 lg:text-lg">
                      {secondsToClock(exerciseCountdown)}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                    <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900 p-6 shadow-xl shadow-purple-950/40">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                      <div className="text-6xl font-black tracking-tight text-purple-400 lg:text-7xl">
                        {currentReps} <span className="text-lg font-normal uppercase tracking-[0.22em] text-slate-500 lg:text-xl">reps</span>
                      </div>
                      <div className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        Set {workingSet} of {activeMovement.sets}
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/8 bg-slate-950/45 p-5 text-left text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <p className="text-slate-400"><span className="mr-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400">Form:</span>{activeMovement.formGuide}</p>
                      <p className="mt-4 text-slate-400"><span className="mr-2 text-xs font-black uppercase tracking-[0.2em] text-purple-400">Breathe:</span>{activeMovement.breathingCue}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.9rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)] lg:p-5">
                  <div className="space-y-3">
                    <button onClick={handleCompleteSet} className={primaryButton}>Complete Set</button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={onChangeDifficultyEasy} className="rounded-2xl border border-slate-800 bg-slate-900 py-4 text-sm font-black text-slate-300 transition-all active:scale-95 hover:border-slate-700">Too Easy +2</button>
                      <button onClick={onChangeDifficultyHard} className="rounded-2xl border border-slate-800 bg-slate-900 py-4 text-sm font-black text-slate-300 transition-all active:scale-95 hover:border-slate-700">Too Hard -2</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-black uppercase tracking-wider">
                      <button onClick={onAdvanceExecutionTrack} className="pl-2 text-left text-slate-600 transition hover:text-slate-400">Skip Movement</button>
                      <button onClick={handleSafetyStop} className="pr-2 text-right text-red-500/80 transition hover:text-red-400">Pain / Stop</button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[1.8rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
              <FloatingCoachAvatar
                selectedAvatar={selectedAvatar}
                mood={coachBrain.mood}
                message={persistentCoachMessage}
                position="inline"
                emphasis="standard"
              />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{selectedCoach}</p>
                  <p className="mt-1 text-xs text-slate-400">Persistent coach guidance stays visible while your main controls stay clear.</p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                  supportedCameraMode
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                    : "border-white/8 bg-slate-900/70 text-slate-400"
                }`}>
                  {supportedCameraMode ? "Camera Coach Ready" : "No Camera Coach"}
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {supportedCameraMode
                  ? "Camera Coach is available for this movement whenever you want live tracking."
                  : "Camera coaching not available for this movement yet."}
              </p>
              <button onClick={onRecallCoachDialogue} className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 text-xs font-black uppercase tracking-wider text-slate-400 transition hover:bg-slate-800 active:scale-95">
                Speak Coach Line
              </button>
            </div>

            {voicePanel}
            {cameraCoachPanel}
          </aside>
        </div>
      </section>

      {isRestPhase ? (
        <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 pb-8 lg:hidden">
          <div className="mx-auto max-w-md">
            <button onClick={onAdvanceExecutionTrack} className={primaryButton}>Skip Rest</button>
          </div>
        </footer>
      ) : null}

      {isRestPhase ? (
        <div className="px-4 pb-8 lg:px-6 lg:pb-10">
          <div className="mx-auto max-w-7xl lg:max-w-[calc(theme(maxWidth.7xl)-24rem)] xl:mr-[calc((100%-theme(maxWidth.7xl))/2+24rem)]">
            <button onClick={onAdvanceExecutionTrack} className={`${primaryButton} hidden lg:flex`}>
              Skip Rest
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
