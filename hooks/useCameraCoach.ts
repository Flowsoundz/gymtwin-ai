"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NormalizedLandmark, PoseLandmarker as PoseLandmarkerType } from "@mediapipe/tasks-vision";

type SquatPhase = "standing" | "descending" | "bottom" | "rising" | "unknown";
type PushupPhase = "up" | "descending" | "bottom" | "rising" | "unknown";
type PlankPosture = "stable" | "hips high" | "hips low" | "unknown";
type FeedbackSeverity = "good" | "warning" | "error" | "neutral";

export type TrackingMode = "squat" | "pushup" | "plank";

export type TrackingReadiness = {
  headVisible: boolean;
  shouldersVisible: boolean;
  hipsVisible: boolean;
  kneesVisible: boolean;
  feetVisible: boolean;
  fullBodyVisible: boolean;
  confidenceScore: number;
  message: string;
};

export type CameraPlacement = {
  tooClose: boolean;
  tooFar: boolean;
  tooLow: boolean;
  tooHigh: boolean;
  likelySideView: boolean;
  likelyFrontView: boolean;
  message: string;
  placementScore: number;
};

export type RepQualityLabel = "clean" | "shallow" | "unstable" | "lost_tracking" | "unknown";

export type RepQualityEntry = {
  id: number;
  mode: "squat" | "pushup" | "plank";
  label: RepQualityLabel;
  message: string;
  angle?: number;
  confidenceScore?: number;
  timestamp: number;
};

export type PlankQualityLabel = "stable" | "hips_high" | "hips_low" | "lost_tracking" | "unknown";
export type LatestIssueLabel = "shallow" | "lost_tracking" | "unstable" | "hips_high" | "hips_low" | null;

const emptyTrackingReadiness: TrackingReadiness = {
  headVisible: false,
  shouldersVisible: false,
  hipsVisible: false,
  kneesVisible: false,
  feetVisible: false,
  fullBodyVisible: false,
  confidenceScore: 0,
  message: "Step back so I can see your full body.",
};

const emptyCameraPlacement: CameraPlacement = {
  tooClose: false,
  tooFar: false,
  tooLow: false,
  tooHigh: false,
  likelySideView: false,
  likelyFrontView: false,
  message: "Place your phone so your full body fits cleanly in frame.",
  placementScore: 0,
};

export function useCameraCoach() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarkerType | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestIdRef = useRef(0);
  const squatPhaseRef = useRef<SquatPhase>("standing");
  const reachedBottomRef = useRef(false);
  const repCountRef = useRef(0);
  const pushupPhaseRef = useRef<PushupPhase>("up");
  const reachedPushupBottomRef = useRef(false);
  const pushupRepCountRef = useRef(0);
  const plankPostureRef = useRef<PlankPosture>("unknown");
  const plankHoldSecondsRef = useRef(0);
  const plankLastTimestampRef = useRef<number | null>(null);
  const trackingReadinessRef = useRef<TrackingReadiness>(emptyTrackingReadiness);
  const cameraPlacementRef = useRef<CameraPlacement>(emptyCameraPlacement);
  const lowConfidenceStartRef = useRef<number | null>(null);
  const bodyMissingStartRef = useRef<number | null>(null);
  const trackingRecoveryExpiresAtRef = useRef<number | null>(null);
  const squatBottomAngleRef = useRef<number | null>(null);
  const pushupBottomAngleRef = useRef<number | null>(null);
  const repQualityIdRef = useRef(0);
  const trackingConfidenceTotalRef = useRef(0);
  const trackingConfidenceSampleCountRef = useRef(0);
  const displayUpdateTimeRef = useRef(0);
  const feedbackRef = useRef<{ message: string; severity: FeedbackSeverity }>({
    message: "Start camera to begin squat form feedback.",
    severity: "neutral",
  });

  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TrackingMode>("squat");
  const [statusLabel, setStatusLabel] = useState("Camera Off");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [squatRepCount, setSquatRepCount] = useState(0);
  const [squatPhase, setSquatPhase] = useState<SquatPhase>("unknown");
  const [kneeAngleDisplay, setKneeAngleDisplay] = useState("--");
  const [pushupRepCount, setPushupRepCount] = useState(0);
  const [pushupPhase, setPushupPhase] = useState<PushupPhase>("unknown");
  const [elbowAngleDisplay, setElbowAngleDisplay] = useState("--");
  const [plankHoldSeconds, setPlankHoldSeconds] = useState(0);
  const [plankPostureStatus, setPlankPostureStatus] = useState<PlankPosture>("unknown");
  const [plankAlignmentScore, setPlankAlignmentScore] = useState("--");
  const [trackingWarning, setTrackingWarning] = useState<string | null>("Stand fully in frame to begin squat tracking.");
  const [feedbackMessage, setFeedbackMessage] = useState("Start camera to begin squat form feedback.");
  const [feedbackSeverity, setFeedbackSeverity] = useState<FeedbackSeverity>("neutral");
  const [trackingReadiness, setTrackingReadiness] = useState<TrackingReadiness>(emptyTrackingReadiness);
  const [cameraPlacement, setCameraPlacement] = useState<CameraPlacement>(emptyCameraPlacement);
  const [trackingLost, setTrackingLost] = useState(false);
  const [trackingLostReason, setTrackingLostReason] = useState("Tracking looks stable.");
  const [trackingLostSeconds, setTrackingLostSeconds] = useState(0);
  const [trackingRecoveredAt, setTrackingRecoveredAt] = useState<number | undefined>(undefined);
  const [trackingRecentlyRecovered, setTrackingRecentlyRecovered] = useState(false);
  const [repQualityLog, setRepQualityLog] = useState<RepQualityEntry[]>([]);
  const [latestRepQuality, setLatestRepQuality] = useState<RepQualityEntry | undefined>(undefined);
  const [cleanRepCount, setCleanRepCount] = useState(0);
  const [needsWorkRepCount, setNeedsWorkRepCount] = useState(0);
  const [plankQualityLabel, setPlankQualityLabel] = useState<PlankQualityLabel>("unknown");
  const [plankQualityMessage, setPlankQualityMessage] = useState("Hold still so I can read your posture.");
  const [trackingConfidenceAverage, setTrackingConfidenceAverage] = useState(0);

  const resetTrackingState = useCallback((mode: TrackingMode) => {
    const neutralMessage =
      mode === "squat"
        ? "Start camera to begin squat form feedback."
        : mode === "pushup"
          ? "Start camera to begin push-up form feedback."
          : "Start camera to begin plank posture tracking.";
    const neutralWarning =
      mode === "squat"
        ? "Stand fully in frame to begin squat tracking."
        : mode === "pushup"
          ? "Keep your shoulders, elbows, and wrists clearly visible."
          : "Keep your shoulders, hips, and ankles clearly visible.";

    squatPhaseRef.current = "unknown";
    reachedBottomRef.current = false;
    repCountRef.current = 0;
    pushupPhaseRef.current = "up";
    reachedPushupBottomRef.current = false;
    pushupRepCountRef.current = 0;
    plankPostureRef.current = "unknown";
    plankHoldSecondsRef.current = 0;
    plankLastTimestampRef.current = null;
    trackingReadinessRef.current = emptyTrackingReadiness;
    cameraPlacementRef.current = emptyCameraPlacement;
    lowConfidenceStartRef.current = null;
    bodyMissingStartRef.current = null;
    trackingRecoveryExpiresAtRef.current = null;
    squatBottomAngleRef.current = null;
    pushupBottomAngleRef.current = null;
    repQualityIdRef.current = 0;
    trackingConfidenceTotalRef.current = 0;
    trackingConfidenceSampleCountRef.current = 0;
    displayUpdateTimeRef.current = 0;
    feedbackRef.current = { message: neutralMessage, severity: "neutral" };

    setSquatRepCount(0);
    setSquatPhase("unknown");
    setKneeAngleDisplay("--");
    setPushupRepCount(0);
    setPushupPhase("unknown");
    setElbowAngleDisplay("--");
    setPlankHoldSeconds(0);
    setPlankPostureStatus("unknown");
    setPlankAlignmentScore("--");
    setTrackingWarning(neutralWarning);
    setFeedbackMessage(neutralMessage);
    setFeedbackSeverity("neutral");
    setTrackingReadiness({
      ...emptyTrackingReadiness,
      message: "Step back so I can see your full body.",
    });
    setCameraPlacement({
      ...emptyCameraPlacement,
      message: "Place your phone so your full body fits cleanly in frame.",
    });
    setTrackingLost(false);
    setTrackingLostReason("Tracking looks stable.");
    setTrackingLostSeconds(0);
    setTrackingRecoveredAt(undefined);
    setTrackingRecentlyRecovered(false);
    setRepQualityLog([]);
    setLatestRepQuality(undefined);
    setCleanRepCount(0);
    setNeedsWorkRepCount(0);
    setPlankQualityLabel("unknown");
    setPlankQualityMessage("Hold still so I can read your posture.");
    setTrackingConfidenceAverage(0);
  }, []);

  const hasReliableLandmark = useCallback((landmark?: NormalizedLandmark | null, minVisibility = 0.45) => {
    return Boolean(landmark && (landmark.visibility ?? 0) >= minVisibility);
  }, []);

  const deriveTrackingReadiness = useCallback((landmarks?: NormalizedLandmark[] | null): TrackingReadiness => {
    if (!landmarks || landmarks.length === 0) {
      return {
        ...emptyTrackingReadiness,
        message: "Use brighter lighting and keep your body in frame.",
      };
    }

    const noseVisible = hasReliableLandmark(landmarks[0]);
    const leftShoulderVisible = hasReliableLandmark(landmarks[11]);
    const rightShoulderVisible = hasReliableLandmark(landmarks[12]);
    const leftHipVisible = hasReliableLandmark(landmarks[23]);
    const rightHipVisible = hasReliableLandmark(landmarks[24]);
    const leftKneeVisible = hasReliableLandmark(landmarks[25]);
    const rightKneeVisible = hasReliableLandmark(landmarks[26]);
    const leftAnkleVisible = hasReliableLandmark(landmarks[27]);
    const rightAnkleVisible = hasReliableLandmark(landmarks[28]);

    const shouldersVisible = leftShoulderVisible && rightShoulderVisible;
    const headVisible = noseVisible || shouldersVisible;
    const hipsVisible = leftHipVisible && rightHipVisible;
    const kneesVisible = leftKneeVisible && rightKneeVisible;
    const feetVisible = leftAnkleVisible && rightAnkleVisible;
    const fullBodyVisible = shouldersVisible && hipsVisible && kneesVisible && feetVisible;

    const requiredZones = [shouldersVisible, hipsVisible, kneesVisible, feetVisible];
    const visibleZones = requiredZones.filter(Boolean).length;
    const confidenceScore = Math.round((visibleZones / requiredZones.length) * 100);

    let message = "Tracking locked. I’ve got your full body.";
    if (!headVisible || !shouldersVisible) {
      message = "Raise the camera or step back so I can see your upper body.";
    } else if (!feetVisible) {
      message = "Step back so I can see your feet.";
    } else if (!kneesVisible) {
      message = "Step back so I can see your knees.";
    } else if (!hipsVisible) {
      message = "Shift back so I can see your hips clearly.";
    } else if (!fullBodyVisible || confidenceScore < 75) {
      message = "Use brighter lighting and keep your body in frame.";
    }

    return {
      headVisible,
      shouldersVisible,
      hipsVisible,
      kneesVisible,
      feetVisible,
      fullBodyVisible,
      confidenceScore,
      message,
    };
  }, [hasReliableLandmark]);

  const deriveCameraPlacement = useCallback(
    (landmarks: NormalizedLandmark[] | null | undefined, readiness: TrackingReadiness, mode: TrackingMode): CameraPlacement => {
      if (!landmarks || landmarks.length === 0) {
        return {
          ...emptyCameraPlacement,
          message: "Get your body in frame so I can check phone placement.",
        };
      }

      const visibleIndices = [0, 11, 12, 23, 24, 25, 26, 27, 28].filter((index) => hasReliableLandmark(landmarks[index], 0.35));
      if (visibleIndices.length < 3) {
        return {
          ...emptyCameraPlacement,
          message: "Use better lighting and keep your body in frame.",
        };
      }

      const visiblePoints = visibleIndices.map((index) => landmarks[index]);
      const xs = visiblePoints.map((point) => point.x);
      const ys = visiblePoints.map((point) => point.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const widthSpan = maxX - minX;
      const heightSpan = maxY - minY;
      const shoulderSpread = readiness.shouldersVisible ? Math.abs((landmarks[11]?.x ?? 0) - (landmarks[12]?.x ?? 0)) : 0;
      const hipSpread = readiness.hipsVisible ? Math.abs((landmarks[23]?.x ?? 0) - (landmarks[24]?.x ?? 0)) : 0;
      const averageSpread = (shoulderSpread + hipSpread) / 2;

      const tooClose =
        heightSpan > 0.82 ||
        widthSpan > 0.62 ||
        (!readiness.feetVisible && readiness.headVisible && heightSpan > 0.64);
      const tooFar = heightSpan < 0.42 && widthSpan < 0.22;
      const tooHigh = !readiness.feetVisible && readiness.headVisible;
      const tooLow = !readiness.headVisible && readiness.feetVisible;
      const likelySideView = averageSpread < 0.14;
      const likelyFrontView = averageSpread > 0.22;

      let placementScore = 100;
      if (tooClose) placementScore -= 24;
      if (tooFar) placementScore -= 24;
      if (tooHigh) placementScore -= 18;
      if (tooLow) placementScore -= 18;

      if (mode === "pushup" || mode === "plank") {
        if (!likelySideView) placementScore -= 16;
      } else if (mode === "squat") {
        if (!likelyFrontView && !likelySideView) placementScore -= 8;
      }

      placementScore = Math.max(0, Math.min(100, placementScore));

      let message = "Phone placement looks solid.";
      if (mode === "pushup") {
        if (tooClose) {
          message = "Move the phone back so I can see your full push-up line.";
        } else if (tooFar) {
          message = "Bring the phone a little closer for a clearer push-up view.";
        } else if (tooLow) {
          message = "Raise the phone slightly so I can see your shoulders and elbows.";
        } else if (tooHigh) {
          message = "Tilt the phone downward so your wrists and feet stay visible.";
        } else if (!likelySideView) {
          message = "Turn the phone to a side view so I can read elbow depth.";
        } else {
          message = "Strong side view. Keep shoulders, elbows, and wrists visible.";
        }
      } else if (mode === "plank") {
        if (tooClose) {
          message = "Move the phone back so your full plank line stays visible.";
        } else if (tooFar) {
          message = "Bring the phone closer so I can read your shoulder-to-ankle line.";
        } else if (tooLow) {
          message = "Raise the phone slightly so your head and shoulders stay in frame.";
        } else if (tooHigh) {
          message = "Tilt the phone downward so your feet and ankles stay visible.";
        } else if (!likelySideView) {
          message = "Use a side angle so I can see your shoulder, hip, and ankle line.";
        } else {
          message = "Good side view. Keep your full plank line visible.";
        }
      } else {
        if (tooClose) {
          message = "Step back or move the phone farther away for full-body squat tracking.";
        } else if (tooFar) {
          message = "Move the phone a little closer so I can read your squat depth.";
        } else if (tooLow) {
          message = "Raise the phone slightly so I can see your upper body.";
        } else if (tooHigh) {
          message = "Tilt the phone down or step back so your feet stay visible.";
        } else if (!likelyFrontView && !likelySideView) {
          message = "Square up to the camera or use a slight side angle for squats.";
        } else {
          message = "Good setup. Front or slight side view works well for squats.";
        }
      }

      return {
        tooClose,
        tooFar,
        tooLow,
        tooHigh,
        likelySideView,
        likelyFrontView,
        message,
        placementScore,
      };
    },
    [hasReliableLandmark]
  );

  const getTrackingLostReason = useCallback((readiness: TrackingReadiness, placement: CameraPlacement) => {
    if (!readiness.fullBodyVisible) {
      if (!readiness.feetVisible) {
        return "I need to see your feet again.";
      }
      if (!readiness.headVisible || !readiness.shouldersVisible) {
        return "I lost your full body. Step back into frame.";
      }
      return "I lost your full body. Step back into frame.";
    }

    if (readiness.confidenceScore < 35) {
      return "Lighting or framing is too low for reliable tracking.";
    }

    if (placement.tooClose || placement.tooFar || placement.tooHigh || placement.tooLow) {
      return "Hold still for a second so I can relock tracking.";
    }

    return "Hold still for a second so I can relock tracking.";
  }, []);

  const updateTrackingLostState = useCallback(
    (readiness: TrackingReadiness, placement: CameraPlacement, timestampMs: number) => {
      const lowConfidence = readiness.confidenceScore < 50;
      const bodyMissing = !readiness.fullBodyVisible;

      if (lowConfidence) {
        lowConfidenceStartRef.current ??= timestampMs;
      } else {
        lowConfidenceStartRef.current = null;
      }

      if (bodyMissing) {
        bodyMissingStartRef.current ??= timestampMs;
      } else {
        bodyMissingStartRef.current = null;
      }

      const lowConfidenceDuration = lowConfidenceStartRef.current ? (timestampMs - lowConfidenceStartRef.current) / 1000 : 0;
      const bodyMissingDuration = bodyMissingStartRef.current ? (timestampMs - bodyMissingStartRef.current) / 1000 : 0;
      const shouldLoseTracking =
        (lowConfidence && lowConfidenceDuration > 1.5) || (bodyMissing && bodyMissingDuration > 2);

      if (
        trackingRecoveryExpiresAtRef.current !== null &&
        Date.now() >= trackingRecoveryExpiresAtRef.current
      ) {
        trackingRecoveryExpiresAtRef.current = null;
        setTrackingRecentlyRecovered(false);
      }

      if (shouldLoseTracking) {
        const reason = getTrackingLostReason(readiness, placement);
        setTrackingLost(true);
        setTrackingLostReason(reason);
        setTrackingLostSeconds(Math.max(lowConfidenceDuration, bodyMissingDuration));
        return;
      }

      const recovered = readiness.confidenceScore > 70 && readiness.fullBodyVisible;
      if (trackingLost && recovered) {
        lowConfidenceStartRef.current = null;
        bodyMissingStartRef.current = null;
        setTrackingLost(false);
        setTrackingLostReason("Tracking looks stable.");
        setTrackingLostSeconds(0);
        const recoveredAt = Date.now();
        trackingRecoveryExpiresAtRef.current = recoveredAt + 3000;
        setTrackingRecoveredAt(recoveredAt);
        setTrackingRecentlyRecovered(true);
        return;
      }

      if (!trackingLost) {
        setTrackingLostSeconds(0);
      }
    },
    [getTrackingLostReason, trackingLost]
  );

  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    canvas.width = width;
    canvas.height = height;
    return { canvas, height, width };
  }, []);

  const drawBaseOverlay = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(96, 165, 250, 0.95)";
    context.lineWidth = 2;

    const centerX = width / 2;
    const centerY = height / 2;
    const crosshairSize = Math.min(width, height) * 0.08;

    context.beginPath();
    context.moveTo(centerX - crosshairSize, centerY);
    context.lineTo(centerX + crosshairSize, centerY);
    context.moveTo(centerX, centerY - crosshairSize);
    context.lineTo(centerX, centerY + crosshairSize);
    context.stroke();

    context.fillStyle = "rgba(15, 23, 42, 0.8)";
    context.fillRect(centerX - 78, centerY + crosshairSize + 18, 156, 32);
    context.font = "700 16px sans-serif";
    context.fillStyle = "rgba(191, 219, 254, 1)";
    context.textAlign = "center";
    context.fillText("Overlay Ready", centerX, centerY + crosshairSize + 40);
  }, []);

  const calculateAngle = useCallback((pointA: NormalizedLandmark, pointB: NormalizedLandmark, pointC: NormalizedLandmark) => {
    const vectorABX = pointA.x - pointB.x;
    const vectorABY = pointA.y - pointB.y;
    const vectorCBX = pointC.x - pointB.x;
    const vectorCBY = pointC.y - pointB.y;

    const vectorABMagnitude = Math.hypot(vectorABX, vectorABY);
    const vectorCBMagnitude = Math.hypot(vectorCBX, vectorCBY);
    if (vectorABMagnitude === 0 || vectorCBMagnitude === 0) {
      return null;
    }

    const cosine = (vectorABX * vectorCBX + vectorABY * vectorCBY) / (vectorABMagnitude * vectorCBMagnitude);
    const safeCosine = Math.min(1, Math.max(-1, cosine));
    return (Math.acos(safeCosine) * 180) / Math.PI;
  }, []);

  const getBestKneeMeasurement = useCallback((landmarks: NormalizedLandmark[]) => {
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];
    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    const leftVisibility = [leftHip, leftKnee, leftAnkle].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;
    const rightVisibility = [rightHip, rightKnee, rightAnkle].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;

    const leftAngle = leftHip && leftKnee && leftAnkle && leftVisibility >= 0.45 ? calculateAngle(leftHip, leftKnee, leftAnkle) : null;
    const rightAngle =
      rightHip && rightKnee && rightAnkle && rightVisibility >= 0.45 ? calculateAngle(rightHip, rightKnee, rightAnkle) : null;

    if (leftAngle === null && rightAngle === null) {
      return null;
    }

    if (rightAngle === null || leftVisibility >= rightVisibility) {
      return { angle: leftAngle, point: leftKnee ?? null, visibility: leftVisibility };
    }

    return { angle: rightAngle, point: rightKnee ?? null, visibility: rightVisibility };
  }, [calculateAngle]);

  const getBestElbowMeasurement = useCallback((landmarks: NormalizedLandmark[]) => {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const leftVisibility = [leftShoulder, leftElbow, leftWrist].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;
    const rightVisibility = [rightShoulder, rightElbow, rightWrist].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;

    const leftAngle =
      leftShoulder && leftElbow && leftWrist && leftVisibility >= 0.45 ? calculateAngle(leftShoulder, leftElbow, leftWrist) : null;
    const rightAngle =
      rightShoulder && rightElbow && rightWrist && rightVisibility >= 0.45 ? calculateAngle(rightShoulder, rightElbow, rightWrist) : null;

    if (leftAngle === null && rightAngle === null) {
      return null;
    }

    if (rightAngle === null || leftVisibility >= rightVisibility) {
      return { angle: leftAngle, point: leftElbow ?? null, visibility: leftVisibility };
    }

    return { angle: rightAngle, point: rightElbow ?? null, visibility: rightVisibility };
  }, [calculateAngle]);

  const getBestPlankMeasurement = useCallback((landmarks: NormalizedLandmark[]) => {
    const leftShoulder = landmarks[11];
    const leftHip = landmarks[23];
    const leftAnkle = landmarks[27];
    const rightShoulder = landmarks[12];
    const rightHip = landmarks[24];
    const rightAnkle = landmarks[28];

    const leftVisibility = [leftShoulder, leftHip, leftAnkle].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;
    const rightVisibility = [rightShoulder, rightHip, rightAnkle].reduce((sum, landmark) => sum + (landmark?.visibility ?? 0), 0) / 3;

    const leftValid = Boolean(leftShoulder && leftHip && leftAnkle && leftVisibility >= 0.45);
    const rightValid = Boolean(rightShoulder && rightHip && rightAnkle && rightVisibility >= 0.45);

    if (!leftValid && !rightValid) {
      return null;
    }

    if (!rightValid || leftVisibility >= rightVisibility) {
      return {
        shoulder: leftShoulder ?? null,
        hip: leftHip ?? null,
        ankle: leftAnkle ?? null,
        visibility: leftVisibility,
      };
    }

    return {
      shoulder: rightShoulder ?? null,
      hip: rightHip ?? null,
      ankle: rightAnkle ?? null,
      visibility: rightVisibility,
    };
  }, []);

  const setFeedbackIfChanged = useCallback((message: string, severity: FeedbackSeverity) => {
    if (feedbackRef.current.message === message && feedbackRef.current.severity === severity) {
      return;
    }

    feedbackRef.current = { message, severity };
    setFeedbackMessage(message);
    setFeedbackSeverity(severity);
  }, []);

  const recordRepQuality = useCallback(
    (entryInput: Omit<RepQualityEntry, "id" | "timestamp">) => {
      const entry: RepQualityEntry = {
        ...entryInput,
        id: repQualityIdRef.current + 1,
        timestamp: Date.now(),
      };
      repQualityIdRef.current = entry.id;

      setLatestRepQuality(entry);
      setRepQualityLog((current) => [...current.slice(-11), entry]);
      if (entry.label === "clean") {
        setCleanRepCount((count) => count + 1);
      } else {
        setNeedsWorkRepCount((count) => count + 1);
      }
    },
    []
  );

  const resetRepQualityLog = useCallback(() => {
    repQualityIdRef.current = 0;
    trackingConfidenceTotalRef.current = 0;
    trackingConfidenceSampleCountRef.current = 0;
    squatBottomAngleRef.current = null;
    pushupBottomAngleRef.current = null;
    setRepQualityLog([]);
    setLatestRepQuality(undefined);
    setCleanRepCount(0);
    setNeedsWorkRepCount(0);
    setPlankQualityLabel("unknown");
    setPlankQualityMessage("Hold still so I can read your posture.");
    setTrackingConfidenceAverage(0);
  }, []);

  const getSquatRepQuality = useCallback(
    (bottomAngle: number | null, readiness: TrackingReadiness, visibility: number | null): Omit<RepQualityEntry, "id" | "timestamp"> => {
      const goodDepthThreshold = 100;

      if (!readiness.fullBodyVisible || readiness.confidenceScore < 70) {
        return {
          mode: "squat",
          label: "lost_tracking",
          message: "I counted movement, but tracking was weak. Keep your full body in frame.",
          angle: bottomAngle ?? undefined,
          confidenceScore: readiness.confidenceScore,
        };
      }

      if (bottomAngle === null) {
        return {
          mode: "squat",
          label: "unknown",
          message: "Rep counted. I need a clearer angle next time.",
          confidenceScore: readiness.confidenceScore,
        };
      }

      if ((visibility ?? 1) < 0.58 || readiness.confidenceScore < 85) {
        return {
          mode: "squat",
          label: "unstable",
          message: "You got the rep. Stay square to the camera for a cleaner read.",
          angle: bottomAngle,
          confidenceScore: readiness.confidenceScore,
        };
      }

      if (bottomAngle <= goodDepthThreshold) {
        return {
          mode: "squat",
          label: "clean",
          message: "Clean squat. Good depth and control.",
          angle: bottomAngle,
          confidenceScore: readiness.confidenceScore,
        };
      }

      return {
        mode: "squat",
        label: "shallow",
        message: "Go a little deeper on the next rep.",
        angle: bottomAngle,
        confidenceScore: readiness.confidenceScore,
      };
    },
    []
  );

  const getPushupRepQuality = useCallback(
    (bottomAngle: number | null, readiness: TrackingReadiness, visibility: number | null): Omit<RepQualityEntry, "id" | "timestamp"> => {
      const goodDepthThreshold = 85;
      const upperBodyVisible = readiness.headVisible && readiness.shouldersVisible;

      if (!upperBodyVisible || readiness.confidenceScore < 70) {
        return {
          mode: "pushup",
          label: "lost_tracking",
          message: "I need a clearer side view of your upper body.",
          angle: bottomAngle ?? undefined,
          confidenceScore: readiness.confidenceScore,
        };
      }

      if (bottomAngle === null) {
        return {
          mode: "pushup",
          label: "unknown",
          message: "Rep counted. I need a clearer angle next time.",
          confidenceScore: readiness.confidenceScore,
        };
      }

      if ((visibility ?? 1) < 0.58 || readiness.confidenceScore < 85) {
        return {
          mode: "pushup",
          label: "unstable",
          message: "Good effort. Give me a steadier side view next rep.",
          angle: bottomAngle,
          confidenceScore: readiness.confidenceScore,
        };
      }

      if (bottomAngle <= goodDepthThreshold) {
        return {
          mode: "pushup",
          label: "clean",
          message: "Clean push-up. Good depth.",
          angle: bottomAngle,
          confidenceScore: readiness.confidenceScore,
        };
      }

      return {
        mode: "pushup",
        label: "shallow",
        message: "Lower a little more next rep.",
        angle: bottomAngle,
        confidenceScore: readiness.confidenceScore,
      };
    },
    []
  );

  const updateSquatTracking = useCallback((landmarks: NormalizedLandmark[]) => {
    const standingThreshold = 160;
    const bottomThreshold = 110;
    const measurement = getBestKneeMeasurement(landmarks);

    if (!measurement || measurement.angle === null || !measurement.point) {
      setFeedbackIfChanged("Step back so your full body is visible.", "error");
      return {
        angleLabel: "--",
        anglePoint: null,
        feedbackMessage: "Step back so your full body is visible.",
        feedbackSeverity: "error" as const,
      };
    }

    const roundedAngle = Math.round(measurement.angle);
    let nextPhase: SquatPhase = squatPhaseRef.current;

    if (measurement.visibility < 0.45) {
      nextPhase = "unknown";
    } else if (roundedAngle > standingThreshold) {
      if (reachedBottomRef.current) {
        recordRepQuality(
          getSquatRepQuality(
            squatBottomAngleRef.current,
            trackingReadinessRef.current,
            measurement.visibility
          )
        );
        repCountRef.current += 1;
        reachedBottomRef.current = false;
      }
      squatBottomAngleRef.current = null;
      nextPhase = "standing";
    } else if (roundedAngle < bottomThreshold) {
      reachedBottomRef.current = true;
      squatBottomAngleRef.current =
        squatBottomAngleRef.current === null ? roundedAngle : Math.min(squatBottomAngleRef.current, roundedAngle);
      nextPhase = "bottom";
    } else {
      squatBottomAngleRef.current =
        squatBottomAngleRef.current === null ? roundedAngle : Math.min(squatBottomAngleRef.current, roundedAngle);
      nextPhase = reachedBottomRef.current ? "rising" : "descending";
    }

    if (nextPhase === "unknown") {
      squatBottomAngleRef.current = null;
    }

    squatPhaseRef.current = nextPhase;

    let nextFeedbackMessage = "Lower slowly and keep your chest steady.";
    let nextFeedbackSeverity: FeedbackSeverity = "neutral";

    if (nextPhase === "standing" && roundedAngle < 150) {
      nextFeedbackMessage = "Stand tall to reset before the next rep.";
      nextFeedbackSeverity = "warning";
    } else if (nextPhase === "bottom" && roundedAngle >= 90 && roundedAngle <= 110) {
      nextFeedbackMessage = "Good depth. Drive up with control.";
      nextFeedbackSeverity = "good";
    } else if (nextPhase === "bottom" && roundedAngle > 110) {
      nextFeedbackMessage = "Try to sit a little lower if comfortable.";
      nextFeedbackSeverity = "warning";
    } else if (nextPhase === "rising") {
      nextFeedbackMessage = "Drive up and keep control.";
    } else if (nextPhase === "unknown") {
      nextFeedbackMessage = "Step back so your full body is visible.";
      nextFeedbackSeverity = "error";
    }

    if (measurement.visibility < 0.45) {
      nextFeedbackMessage = "Step back so your full body is visible.";
      nextFeedbackSeverity = "error";
    }

    setFeedbackIfChanged(nextFeedbackMessage, nextFeedbackSeverity);

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - displayUpdateTimeRef.current > 120) {
      displayUpdateTimeRef.current = now;
      setSquatRepCount(repCountRef.current);
      setSquatPhase(nextPhase);
      setKneeAngleDisplay(`${roundedAngle}°`);
      setTrackingWarning(
        measurement.visibility < 0.55 ? "Tracking confidence is low. Keep your hips, knees, and ankles clearly visible." : null
      );
    }

    return {
      angleLabel: `${roundedAngle}°`,
      anglePoint: measurement.point,
      feedbackMessage: nextFeedbackMessage,
      feedbackSeverity: nextFeedbackSeverity,
    };
  }, [getBestKneeMeasurement, getSquatRepQuality, recordRepQuality, setFeedbackIfChanged]);

  const updatePushupTracking = useCallback((landmarks: NormalizedLandmark[]) => {
    const upThreshold = 155;
    const bottomThreshold = 95;
    const measurement = getBestElbowMeasurement(landmarks);

    if (!measurement || measurement.angle === null || !measurement.point) {
      setFeedbackIfChanged("Step back so your upper body is visible.", "error");
      return {
        angleLabel: "--",
        anglePoint: null,
        feedbackMessage: "Step back so your upper body is visible.",
        feedbackSeverity: "error" as const,
      };
    }

    const roundedAngle = Math.round(measurement.angle);
    let nextPhase: PushupPhase = pushupPhaseRef.current;

    if (measurement.visibility < 0.45) {
      nextPhase = "unknown";
    } else if (roundedAngle > upThreshold) {
      if (reachedPushupBottomRef.current) {
        recordRepQuality(
          getPushupRepQuality(
            pushupBottomAngleRef.current,
            trackingReadinessRef.current,
            measurement.visibility
          )
        );
        pushupRepCountRef.current += 1;
        reachedPushupBottomRef.current = false;
      }
      pushupBottomAngleRef.current = null;
      nextPhase = "up";
    } else if (roundedAngle < bottomThreshold) {
      reachedPushupBottomRef.current = true;
      pushupBottomAngleRef.current =
        pushupBottomAngleRef.current === null ? roundedAngle : Math.min(pushupBottomAngleRef.current, roundedAngle);
      nextPhase = "bottom";
    } else {
      pushupBottomAngleRef.current =
        pushupBottomAngleRef.current === null ? roundedAngle : Math.min(pushupBottomAngleRef.current, roundedAngle);
      nextPhase = reachedPushupBottomRef.current ? "rising" : "descending";
    }

    if (nextPhase === "unknown") {
      pushupBottomAngleRef.current = null;
    }

    pushupPhaseRef.current = nextPhase;

    let nextFeedbackMessage = "Lock in a strong plank line.";
    let nextFeedbackSeverity: FeedbackSeverity = "neutral";

    if (nextPhase === "descending") {
      nextFeedbackMessage = "Lower with control.";
    } else if (nextPhase === "bottom") {
      nextFeedbackMessage = "Good depth. Press back up.";
      nextFeedbackSeverity = "good";
    } else if (nextPhase === "rising") {
      nextFeedbackMessage = "Press through the floor.";
    } else if (nextPhase === "unknown") {
      nextFeedbackMessage = "Step back so your upper body is visible.";
      nextFeedbackSeverity = "error";
    }

    if (measurement.visibility < 0.45) {
      nextFeedbackMessage = "Step back so your upper body is visible.";
      nextFeedbackSeverity = "error";
    }

    setFeedbackIfChanged(nextFeedbackMessage, nextFeedbackSeverity);

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - displayUpdateTimeRef.current > 120) {
      displayUpdateTimeRef.current = now;
      setPushupRepCount(pushupRepCountRef.current);
      setPushupPhase(nextPhase);
      setElbowAngleDisplay(`${roundedAngle}°`);
      setTrackingWarning(
        measurement.visibility < 0.55 ? "Tracking confidence is low. Keep your shoulders, elbows, and wrists clearly visible." : null
      );
    }

    return {
      angleLabel: `${roundedAngle}°`,
      anglePoint: measurement.point,
      feedbackMessage: nextFeedbackMessage,
      feedbackSeverity: nextFeedbackSeverity,
    };
  }, [getBestElbowMeasurement, getPushupRepQuality, recordRepQuality, setFeedbackIfChanged]);

  const updatePlankTracking = useCallback((landmarks: NormalizedLandmark[], timestampMs: number) => {
    const measurement = getBestPlankMeasurement(landmarks);

    if (!measurement || !measurement.shoulder || !measurement.hip || !measurement.ankle) {
      plankLastTimestampRef.current = null;
      plankPostureRef.current = "unknown";
      setPlankQualityLabel("lost_tracking");
      setPlankQualityMessage("Tracking is weak. Keep your full body visible.");
      setFeedbackIfChanged("Step back so your full body is visible.", "error");
      return {
        angleLabel: "--",
        anglePoint: null,
        feedbackMessage: "Step back so your full body is visible.",
        feedbackSeverity: "error" as const,
        linePoints: null,
      };
    }

    const dx = measurement.ankle.x - measurement.shoulder.x;
    const dy = measurement.ankle.y - measurement.shoulder.y;
    const lineLength = Math.hypot(dx, dy);

    if (lineLength === 0 || measurement.visibility < 0.45) {
      plankLastTimestampRef.current = null;
      plankPostureRef.current = "unknown";
      setPlankQualityLabel("lost_tracking");
      setPlankQualityMessage("Tracking is weak. Keep your full body visible.");
      setFeedbackIfChanged("Step back so your full body is visible.", "error");
      return {
        angleLabel: "--",
        anglePoint: null,
        feedbackMessage: "Step back so your full body is visible.",
        feedbackSeverity: "error" as const,
        linePoints: null,
      };
    }

    const cross = dx * (measurement.hip.y - measurement.shoulder.y) - dy * (measurement.hip.x - measurement.shoulder.x);
    const normalizedOffset = cross / lineLength;
    const absoluteOffset = Math.abs(normalizedOffset);
    const tolerance = 0.045;

    let posture: PlankPosture = "stable";
    if (normalizedOffset < -tolerance) {
      posture = "hips high";
    } else if (normalizedOffset > tolerance) {
      posture = "hips low";
    }

    plankPostureRef.current = posture;
    const score = Math.max(0, Math.min(100, Math.round(100 - (absoluteOffset / 0.14) * 100)));

    if (plankLastTimestampRef.current === null) {
      plankLastTimestampRef.current = timestampMs;
    } else {
      const deltaSeconds = Math.max(0, (timestampMs - plankLastTimestampRef.current) / 1000);
      plankHoldSecondsRef.current += deltaSeconds;
      plankLastTimestampRef.current = timestampMs;
    }

    let nextFeedbackMessage = "Strong plank line. Keep breathing.";
    let nextFeedbackSeverity: FeedbackSeverity = "good";
    let nextPlankQualityLabel: PlankQualityLabel = "stable";
    let nextPlankQualityMessage = "Stable hold. Keep breathing.";

    if (posture === "hips high") {
      nextFeedbackMessage = "Lower your hips slightly to align your body.";
      nextFeedbackSeverity = "warning";
      nextPlankQualityLabel = "hips_high";
      nextPlankQualityMessage = "Lower your hips slightly.";
    } else if (posture === "hips low") {
      nextFeedbackMessage = "Lift your hips slightly and brace your core.";
      nextFeedbackSeverity = "warning";
      nextPlankQualityLabel = "hips_low";
      nextPlankQualityMessage = "Lift your hips and brace your core.";
    } else if (!trackingReadinessRef.current.fullBodyVisible || trackingReadinessRef.current.confidenceScore < 70) {
      nextPlankQualityLabel = "lost_tracking";
      nextPlankQualityMessage = "Tracking is weak. Keep your full body visible.";
      nextFeedbackMessage = nextPlankQualityMessage;
      nextFeedbackSeverity = "warning";
    } else if (score < 80) {
      nextPlankQualityLabel = "unknown";
      nextPlankQualityMessage = "Hold still so I can read your posture.";
    }

    setPlankQualityLabel(nextPlankQualityLabel);
    setPlankQualityMessage(nextPlankQualityMessage);
    setFeedbackIfChanged(nextFeedbackMessage, nextFeedbackSeverity);

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - displayUpdateTimeRef.current > 120) {
      displayUpdateTimeRef.current = now;
      setPlankHoldSeconds(plankHoldSecondsRef.current);
      setPlankPostureStatus(posture);
      setPlankAlignmentScore(`${score}`);
      setTrackingWarning(
        measurement.visibility < 0.55 ? "Tracking confidence is low. Keep your shoulders, hips, and ankles clearly visible." : null
      );
    }

    return {
      angleLabel: `${score}`,
      anglePoint: measurement.hip,
      feedbackMessage: nextFeedbackMessage,
      feedbackSeverity: nextFeedbackSeverity,
      linePoints: {
        start: measurement.shoulder,
        end: measurement.ankle,
      },
    };
  }, [getBestPlankMeasurement, setFeedbackIfChanged]);

  const drawPose = useCallback(
    (
      context: CanvasRenderingContext2D,
      width: number,
      height: number,
      landmarks: NormalizedLandmark[],
      angleLabel?: string,
      anglePoint?: NormalizedLandmark | null,
      currentFeedbackMessage?: string,
      currentFeedbackSeverity?: FeedbackSeverity,
      linePoints?: { start: NormalizedLandmark; end: NormalizedLandmark } | null
    ) => {
      const majorConnections: Array<[number, number]> = [
        [11, 12],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
        [11, 23],
        [12, 24],
        [23, 24],
        [23, 25],
        [25, 27],
        [24, 26],
        [26, 28],
      ];

      context.strokeStyle = "rgba(34, 211, 238, 0.9)";
      context.lineWidth = 3;
      majorConnections.forEach(([startIndex, endIndex]) => {
        const start = landmarks[startIndex];
        const end = landmarks[endIndex];
        if (
          !start ||
          !end ||
          (start.visibility !== undefined && start.visibility < 0.35) ||
          (end.visibility !== undefined && end.visibility < 0.35)
        ) {
          return;
        }

        context.beginPath();
        context.moveTo(start.x * width, start.y * height);
        context.lineTo(end.x * width, end.y * height);
        context.stroke();
      });

      context.fillStyle = "rgba(125, 211, 252, 0.95)";
      [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((index) => {
        const landmark = landmarks[index];
        if (!landmark || (landmark.visibility !== undefined && landmark.visibility < 0.35)) {
          return;
        }
        context.beginPath();
        context.arc(landmark.x * width, landmark.y * height, 5, 0, Math.PI * 2);
        context.fill();
      });

      if (linePoints) {
        context.strokeStyle = "rgba(168, 85, 247, 0.95)";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(linePoints.start.x * width, linePoints.start.y * height);
        context.lineTo(linePoints.end.x * width, linePoints.end.y * height);
        context.stroke();
      }

      if (angleLabel && anglePoint) {
        const x = anglePoint.x * width;
        const y = anglePoint.y * height;
        context.fillStyle = "rgba(15, 23, 42, 0.88)";
        context.fillRect(x - 28, y - 40, 56, 24);
        context.font = "700 13px sans-serif";
        context.fillStyle = "rgba(250, 204, 21, 1)";
        context.textAlign = "center";
        context.fillText(angleLabel, x, y - 23);
      }

      if (currentFeedbackMessage) {
        const feedbackColors: Record<FeedbackSeverity, { background: string; text: string }> = {
          good: { background: "rgba(20, 83, 45, 0.92)", text: "rgba(187, 247, 208, 1)" },
          warning: { background: "rgba(113, 63, 18, 0.92)", text: "rgba(254, 240, 138, 1)" },
          error: { background: "rgba(127, 29, 29, 0.92)", text: "rgba(254, 202, 202, 1)" },
          neutral: { background: "rgba(15, 23, 42, 0.92)", text: "rgba(226, 232, 240, 1)" },
        };
        const colors = feedbackColors[currentFeedbackSeverity ?? "neutral"];
        const boxWidth = Math.min(width - 32, 320);
        const boxX = (width - boxWidth) / 2;
        const boxY = 20;
        context.fillStyle = colors.background;
        context.fillRect(boxX, boxY, boxWidth, 30);
        context.font = "700 13px sans-serif";
        context.fillStyle = colors.text;
        context.textAlign = "center";
        context.fillText(currentFeedbackMessage, width / 2, boxY + 20);
      }
    },
    []
  );

  const drawOverlay = useCallback(
    (
      landmarks?: NormalizedLandmark[],
      overlay?: {
        angleLabel: string;
        anglePoint: NormalizedLandmark | null;
        feedbackMessage?: string;
        feedbackSeverity?: FeedbackSeverity;
        linePoints?: { start: NormalizedLandmark; end: NormalizedLandmark } | null;
      }
    ) => {
      const synced = syncCanvasSize();
      if (!synced) return;

      const context = synced.canvas.getContext("2d");
      if (!context) return;

      drawBaseOverlay(context, synced.width, synced.height);
      if (landmarks && landmarks.length > 0) {
        drawPose(
          context,
          synced.width,
          synced.height,
          landmarks,
          overlay?.angleLabel,
          overlay?.anglePoint,
          overlay?.feedbackMessage,
          overlay?.feedbackSeverity,
          overlay?.linePoints
        );
      }
    },
    [drawBaseOverlay, drawPose, syncCanvasSize]
  );

  const stopAnimationLoop = useCallback(() => {
    if (animationFrameRef.current !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastVideoTimeRef.current = -1;
  }, []);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    stopAnimationLoop();

    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
      poseLandmarkerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsCameraRunning(false);
    setStatusLabel("Camera Off");
    resetTrackingState(selectedMode);
  }, [resetTrackingState, selectedMode, stopAnimationLoop]);

  const loadPoseLandmarker = useCallback(async () => {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks("/mediapipe");

    return vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: "/models/pose_landmarker_lite.task",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }, []);

  const startPoseLoop = useCallback(() => {
    if (typeof window === "undefined") return;
    stopAnimationLoop();

    const step = () => {
      const video = videoRef.current;
      const detector = poseLandmarkerRef.current;

      if (!video || !detector || !streamRef.current) {
        animationFrameRef.current = null;
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const timestampMs = performance.now();
          const result = detector.detectForVideo(video, timestampMs);
          const landmarks = result.landmarks[0];
          const readiness = deriveTrackingReadiness(landmarks);
          const placement = deriveCameraPlacement(landmarks, readiness, selectedMode);
          trackingReadinessRef.current = readiness;
          cameraPlacementRef.current = placement;
          trackingConfidenceTotalRef.current += readiness.confidenceScore;
          trackingConfidenceSampleCountRef.current += 1;
          setTrackingConfidenceAverage(
            Math.round(trackingConfidenceTotalRef.current / trackingConfidenceSampleCountRef.current)
          );
          setTrackingReadiness(readiness);
          setCameraPlacement(placement);
          updateTrackingLostState(readiness, placement, timestampMs);

          if (landmarks && landmarks.length > 0) {
            if (selectedMode === "squat") {
              const overlay = updateSquatTracking(landmarks);
              drawOverlay(landmarks, overlay);
            } else if (selectedMode === "pushup") {
              const overlay = updatePushupTracking(landmarks);
              drawOverlay(landmarks, overlay);
            } else {
              const overlay = updatePlankTracking(landmarks, timestampMs);
              drawOverlay(landmarks, overlay);
            }
          } else {
            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            if (now - displayUpdateTimeRef.current > 120) {
              displayUpdateTimeRef.current = now;
              setSquatPhase("unknown");
              setKneeAngleDisplay("--");
              setPushupPhase("unknown");
              setElbowAngleDisplay("--");
              setPlankPostureStatus("unknown");
              setPlankAlignmentScore("--");
              setTrackingWarning(
                selectedMode === "squat"
                  ? "No pose detected. Step back until your full body is visible."
                  : selectedMode === "pushup"
                    ? "No pose detected. Step back until your upper body is visible."
                    : "No pose detected. Step back until your full body is visible."
              );
            }

            if (selectedMode === "plank") {
              plankLastTimestampRef.current = null;
            }

            setFeedbackIfChanged(
              selectedMode === "squat"
                ? "Step back so your full body is visible."
                : selectedMode === "pushup"
                  ? "Step back so your upper body is visible."
                  : "Step back so your full body is visible.",
              "error"
            );
            setTrackingReadiness({
              ...emptyTrackingReadiness,
              message: "Use brighter lighting and keep your body in frame.",
            });
            trackingReadinessRef.current = {
              ...emptyTrackingReadiness,
              message: "Use brighter lighting and keep your body in frame.",
            };
            const emptyPlacement = {
              ...emptyCameraPlacement,
              message: "Get your body in frame so I can check phone placement.",
            };
            cameraPlacementRef.current = emptyPlacement;
            setCameraPlacement(emptyPlacement);
            updateTrackingLostState(
              {
                ...emptyTrackingReadiness,
                message: "Use brighter lighting and keep your body in frame.",
              },
              emptyPlacement,
              timestampMs
            );
            setPlankQualityLabel("lost_tracking");
            setPlankQualityMessage("Tracking is weak. Keep your full body visible.");
            drawOverlay();
          }
        } else {
          drawOverlay();
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(step);
    };

    animationFrameRef.current = window.requestAnimationFrame(step);
  }, [
    deriveTrackingReadiness,
    deriveCameraPlacement,
    drawOverlay,
    selectedMode,
    setFeedbackIfChanged,
    stopAnimationLoop,
    updatePlankTracking,
    updatePushupTracking,
    updateSquatTracking,
    updateTrackingLostState,
  ]);

  const startCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Camera access is not available in this browser.");
      setStatusLabel("Camera Error");
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    try {
      setErrorMessage(null);
      stopCamera();
      requestIdRef.current = currentRequestId;
      resetTrackingState(selectedMode);
      setStatusLabel("Camera Starting...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (requestIdRef.current !== currentRequestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setStatusLabel("Camera Error");
        setErrorMessage("Camera preview could not attach to the video element.");
        return;
      }

      video.srcObject = stream;
      await video.play();
      drawOverlay();
      setIsCameraRunning(true);
      setStatusLabel("Pose Model Loading...");

      const detector = await loadPoseLandmarker();
      if (requestIdRef.current !== currentRequestId) {
        detector.close();
        return;
      }

      poseLandmarkerRef.current = detector;
      startPoseLoop();
      setStatusLabel("Pose Tracking Active");
    } catch (error) {
      stopCamera();
      setStatusLabel("Camera Error");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setErrorMessage("Camera permission was blocked. Enable camera access in your browser settings and try again.");
        return;
      }
      setErrorMessage("Camera or pose tracking could not start on this device.");
    }
  }, [drawOverlay, loadPoseLandmarker, resetTrackingState, selectedMode, startPoseLoop, stopCamera]);

  const latestIssue: LatestIssueLabel =
    latestRepQuality?.label === "shallow"
      ? "shallow"
      : latestRepQuality?.label === "lost_tracking"
        ? "lost_tracking"
        : latestRepQuality?.label === "unstable"
          ? "unstable"
          : plankQualityLabel === "hips_high"
            ? "hips_high"
            : plankQualityLabel === "hips_low"
              ? "hips_low"
              : plankQualityLabel === "lost_tracking"
                ? "lost_tracking"
                : null;

  const bestCue =
    latestIssue === "shallow"
      ? "Go a little deeper on the next rep."
      : latestIssue === "lost_tracking"
        ? "Step back before you start the next set."
        : latestIssue === "unstable"
          ? "Slow down and control the movement."
          : latestIssue === "hips_high"
            ? "Lower your hips slightly and keep breathing."
            : latestIssue === "hips_low"
              ? "Lift your hips and brace your core."
              : latestRepQuality?.label === "clean"
                ? latestRepQuality.message
                : plankQualityLabel === "stable"
                  ? "Strong line. Keep breathing."
                  : "Keep your full body visible and move with control.";

  useEffect(() => {
    if (!isCameraRunning) {
      setFeedbackIfChanged(
        selectedMode === "squat"
          ? "Start camera to begin squat form feedback."
          : selectedMode === "pushup"
            ? "Start camera to begin push-up form feedback."
            : "Start camera to begin plank posture tracking.",
        "neutral"
      );
    }
  }, [isCameraRunning, selectedMode, setFeedbackIfChanged]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetTrackingState(selectedMode);
  }, [resetTrackingState, selectedMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
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
    repQualityLog,
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
  };
}
