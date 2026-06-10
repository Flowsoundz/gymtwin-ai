export type CoachBrainMood =
  | "idle"
  | "listening"
  | "coaching"
  | "good"
  | "warning"
  | "error"
  | "celebrating";

export type CoachAnimationHint =
  | "idle"
  | "talking"
  | "listening"
  | "pointing"
  | "thumbs_up"
  | "warning"
  | "celebrate";

export type CoachBrainInput = {
  selectedAvatarName: string;
  screenContext:
    | "landing"
    | "setup"
    | "preview"
    | "player"
    | "camera_sandbox"
    | "summary"
    | "progress"
    | "settings";
  isVoiceListening?: boolean;
  isCameraActive?: boolean;
  cameraStatusLabel?: string;
  trackingConfidence?: number;
  fullBodyVisible?: boolean;
  trackingReadinessMessage?: string;
  trackingLost?: boolean;
  trackingLostReason?: string;
  trackingRecoveredAt?: number;
  placementScore?: number;
  cameraPlacementMessage?: string;
  likelyFrontView?: boolean;
  likelySideView?: boolean;
  bodyScanConfidence?: number;
  bodyScanMessage?: string;
  postureAlignmentScore?: number;
  trackingMode?: "squat" | "pushup" | "plank" | "lunge" | "curl";
  latestRepQualityLabel?: "clean" | "shallow" | "unstable" | "lost_tracking" | "unknown";
  latestRepQualityMessage?: string;
  cleanRepCount?: number;
  needsWorkRepCount?: number;
  latestIssue?: "shallow" | "lost_tracking" | "unstable" | "hips_high" | "hips_low" | null;
  bestCue?: string;
  plankQualityLabel?: "stable" | "hips_high" | "hips_low" | "lost_tracking" | "unknown";
  plankQualityMessage?: string;
  phase?: string;
  reps?: number;
  holdSeconds?: number;
  angleLabel?: string;
  formFeedback?: string;
  feedbackSeverity?: "good" | "warning" | "error" | "neutral";
  workoutScore?: number;
  formScore?: number;
  xpEarned?: number;
  isWorkoutComplete?: boolean;
  // Coach memory — populated from workout history
  totalSessionsCompleted?: number;
  sessionStreak?: number;
  lastSessionScore?: number;
  lastSessionFormScore?: number;
  lastSessionPRs?: Array<{ exerciseName: string; prType: string; prLabel: string }>;
  currentSessionPRs?: Array<{ exerciseName: string; prType: string; prLabel: string }>;
};

export type CoachBrainOutput = {
  mood: CoachBrainMood;
  message: string;
  shouldSpeak: boolean;
  animationHint: CoachAnimationHint;
};

function hasSafetySignal(formFeedback?: string) {
  const text = formFeedback?.toLowerCase() ?? "";
  return text.includes("pain") || text.includes("stop") || text.includes("error");
}

function normalizePhase(phase?: string) {
  return phase?.trim().toLowerCase() ?? "";
}

function getCameraCoachingMessage(input: CoachBrainInput) {
  const phase = normalizePhase(input.phase);

  if (input.trackingMode === "squat") {
    if (phase.includes("desc")) return "Control the drop. Keep your chest tall.";
    if (phase.includes("bottom")) return "Good depth. Drive back up.";
    if (phase.includes("ris")) return "Push through your heels.";
    if (phase.includes("stand") || phase.includes("top")) return "Reset strong. Own the next rep.";
  }

  if (input.trackingMode === "pushup") {
    if (phase.includes("desc")) return "Lower with control.";
    if (phase.includes("bottom")) return "Good depth. Press through the floor.";
    if (phase.includes("ris")) return "Strong press. Keep your core locked.";
    if (phase === "up" || phase.includes("top")) return "Reset your plank line.";
  }

  if (input.trackingMode === "plank") {
    if (phase.includes("stable")) return "Strong line. Keep breathing.";
    if (phase.includes("hips high")) return "Lower your hips slightly.";
    if (phase.includes("hips low")) return "Lift your hips and brace your core.";
    return "Hold still so I can read your posture.";
  }

  if (input.trackingMode === "lunge") {
    if (phase.includes("desc")) return "Control the drop. Keep your torso upright.";
    if (phase.includes("bottom")) return "Good depth. Drive through your front heel.";
    if (phase.includes("ris")) return "Push back up with control.";
    if (phase.includes("stand")) return "Reset and step back in.";
  }

  if (input.trackingMode === "curl") {
    if (phase.includes("curl")) return "Keep your elbow pinned. Curl with control.";
    if (phase.includes("top")) return "Squeeze at the top.";
    if (phase.includes("lower")) return "Lower slowly. Control the negative.";
    if (phase.includes("extend")) return "Full extension before the next rep.";
  }

  return "Stay sharp. I’m tracking your movement.";
}

function getSeverityState(feedbackSeverity?: CoachBrainInput["feedbackSeverity"]) {
  if (feedbackSeverity === "good") {
    return { mood: "good" as const, animationHint: "thumbs_up" as const };
  }

  if (feedbackSeverity === "warning") {
    return { mood: "warning" as const, animationHint: "pointing" as const };
  }

  return { mood: "coaching" as const, animationHint: "talking" as const };
}

function getMemoryGreeting(input: CoachBrainInput): string | null {
  const { totalSessionsCompleted, sessionStreak, lastSessionScore, lastSessionFormScore, lastSessionPRs } = input;

  if (totalSessionsCompleted === 0 || totalSessionsCompleted == null) return null;

  if (sessionStreak && sessionStreak >= 3) {
    return `${sessionStreak} sessions in a row. That kind of consistency is how you actually change.`;
  }

  if (lastSessionPRs && lastSessionPRs.length > 0) {
    const pr = lastSessionPRs[0];
    return `Last session you hit a PR on ${pr.exerciseName}. Let's build on that.`;
  }

  if (lastSessionScore != null && lastSessionFormScore != null) {
    if (lastSessionScore >= 90 && lastSessionFormScore >= 85) {
      return `Last session was elite — ${lastSessionScore} score and clean form. Let's match it.`;
    }
    if (lastSessionFormScore < 70) {
      return `Form was the weak point last session. Let's clean that up today.`;
    }
    if (lastSessionScore >= 75) {
      return `Strong session last time — ${lastSessionScore} overall. Keep stacking.`;
    }
  }

  if (totalSessionsCompleted === 1) return "Second session. This is where the habit starts.";
  if (totalSessionsCompleted < 5) return `Session ${totalSessionsCompleted + 1}. You're building real momentum.`;

  return null;
}

export function getCoachBrainResponse(input: CoachBrainInput): CoachBrainOutput {
  if (input.isVoiceListening) {
    return {
      mood: "listening",
      message: "I’m listening. Say a command when you’re ready.",
      shouldSpeak: false,
      animationHint: "listening",
    };
  }

  if (hasSafetySignal(input.formFeedback)) {
    return {
      mood: "error",
      message: "Safety first. Stop and reset before you continue.",
      shouldSpeak: false,
      animationHint: "warning",
    };
  }

  if (input.isCameraActive && input.trackingLost) {
    return {
      mood: "warning",
      message: input.trackingLostReason ?? "I lost tracking. Step back into frame and hold still.",
      shouldSpeak: false,
      animationHint: "warning",
    };
  }

  if (
    input.isCameraActive &&
    input.trackingRecoveredAt &&
    Date.now() - input.trackingRecoveredAt < 3000
  ) {
    return {
      mood: "good",
      message: "Tracking recovered. Let’s keep going.",
      shouldSpeak: false,
      animationHint: "thumbs_up",
    };
  }

  if (input.isWorkoutComplete) {
    const completionMessage =
      (input.workoutScore ?? 0) >= 90
        ? "Elite session. You earned that one."
        : (input.workoutScore ?? 0) >= 75
          ? "Strong work. Keep stacking progress."
          : "Session complete. Consistency wins.";

    return {
      mood: "celebrating",
      message: completionMessage,
      shouldSpeak: true,
      animationHint: "celebrate",
    };
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    input.fullBodyVisible === false
  ) {
    return {
      mood: "warning",
      message: input.trackingReadinessMessage ?? "Step back so I can see your full body.",
      shouldSpeak: false,
      animationHint: "pointing",
    };
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    (input.placementScore ?? 100) < 70
  ) {
    return {
      mood: "warning",
      message: input.cameraPlacementMessage ?? "Adjust your phone placement for a clearer view.",
      shouldSpeak: false,
      animationHint: input.likelySideView === false ? "pointing" : "warning",
    };
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    (input.bodyScanConfidence ?? 0) < 45 &&
    input.fullBodyVisible !== false &&
    (input.placementScore ?? 100) >= 70
  ) {
    return {
      mood: "warning",
      message: input.bodyScanMessage ?? "Step back and stand tall for a cleaner body scan.",
      shouldSpeak: false,
      animationHint: "pointing",
    };
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    input.trackingMode === "plank" &&
    input.plankQualityLabel
  ) {
    if (input.plankQualityLabel === "stable") {
      return {
        mood: input.feedbackSeverity === "good" ? "good" : "coaching",
        message: input.plankQualityMessage ?? "Stable hold. Keep breathing.",
        shouldSpeak: false,
        animationHint: input.feedbackSeverity === "good" ? "thumbs_up" : "talking",
      };
    }

    if (
      input.plankQualityLabel === "hips_high" ||
      input.plankQualityLabel === "hips_low" ||
      input.plankQualityLabel === "lost_tracking"
    ) {
      return {
        mood: "warning",
        message: input.plankQualityMessage ?? "Adjust your position so I can coach the hold.",
        shouldSpeak: false,
        animationHint: input.plankQualityLabel === "lost_tracking" ? "pointing" : "warning",
      };
    }
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    input.latestRepQualityLabel
  ) {
    if (input.latestRepQualityLabel === "clean") {
      return {
        mood: "good",
        message: input.latestRepQualityMessage ?? "Clean rep.",
        shouldSpeak: false,
        animationHint: "thumbs_up",
      };
    }

    if (
      input.latestRepQualityLabel === "shallow" ||
      input.latestRepQualityLabel === "unstable" ||
      input.latestRepQualityLabel === "lost_tracking"
    ) {
      const coachedIssueMessage =
        input.latestIssue === "shallow"
          ? "Next set, go a little deeper."
          : input.latestIssue === "lost_tracking"
            ? "Next set, step back before you start."
            : input.latestIssue === "unstable"
              ? "Next set, slow down and control the movement."
              : input.latestRepQualityMessage ?? input.bestCue ?? "Adjust your position and try again.";
      return {
        mood: "warning",
        message: coachedIssueMessage,
        shouldSpeak: false,
        animationHint: input.latestRepQualityLabel === "lost_tracking" ? "pointing" : "warning",
      };
    }
  }

  if (
    input.isCameraActive &&
    input.cameraStatusLabel === "Pose Tracking Active" &&
    input.trackingMode
  ) {
    if ((input.bodyScanConfidence ?? 0) >= 80) {
      return {
        mood: "coaching",
        message: input.bodyScanMessage ?? "Body scan ready. We can track visual progress over time.",
        shouldSpeak: false,
        animationHint: "talking",
      };
    }

    const severityState = getSeverityState(input.feedbackSeverity);

    return {
      mood: severityState.mood,
      message: getCameraCoachingMessage(input),
      shouldSpeak: false,
      animationHint: severityState.animationHint,
    };
  }

  if (input.screenContext === "player" && !input.isCameraActive) {
    const memoryGreeting = getMemoryGreeting(input);
    if (memoryGreeting) {
      return {
        mood: "coaching",
        message: memoryGreeting,
        shouldSpeak: false,
        animationHint: "talking",
      };
    }
  }

  if (input.isWorkoutComplete && input.currentSessionPRs && input.currentSessionPRs.length > 0) {
    const pr = input.currentSessionPRs[0];
    return {
      mood: "celebrating",
      message: `PR on ${pr.exerciseName}. ${input.currentSessionPRs.length > 1 ? `${input.currentSessionPRs.length} PRs this session.` : "Write that down."}`,
      shouldSpeak: true,
      animationHint: "celebrate",
    };
  }

  return {
    mood: "idle",
    message: "I’m ready when you are.",
    shouldSpeak: false,
    animationHint: "idle",
  };
}
