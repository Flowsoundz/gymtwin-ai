export type AppScreen =
  | "landing"
  | "settings"
  | "model_lab"
  | "camera_sandbox"
  | "setup"
  | "preview"
  | "player"
  | "summary"
  | "progress"
  | "workout_detail"
  | "safety_stop";

export type CoachName =
  | "Supportive"
  | "Intense"
  | "Motivational"
  | "Playful"
  | "High Energy";

export type CoachAvatar = "Nova" | "Atlas";
export type AvatarDisplayMode =
  | "coach_card"
  | "floating_overlay"
  | "camera_corner"
  | "hidden";

export type WorkoutGoal = "Lose weight" | "Build muscle" | "Tone" | "Mobility" | "Stamina";
export type WorkoutLevel = "Beginner" | "Intermediate" | "Advanced";
export type Equipment = "None" | "Dumbbells" | "Resistance Bands" | "Bench";
export type DifficultyFeedback = "too_easy" | "perfect" | "too_hard" | null;

export interface TraineeStats {
  workoutsCompleted: number;
  streak: number;
  lastWorkoutDate: string | null;
  totalMinutes: number;
}

export interface BodyProfile {
  heightInches?: number;
  weightLbs?: number;
  goalWeightLbs?: number;
  age?: number;
  sex?: "male" | "female" | "prefer_not_to_say";
  activityGoal?: string;
  lastUpdated?: string;
}

export interface AvatarDisplaySettings {
  mode: AvatarDisplayMode;
  show3DCoach: boolean;
  compactInWorkout: boolean;
  showDuringCamera: boolean;
  showExerciseDemos: boolean;
  minimalCameraHud: boolean;
}

export type AvatarAnimationCategory =
  | "idle"
  | "reaction"
  | "conversation"
  | "workout_demo"
  | "celebration"
  | "dance";

export interface AvatarAnimationClip {
  id: string;
  label: string;
  category: AvatarAnimationCategory;
  animationHint:
    | "idle"
    | "talking"
    | "listening"
    | "pointing"
    | "thumbs_up"
    | "warning"
    | "celebrate";
  filePath?: string;
  embeddedClipName?: string;
  isPremium?: boolean;
  isAvailable: boolean;
  description: string;
}

export type AvatarCoachSurface =
  | "landing"
  | "workout_tracking"
  | "camera_setup"
  | "summary"
  | "progress"
  | "model_lab";

export type AvatarCoachRole =
  | "presence"
  | "demo"
  | "warning"
  | "encouragement"
  | "celebration"
  | "setup";

export interface BodyScanEstimate {
  shoulderWidthRatio?: number;
  hipWidthRatio?: number;
  shoulderToHipRatio?: number;
  visibleHeightRatio?: number;
  postureAlignmentScore?: number;
  scanConfidence?: number;
  message: string;
}

export interface WeeklyPlanDay {
  id: string;
  dayLabel: string;
  focus: string;
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendedWorkout: string;
  completed: boolean;
}

export interface WeeklyPlan {
  id: string;
  createdAt: string;
  goal?: string;
  level?: string;
  equipment?: string;
  days: WeeklyPlanDay[];
}

export type AchievementBadgeId =
  | "first_workout"
  | "first_camera_coach"
  | "three_day_streak"
  | "hundred_xp"
  | "clean_rep_starter"
  | "squat_tracker"
  | "pushup_tracker"
  | "plank_tracker"
  | "high_score";

export interface AchievementBadge {
  id: AchievementBadgeId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface CoachAdaptationRecommendation {
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  suggestedAction: string;
  reason: string;
}

export interface DifficultyAdjustmentRecommendation {
  direction: "increase" | "decrease" | "maintain" | "form_focus" | "recovery";
  title: string;
  message: string;
  adjustmentLabel: string;
  reason: string;
}

export interface WorkoutSummaryData {
  id: string;
  goal: WorkoutGoal;
  level: WorkoutLevel;
  equipment: Equipment;
  sessionLength: string;
  actualSessionMinutes: number;
  exerciseCount: number;
  totalSets: number;
  estimatedReps: number;
  coach: CoachName;
  difficultyFeedback: DifficultyFeedback;
  completedAt: string;
  workoutScore?: number;
  formScore?: number;
  xpEarned?: number;
  cleanRepEstimate?: number;
  coachNote?: string;
}

export interface WorkoutMovement {
  id: string;
  name: string;
  category: "warmup" | "legs" | "upper body" | "core" | "cardio" | "mobility" | "cooldown";
  compatibleGoals: WorkoutGoal[];
  compatibleLevels: WorkoutLevel[];
  compatibleEquipment: Equipment[];
  baseReps: number;
  sets: number;
  restPeriod: number;
  activeSeconds: number;
  formGuide: string;
  breathingCue: string;
  phase: "warmup" | "core" | "cooldown";
}

export interface ActiveSessionData {
  activeRoutine: WorkoutMovement[];
  movementIndex: number;
  workingSet: number;
  currentReps: number;
  totalAccumulatedReps: number;
  isRestPhase: boolean;
  restCountdown: number;
  exerciseCountdown: number;
  selectedGoal: WorkoutGoal;
  selectedLevel: WorkoutLevel;
  selectedEquipment: Equipment;
  sessionLength: string;
  selectedCoach: CoachName;
  sessionStartedAt: number | null;
  displayedSpeech: string;
}
