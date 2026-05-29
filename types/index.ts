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
  | "Calm Coach"
  | "Drill Coach"
  | "Anime Warrior Coach"
  | "Funny Coach"
  | "Dominican Hype Coach";

export type CoachAvatar = "Nova" | "Atlas";

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
