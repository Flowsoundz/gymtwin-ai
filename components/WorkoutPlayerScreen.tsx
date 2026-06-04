import { useEffect, useMemo, useRef, useState } from "react";
import { Coach3D } from "@/components/Coach3D";
import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { ExerciseDemoCard } from "@/components/ExerciseDemoCard";
import { useCameraCoach } from "@/hooks/useCameraCoach";
import type { TrackingMode } from "@/hooks/useCameraCoach";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { getAvatarLabel } from "@/lib/avatarAssets";
import { getAvatarCoachLayerState } from "@/lib/avatarCoachLayer";
import { getExerciseDemoDescriptor } from "@/lib/exerciseDemoLibrary";
import { playCountdownCue, playSetStartCue } from "@/lib/audioCues";
import { getCameraCoachLabel, getCameraCoachModeForMovementName } from "@/lib/cameraCoachMapping";
import { getCoachBrainResponse } from "@/lib/coachBrain";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import { getExerciseClipName, isFloorMovementName } from "@/lib/exerciseAnimationMap";
import {
  ENABLE_CAMERA_TRACKING,
  ENABLE_EXERCISE_DEMOS,
  ENABLE_MEDIAPIPE,
} from "@/lib/featureFlags";
import {
  getConversationResponse,
  parseConversationIntent,
  type ConversationIntent,
} from "@/lib/conversationCommands";
import { useRepSpeech } from "@/hooks/useRepSpeech";
import type {
  AvatarDisplaySettings,
  CoachAvatar,
  CoachName,
  PersonalizedWorkoutPlan,
  WorkoutMovement,
} from "@/types";

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
  avatarDisplaySettings: AvatarDisplaySettings;
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
  onCoachAnimHint?: (hint: CoachAnimationHint) => void;
  personalizedPlan?: PersonalizedWorkoutPlan;
  isFirstWorkout?: boolean;
  onFirstHintsDismissed?: () => void;
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
  avatarDisplaySettings,
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
  personalizedPlan,
  onCoachAnimHint,
  isFirstWorkout = false,
  onFirstHintsDismissed,
  primaryButton,
}: WorkoutPlayerScreenProps) {
  const [hintsVisible, setHintsVisible] = useState(isFirstWorkout);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [coachLinePlaying, setCoachLinePlaying] = useState(false);
  const previousRestCountdownRef = useRef<number | null>(null);
  const previousActiveSetKeyRef = useRef<string | null>(null);

  function dismissHints() {
    setHintsVisible(false);
    onFirstHintsDismissed?.();
  }
  const [isCameraCoachOpen, setIsCameraCoachOpen] = useState(false);
  const prevCoachAnimHint = useRef<CoachAnimationHint | null>(null);
  const [formRecap, setFormRecap] = useState<{
    cleanRepCount: number;
    needsWorkRepCount: number;
    latestIssue: string | null;
    bestCue: string;
    trackingConfidenceAverage: number;
    coachNote: string;
  } | null>(null);
  const [conversationState, setConversationState] = useState<{
    intent: ConversationIntent;
    answer: string;
  } | null>(null);
  const {
    isCameraRunning,
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
            coachBrainMessage: displayedSpeech || feedbackMessage || "I’m ready when you are.",
          })
        );
      }

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
  const demoClipName = useMemo(
    () => getExerciseClipName(activeMovement),
    [activeMovement]
  );
  const isFloorDemo = useMemo(
    () => isFloorMovementName(activeMovement.name),
    [activeMovement.name]
  );
  const exerciseDemoDescriptor = useMemo(
    () => getExerciseDemoDescriptor(activeMovement.name, selectedAvatar),
    [activeMovement.name, selectedAvatar]
  );

  // Look up the richer PersonalizedExercise data for the current and next movements
  const allPlanExercises = useMemo(
    () => personalizedPlan
      ? [...personalizedPlan.warmup, ...personalizedPlan.mainBlock, ...personalizedPlan.cooldown]
      : [],
    [personalizedPlan]
  );
  const personalizedExercise = useMemo(
    () => allPlanExercises.find((ex) => ex.name === cleanMovementName(activeMovement.name)) ?? null,
    [allPlanExercises, activeMovement.name, cleanMovementName]
  );
  const nextPersonalizedExercise = useMemo(() => {
    const nextMove = workingSet < activeMovement.sets
      ? null  // same exercise, next set
      : activeRoutine[movementIndex + 1] ?? null;
    if (!nextMove) return null;
    return allPlanExercises.find((ex) => ex.name === cleanMovementName(nextMove.name)) ?? null;
  }, [allPlanExercises, activeMovement.sets, activeRoutine, cleanMovementName, movementIndex, workingSet]);

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
    if (!supportedCameraMode || !ENABLE_CAMERA_TRACKING) return;
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
    statusLabel === "Pose Tracking Active" || statusLabel === "Camera Preview Active"
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
        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
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

  const formAccuracyPct = trackingReadiness.confidenceScore;
  const paceMatchPct =
    cleanRepCount + needsWorkRepCount > 0
      ? Math.round((cleanRepCount / (cleanRepCount + needsWorkRepCount)) * 100)
      : 0;

  const hudGlowClass =
    feedbackSeverity === "good"
      ? "shadow-[0_0_60px_rgba(16,185,129,0.45),0_0_100px_rgba(16,185,129,0.12)] bg-gradient-to-br from-emerald-500/45 via-transparent to-transparent"
      : feedbackSeverity === "error"
        ? "shadow-[0_0_60px_rgba(239,68,68,0.45),0_0_100px_rgba(239,68,68,0.12)] bg-gradient-to-br from-red-500/45 via-transparent to-transparent"
        : feedbackSeverity === "warning"
          ? "shadow-[0_0_50px_rgba(34,211,238,0.38)] bg-gradient-to-br from-cyan-500/35 via-transparent to-transparent"
          : "shadow-[0_0_40px_rgba(99,102,241,0.28)] bg-gradient-to-br from-blue-500/28 via-transparent to-fuchsia-500/18";

  const formHUDBadge =
    formAccuracyPct >= 80
      ? "border-emerald-400/40 bg-emerald-950/85 text-emerald-200"
      : formAccuracyPct >= 50
        ? "border-cyan-400/40 bg-cyan-950/85 text-cyan-200"
        : "border-red-400/40 bg-red-950/85 text-red-200";

  const formHUDBarGrad =
    formAccuracyPct >= 80 ? "from-emerald-400 to-green-500"
    : formAccuracyPct >= 50 ? "from-cyan-400 to-blue-500"
    : "from-red-500 to-rose-600";

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
        isCameraActive: isCameraCoachOpen && isCameraRunning,
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
  // Bubble coachBrain animation hints up to the floating coach
  useEffect(() => {
    if (!onCoachAnimHint) return;
    const hint = coachBrain.animationHint;
    if (hint && hint !== prevCoachAnimHint.current) {
      prevCoachAnimHint.current = hint;
      onCoachAnimHint(hint);
    }
  }, [coachBrain.animationHint, onCoachAnimHint]);

  // Per-rep speech + form-reactive avatar reactions
  const activeRepCount =
    selectedMode === "squat" ? squatRepCount :
    selectedMode === "pushup" ? pushupRepCount : 0;
  useRepSpeech({
    repCount: activeRepCount,
    repQualityLabel: latestRepQuality?.label,
    exerciseName: activeMovement.name,
    talkativeness: avatarDisplaySettings.talkativeness,
    repCountingEnabled: avatarDisplaySettings.repCountingEnabled,
    isMuted,
    isCameraActive: isCameraCoachOpen && isCameraRunning,
    selectedAvatar,
    onAnimHint: onCoachAnimHint,
  });

  const trackingLockTone =
    statusLabel === "Camera Error"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : trackingReadiness.fullBodyVisible
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
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
          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200"
      : latestRepQuality?.label === "clean"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : latestRepQuality?.label === "shallow" ||
            latestRepQuality?.label === "unstable" ||
            latestRepQuality?.label === "lost_tracking"
          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
          : "border-slate-700/60 bg-slate-900/70 text-slate-200";
  const placementTone =
    cameraPlacement.placementScore >= 75
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  const placementViewLabel = cameraPlacement.likelySideView
    ? "Side"
    : cameraPlacement.likelyFrontView
      ? "Front"
      : "Unknown";

  const persistentCoachMessage =
    coachBrain.mood === "idle" && displayedSpeech ? displayedSpeech : coachBrain.message;
  const avatarCoachState = useMemo(
    () =>
      getAvatarCoachLayerState({
        surface: "workout_tracking",
        selectedAvatar,
        coachBrain: {
          ...coachBrain,
          message: persistentCoachMessage,
        },
        exerciseName: cleanMovementName(activeMovement.name),
        cameraActive: isCameraCoachOpen,
        trackingIssue:
          trackingLost ||
          !trackingReadiness.fullBodyVisible ||
          statusLabel === "Camera Error",
        warningActive:
          feedbackSeverity === "warning" ||
          feedbackSeverity === "error" ||
          Boolean(trackingWarning),
        isVoiceListening: isListening,
        isRestPhase,
        highlightDemo: avatarDisplaySettings.showExerciseDemos,
        compactPreference: avatarDisplaySettings.compactInWorkout,
      }),
    [
      activeMovement.name,
      avatarDisplaySettings.compactInWorkout,
      avatarDisplaySettings.showExerciseDemos,
      cleanMovementName,
      coachBrain,
      feedbackSeverity,
      isCameraCoachOpen,
      isListening,
      isRestPhase,
      persistentCoachMessage,
      selectedAvatar,
      statusLabel,
      trackingLost,
      trackingReadiness.fullBodyVisible,
      trackingWarning,
    ]
  );
  const showAvatarVisual = avatarDisplaySettings.show3DCoach && avatarDisplaySettings.mode !== "hidden";
  const showSidebarAvatar = showAvatarVisual && avatarDisplaySettings.mode === "coach_card";
  const showFloatingWorkoutOverlay =
    showAvatarVisual && avatarDisplaySettings.mode === "floating_overlay";
  const useMinimalCameraHud = avatarDisplaySettings.minimalCameraHud && isCameraCoachOpen;
  const showExerciseDemoCard =
    ENABLE_EXERCISE_DEMOS &&
    avatarDisplaySettings.showExerciseDemos &&
    avatarCoachState.shouldShowDemoCard &&
    (!useMinimalCameraHud || !isCameraCoachOpen);
  const showDemoCoach = ENABLE_EXERCISE_DEMOS && Boolean(demoClipName);
  const showVoicePanel = !useMinimalCameraHud;
  const canStartCameraCoach = ENABLE_CAMERA_TRACKING;
  const activeSetKey = `${activeMovement.id}:${movementIndex}:${workingSet}`;
  const cameraCoachAvailabilityDetail = !ENABLE_CAMERA_TRACKING
    ? "Camera tracking is disabled by feature flag."
    : !ENABLE_MEDIAPIPE
      ? "Camera preview can run, but MediaPipe is disabled for this test."
      : "Camera Coach is available for this movement whenever you want live tracking.";

  useEffect(() => {
    if (!avatarDisplaySettings.countdownAudioEnabled || isMuted) {
      previousRestCountdownRef.current = restCountdown;
      return;
    }

    const previousCountdown = previousRestCountdownRef.current;
    previousRestCountdownRef.current = restCountdown;

    if (!isRestPhase || previousCountdown === null || restCountdown >= previousCountdown) {
      return;
    }

    if (restCountdown === 3 || restCountdown === 2 || restCountdown === 1) {
      playCountdownCue(restCountdown);
    }
  }, [avatarDisplaySettings.countdownAudioEnabled, isMuted, isRestPhase, restCountdown]);

  useEffect(() => {
    if (isRestPhase) {
      previousActiveSetKeyRef.current = null;
      return;
    }

    if (!avatarDisplaySettings.countdownAudioEnabled || isMuted) {
      previousActiveSetKeyRef.current = activeSetKey;
      return;
    }

    if (previousActiveSetKeyRef.current !== activeSetKey) {
      previousActiveSetKeyRef.current = activeSetKey;
      window.setTimeout(() => {
        playSetStartCue();
      }, 80);
    }
  }, [activeSetKey, avatarDisplaySettings.countdownAudioEnabled, isMuted, isRestPhase]);

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
          <button onClick={handleStartCameraCoach} disabled={!canStartCameraCoach} className={primaryButton}>
            {canStartCameraCoach ? "Start Camera Coach" : "Camera Disabled"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.25rem] border border-blue-400/20 bg-blue-950/30 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">Camera Feed Active Above</p>
            <p className="mt-0.5 text-xs text-slate-400">Live tracking shown in the camera HUD panel</p>
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
              <div className="col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-100">Tracking Paused</p>
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
            {conversationState ? (
              <div className="mt-3 rounded-2xl border border-fuchsia-400/16 bg-fuchsia-500/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">Conversation Mode</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">{conversationState.answer}</p>
              </div>
            ) : null}
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
      {/* First-workout hints banner */}
      {hintsVisible && (
        <div className="relative z-20 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/70 to-blue-950/70 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-300">Quick tips</span>
              {[
                { icon: "✅", text: "Tap Complete Set when done" },
                { icon: "⏭️", text: "Skip rest when you're ready" },
                { icon: "🎤", text: 'Say "done" or "skip rest"' },
                { icon: "🛑", text: "Tap Stop if anything hurts" },
              ].map((h) => (
                <span key={h.text} className="text-xs text-slate-300">
                  <span className="mr-1">{h.icon}</span>{h.text}
                </span>
              ))}
            </div>
            <button
              onClick={dismissHints}
              className="shrink-0 text-slate-500 hover:text-slate-300 text-lg leading-none"
              aria-label="Dismiss hints"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-white/5 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{activeMovement.phase} phase</p>
              <p className="mt-0.5 text-sm font-bold text-slate-200">Movement {movementIndex + 1} / {activeRoutine.length} <span className="text-slate-600">·</span> {elapsedMinutes} min</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onToggleMute} className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm transition hover:border-white/20 active:scale-95">{isMuted ? "🔇" : "🔊"}</button>
              <button
                onClick={() => setQuickSettingsOpen((o) => !o)}
                className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-sm transition active:scale-95 ${
                  quickSettingsOpen
                    ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
                aria-label="Quick settings"
              >
                ⚙
              </button>
              <button onClick={handleSafetyStop} className="rounded-full border border-red-500/25 bg-red-950/25 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-300 transition hover:border-red-500/40 active:scale-95">Stop</button>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
          {quickSettingsOpen ? (
            <div className="mt-3 rounded-[1.4rem] border border-white/8 bg-slate-950/80 px-4 py-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">Active Coach Settings</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl border border-white/8 bg-slate-900/70 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Coach</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-100">{selectedCoach}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-slate-900/70 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Voice</p>
                  <p className="mt-0.5 text-xs font-bold capitalize text-slate-100">{avatarDisplaySettings.talkativeness}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-slate-900/70 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Avatar</p>
                  <p className="mt-0.5 text-xs font-bold capitalize text-slate-100">{avatarDisplaySettings.mode.replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-slate-900/70 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Muted</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-100">{isMuted ? "Yes" : "No"}</p>
                </div>
                <p className="text-[9px] text-slate-600">Full options in ← Settings</p>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <section className="px-4 py-6 lg:px-6 lg:py-8">
        {/* ── Dual-column camera HUD (only when camera is active) ── */}
        {isCameraCoachOpen && (
          <div className="mx-auto mb-6 max-w-7xl">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.58fr)]">

              {/* Left: Live camera feed with neon skeletal glow */}
              <div className={`rounded-[1.8rem] p-[2px] transition-all duration-500 ${hudGlowClass}`}>
                <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950">
                  {/* Corner badge: Form Accuracy */}
                  <div className="pointer-events-none absolute left-3 top-3 z-10">
                    <div className={`rounded-2xl border px-3 py-2 backdrop-blur-xl ${formHUDBadge}`}>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Form Accuracy</p>
                      <p className="text-2xl font-black leading-none">{formAccuracyPct}%</p>
                      <div className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all ${formHUDBarGrad}`}
                          style={{ width: `${formAccuracyPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Corner badge: Rep count */}
                  <div className="pointer-events-none absolute right-3 top-3 z-10">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur-xl">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                        {selectedMode === "plank" ? "Hold" : "Reps"}
                      </p>
                      <p className="text-2xl font-black leading-none text-white">{cameraMetrics.reps}</p>
                    </div>
                  </div>

                  {/* The live camera feed */}
                  <div className="relative aspect-[16/11]">
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
                    {/* Peripheral neon bleed cues — react to form severity */}
                    <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
                      feedbackSeverity === "good"
                        ? "shadow-[inset_0_0_55px_rgba(16,185,129,0.32)] bleed-pulse"
                        : feedbackSeverity === "error"
                          ? "shadow-[inset_0_0_55px_rgba(239,68,68,0.35)] bleed-pulse"
                        : feedbackSeverity === "warning"
                            ? "shadow-[inset_0_0_55px_rgba(34,211,238,0.30)] bleed-pulse"
                            : "shadow-[inset_0_0_0px_transparent]"
                    }`} />
                  </div>

                  {/* Bottom bar: phase + status */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-3 pb-3 pt-8">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md ${
                        feedbackSeverity === "good"
                          ? "border-emerald-400/30 bg-emerald-950/70 text-emerald-200"
                          : feedbackSeverity === "error"
                            ? "border-red-400/30 bg-red-950/70 text-red-200"
                            : "border-white/10 bg-slate-950/70 text-slate-300"
                      }`}>
                        {cameraMetrics.phase}
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md ${statusTone}`}>
                        {statusLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Coach3D with Pace Match + Form Accuracy HUD */}
              <div className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.55)]">
                {/* Ambient glow orb */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),_transparent_60%)]" />

                {/* HUD overlay — top */}
                <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col gap-2">
                  {/* Pace Match */}
                  <div className="rounded-2xl border border-blue-400/25 bg-slate-950/85 px-3 py-2.5 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-300">Pace Match</p>
                      <p className="text-lg font-black text-white leading-none">{paceMatchPct}%</p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700"
                        style={{ width: `${paceMatchPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Form Accuracy */}
                  <div className={`rounded-2xl border px-3 py-2.5 backdrop-blur-xl ${formHUDBadge} bg-opacity-85`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Form Accuracy</p>
                      <p className="text-lg font-black leading-none">{formAccuracyPct}%</p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${formHUDBarGrad}`}
                        style={{ width: `${formAccuracyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Coach3D demo — always shown; demo clip layered on top of idle when available */}
                <Coach3D
                  selectedAvatar={selectedAvatar}
                  animationHint="idle"
                  demoClipName={demoClipName}
                  compact
                  previewFrame="full_body"
                  lightingMode="neutral"
                  isFloorMovement={isFloorDemo}
                />

                {/* Coach label strip at bottom */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent px-3 pb-3 pt-8">
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-fuchsia-400">Digital Twin Coach</p>
                  <p className="mt-0.5 text-center text-xs font-semibold text-slate-300">{cleanMovementName(activeMovement.name)}</p>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.92fr)]">
          <div className="space-y-6">
            {isRestPhase ? (
              <>
                {showDemoCoach ? (
                  <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950">
                    <div className="flex items-center justify-between px-5 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">
                        Movement Demo · Rest Period
                      </p>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
                        Study Form
                      </span>
                    </div>
                    <div className="coach-float">
                      <Coach3D
                        selectedAvatar={selectedAvatar}
                        animationHint="idle"
                        demoClipName={demoClipName}
                        previewFrame="full_body"
                        lightingMode="neutral"
                        isFloorMovement={isFloorDemo}
                      />
                    </div>
                    <div className="pointer-events-none -mt-3 flex justify-center pb-4">
                      <div className="h-3 w-28 rounded-full bg-emerald-500/40 blur-md rim-pulse" />
                    </div>
                  </div>
                ) : null}

              <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.5)] lg:p-8">
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-300">Rest</h2>
                <div className="mt-4 text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-600 font-mono lg:text-[7rem]">
                  {secondsToClock(restCountdown)}
                </div>
                {/* ── Next-exercise preview ── */}
                {workingSet < activeMovement.sets ? (
                  // Same exercise, next set
                  <div className="mx-auto mt-6 max-w-lg rounded-[1.5rem] border border-blue-900/40 bg-blue-950/20 px-5 py-4 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-400">Coming Up · Set {workingSet + 1} of {activeMovement.sets}</p>
                    <p className="mt-1.5 text-base font-black text-white">{cleanMovementName(activeMovement.name)}</p>
                    {personalizedExercise && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 italic">
                        &ldquo;{personalizedExercise.coachingCue}&rdquo;
                      </p>
                    )}
                  </div>
                ) : activeRoutine[movementIndex + 1] ? (
                  // Next exercise
                  <div className="mx-auto mt-6 max-w-lg rounded-[1.5rem] border border-white/8 bg-slate-950/60 px-5 py-4 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-fuchsia-400">Next Exercise</p>
                    <p className="mt-1.5 text-base font-black text-white">
                      {cleanMovementName(activeRoutine[movementIndex + 1].name)}
                    </p>
                    {nextPersonalizedExercise ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full border border-purple-900/40 bg-purple-950/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                            {nextPersonalizedExercise.muscleGroup}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {nextPersonalizedExercise.equipment}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {nextPersonalizedExercise.sets}&thinsp;×&thinsp;
                            {nextPersonalizedExercise.duration
                              ? `${nextPersonalizedExercise.duration}s`
                              : `${nextPersonalizedExercise.reps} reps`}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-400 italic">
                          &ldquo;{nextPersonalizedExercise.coachingCue}&rdquo;
                        </p>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-6 text-sm font-bold text-emerald-300">Last movement complete — finish strong.</p>
                )}
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
              </>
            ) : (
              <>
                <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.5)] lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">Active Movement</p>
                      <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white lg:text-[2.6rem]">
                        {cleanMovementName(activeMovement.name)}
                      </h2>
                      {personalizedExercise && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center rounded-full border border-purple-900/50 bg-purple-950/40 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                            {personalizedExercise.muscleGroup}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {personalizedExercise.equipment}
                          </span>
                        </div>
                      )}
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
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: activeMovement.sets }, (_, i) => (
                            <div
                              key={i}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                i < workingSet - 1
                                  ? "w-5 bg-purple-400"
                                  : i === workingSet - 1
                                    ? "w-5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                                    : "w-3 bg-white/15"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                          Set {workingSet} / {activeMovement.sets}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/8 bg-slate-950/45 p-5 text-left text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {personalizedExercise ? (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Coach Cue</p>
                          <p className="mt-1.5 text-slate-200 italic leading-relaxed">
                            &ldquo;{personalizedExercise.coachingCue}&rdquo;
                          </p>
                          <p className="mt-4 text-slate-400">
                            <span className="mr-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Breathe:</span>
                            {activeMovement.breathingCue}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-400"><span className="mr-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400">Form:</span>{activeMovement.formGuide}</p>
                          <p className="mt-4 text-slate-400"><span className="mr-2 text-xs font-black uppercase tracking-[0.2em] text-purple-400">Breathe:</span>{activeMovement.breathingCue}</p>
                        </>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.9rem] border border-white/8 bg-white/6 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.45)] lg:p-5">
                  <div className="space-y-3">
                    <button onClick={handleCompleteSet} className={primaryButton}>Complete Set</button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={onChangeDifficultyEasy}
                        className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-left transition-all active:scale-95 hover:border-emerald-700/40"
                      >
                        <p className="text-xs font-black text-emerald-300">Too Easy +2</p>
                        {personalizedExercise && (
                          <p className="mt-0.5 text-[9px] leading-snug text-slate-500">
                            {personalizedExercise.harderOption}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={onChangeDifficultyHard}
                        className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-left transition-all active:scale-95 hover:border-orange-700/40"
                      >
                        <p className="text-xs font-black text-orange-300">Too Hard −2</p>
                        {personalizedExercise && (
                          <p className="mt-0.5 text-[9px] leading-snug text-slate-500">
                            {personalizedExercise.easierOption}
                          </p>
                        )}
                      </button>
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
              {showSidebarAvatar ? (
                <FloatingCoachAvatar
                  selectedAvatar={selectedAvatar}
                  mood={avatarCoachState.mood}
                  message={avatarCoachState.message}
                  position="inline"
                  compact={avatarDisplaySettings.compactInWorkout}
                  emphasis="standard"
                />
              ) : (
                <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/55 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Coach Guidance</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-white">{avatarCoachState.message}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{selectedCoach}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {avatarDisplaySettings.mode === "hidden"
                      ? "Coaching text stays active while avatar visuals stay hidden."
                      : avatarDisplaySettings.mode === "camera_corner"
                        ? "Avatar visuals move near the camera panel so the workout layout stays clean."
                        : avatarDisplaySettings.mode === "floating_overlay"
                          ? "The coach floats over the workout so the sidebar stays lighter."
                          : "Persistent coach guidance stays visible while your main controls stay clear."}
                  </p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                  supportedCameraMode
                    ? canStartCameraCoach
                      ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                      : "border-red-400/20 bg-red-500/10 text-red-200"
                    : "border-white/8 bg-slate-900/70 text-slate-400"
                }`}>
                  {supportedCameraMode ? (canStartCameraCoach ? "Camera Coach Ready" : "Camera Disabled") : "No Camera Coach"}
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {supportedCameraMode ? cameraCoachAvailabilityDetail : "Camera coaching not available for this movement yet."}
              </p>
              <div className="mt-3 rounded-[1.25rem] border border-white/8 bg-slate-950/55 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Demo Pipeline</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {avatarCoachState.demoDescriptor?.title ?? exerciseDemoDescriptor.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {avatarCoachState.demoDescriptor?.summary ?? exerciseDemoDescriptor.summary}
                </p>
              </div>
              <button
                onClick={() => {
                  onRecallCoachDialogue();
                  setCoachLinePlaying(true);
                  window.setTimeout(() => setCoachLinePlaying(false), 3200);
                }}
                className={`mt-4 w-full rounded-2xl border py-3 text-xs font-black uppercase tracking-wider transition active:scale-95 ${
                  coachLinePlaying
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {coachLinePlaying ? "Coach Speaking..." : "Speak Coach Line"}
              </button>
            </div>

            {showExerciseDemoCard && !isCameraCoachOpen ? (
              <ExerciseDemoCard
                selectedAvatar={selectedAvatar}
                exerciseName={cleanMovementName(activeMovement.name)}
                demoClipName={demoClipName}
                compact={avatarCoachState.shouldPreferCompact}
              />
            ) : null}

            {showVoicePanel ? voicePanel : null}

            {showDemoCoach && isCameraCoachOpen ? null /* Coach shown in camera HUD above */ : showDemoCoach && !showExerciseDemoCard ? (
              <div className={`overflow-hidden rounded-[1.7rem] border bg-white/6 backdrop-blur-xl transition-all duration-500 ${
                coachLinePlaying
                  ? "border-violet-400/40 shadow-[0_0_40px_rgba(139,92,246,0.3)] voice-aura"
                  : "border-white/8 shadow-[0_18px_60px_rgba(15,23,42,0.45)]"
              }`}>
                <div className="px-4 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Coach Demo</p>
                  <p className="mt-1 text-sm font-black tracking-tight text-white">{cleanMovementName(activeMovement.name)}</p>
                </div>
                <div className="coach-float">
                  <Coach3D
                    selectedAvatar={selectedAvatar}
                    animationHint="idle"
                    demoClipName={demoClipName}
                    compact
                    previewFrame="full_body"
                    lightingMode="neutral"
                    isFloorMovement={isFloorDemo}
                  />
                </div>
                {/* Neon floor rim light — tracks live form feedback state */}
                <div className="pointer-events-none -mt-3 flex justify-center pb-4">
                  <div className={`h-3 w-20 rounded-full blur-md transition-all duration-700 rim-pulse ${
                    feedbackSeverity === "good"
                      ? "bg-emerald-500/55"
                      : feedbackSeverity === "error"
                        ? "bg-red-500/55"
                        : feedbackSeverity === "warning"
                          ? "bg-cyan-500/55"
                          : "bg-blue-500/30"
                  }`} />
                </div>
              </div>
            ) : null}

            {cameraCoachPanel}
          </aside>
        </div>
      </section>

      {showFloatingWorkoutOverlay ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-20 sm:inset-x-auto sm:bottom-6 sm:right-6">
          <div className="ml-auto max-w-[14rem] sm:max-w-[15rem]">
            <FloatingCoachAvatar
              selectedAvatar={selectedAvatar}
              mood={avatarCoachState.mood}
              message={avatarCoachState.message}
              position="stage-overlay"
              compact={avatarDisplaySettings.compactInWorkout}
              emphasis="standard"
            />
          </div>
        </div>
      ) : null}

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
