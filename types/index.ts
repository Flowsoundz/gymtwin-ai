export type AppScreen =
  | "auth"
  | "onboarding"
  | "landing"
  | "settings"
  | "model_lab"
  | "camera_sandbox"
  | "setup"
  | "preview"
  | "workout_plan"
  | "player"
  | "summary"
  | "progress"
  | "workout_detail"
  | "safety_stop"
  | "nutrition"
  | "food_camera";

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
export type EnergyRating = "low" | "moderate" | "high";
export type SorenessRating = "none" | "mild" | "moderate" | "severe";

export interface TraineeStats {
  workoutsCompleted: number;
  streak: number;
  lastWorkoutDate: string | null;
  totalMinutes: number;
  totalXp: number;
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

export type CoachTalkativeness = "quiet" | "normal" | "hype";
export type WorkoutAudioMode = "external" | "flowsoundz_radio";
export type WorkoutAudioLevel = "low" | "normal" | "high";

export interface AvatarDisplaySettings {
  mode: AvatarDisplayMode;
  show3DCoach: boolean;
  compactInWorkout: boolean;
  showDuringCamera: boolean;
  showExerciseDemos: boolean;
  minimalCameraHud: boolean;
  countdownAudioEnabled: boolean;
  talkativeness: CoachTalkativeness;
  repCountingEnabled: boolean;
  workoutAudioMode: WorkoutAudioMode;
  coachVoiceVolume: WorkoutAudioLevel;
  cueVolume: WorkoutAudioLevel;
  duckExternalMusic: boolean;
  // Master switch for ALL GymTwin audio output (coach voice + sound cues).
  // Off by default so external music apps (Spotify/Apple Music/etc.) keep
  // playing — on iOS web there's no way to mix, so emitting any audio would
  // stop the user's music. Turning this on lets the coach speak aloud (and
  // will interrupt other audio on iPhone).
  coachAudioEnabled: boolean;
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

export type WeeklyPlanDayType =
  | "push"
  | "pull"
  | "legs"
  | "full_body"
  | "conditioning"
  | "core_mobility"
  | "recovery"
  | "rest";

export interface WeeklyPlanDayConfig {
  goal: WorkoutGoal;
  level: WorkoutLevel;
  equipment: Equipment;
  sessionLength: string;
  focusLabel: string;
  muscleGroups: string[];
}

export interface WeeklyPlanDay {
  id: string;
  dayLabel: string;
  focus: string;
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendedWorkout: string;
  completed: boolean;
  isRestDay?: boolean;
  splitType?: WeeklyPlanDayType;
  workoutConfig?: WeeklyPlanDayConfig;
}

export interface WeeklyPlan {
  id: string;
  createdAt: string;
  goal?: string;
  level?: string;
  equipment?: string;
  days: WeeklyPlanDay[];
  splitName?: string;
  isDeloadWeek?: boolean;
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
  energyRating?: EnergyRating;
  sorenessRating?: SorenessRating;
  sorenessAreas?: string[];
  completedAt: string;
  workoutScore?: number;
  formScore?: number;
  xpEarned?: number;
  cleanRepEstimate?: number;
  coachNote?: string;
  muscleGroups?: string[];
  sessionPRs?: Array<{ exerciseName: string; prType: string; prLabel: string }>;
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

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  timestamp: string;
}

export interface DailyNutritionLog {
  date: string;
  consumed: FoodItem[];
  burnedCalculated: number;
}

export interface PostWorkoutFeedback {
  difficultyFeedback: "too_easy" | "perfect" | "too_hard";
  energyRating: EnergyRating;
  sorenessRating: SorenessRating;
  sorenessAreas: string[];
}

export interface WorkoutAdjustments {
  volumeModifier: number;
  repModifier: number;
  restModifier: number;
  excludedMuscleGroups: string[];
  deprioritizedGroups: string[];
  intensityNote: string;
  isRecoverySession: boolean;
}

export interface AdaptiveProfile {
  recentDifficultyFeedback: ("too_easy" | "perfect" | "too_hard")[];
  recentEnergyRatings: EnergyRating[];
  recentSorenessRatings: SorenessRating[];
  activeSorenessAreas: string[];
  lastWorkoutDate: string | null;
  consecutiveTooHardSessions: number;
  consecutiveTooEasySessions: number;
  totalFeedbackSubmissions: number;
}

export interface PersonalizedExercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  rest: number;
  equipment: string;
  muscleGroup: string;
  coachingCue: string;
  easierOption: string;
  harderOption: string;
}

export interface PersonalizedWorkoutPlan {
  title: string;
  estimatedDuration: number;
  goalFocus: string;
  difficulty: string;
  warmup: PersonalizedExercise[];
  mainBlock: PersonalizedExercise[];
  cooldown: PersonalizedExercise[];
  coachNotes: string;
  progressionIntent: string;
}

export interface ExerciseLogEntry {
  id: string;
  exerciseName: string;
  sessionId: string;
  completedAt: string;
  setNumber: number;
  repsCompleted: number;
  weightLbs: number | null;
  durationSeconds: number | null;
  estimatedOneRepMax: number | null;
}

export interface ExercisePR {
  exerciseName: string;
  bestReps: number;
  bestWeightLbs: number | null;
  bestEstimated1RM: number | null;
  achievedAt: string;
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
