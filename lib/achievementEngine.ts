import type { AchievementBadge, TraineeStats, WorkoutSummaryData } from "@/types";

type AchievementInput = {
  userStats: TraineeStats | null | undefined;
  workoutHistory: WorkoutSummaryData[] | null | undefined;
  lastWorkoutSummary: WorkoutSummaryData | null | undefined;
};

function asFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasCameraSessionData(session: WorkoutSummaryData | null | undefined): boolean {
  if (!session) return false;
  return typeof session.formScore === "number" || typeof session.cleanRepEstimate === "number";
}

export function getAchievementBadges({
  userStats,
  workoutHistory,
  lastWorkoutSummary,
}: AchievementInput): AchievementBadge[] {
  const safeHistory = Array.isArray(workoutHistory) ? workoutHistory : [];
  const safeStats = userStats ?? {
    workoutsCompleted: 0,
    streak: 0,
    lastWorkoutDate: null,
    totalMinutes: 0,
    totalXp: 0,
  };

  const allSessions = lastWorkoutSummary
    ? [lastWorkoutSummary, ...safeHistory.filter((session) => session.id !== lastWorkoutSummary.id)]
    : safeHistory;

  const totalXp = allSessions.reduce((sum, session) => sum + asFiniteNumber(session.xpEarned), 0);
  const hasCameraCoachSession = allSessions.some(hasCameraSessionData);
  const hasCleanRepStarter = allSessions.some((session) => asFiniteNumber(session.cleanRepEstimate) >= 10);
  const hasHighScore = allSessions.some((session) => asFiniteNumber(session.workoutScore) >= 90);

  return [
    {
      id: "first_workout",
      title: "First Workout",
      description: "Complete your first GymTwin session.",
      icon: "🏁",
      unlocked: asFiniteNumber(safeStats.workoutsCompleted) >= 1,
    },
    {
      id: "first_camera_coach",
      title: "First Camera Coach",
      description: "Finish a session that records camera-based form data.",
      icon: "📹",
      unlocked: hasCameraCoachSession,
    },
    {
      id: "three_day_streak",
      title: "Three Day Streak",
      description: "Train for 3 days in a row.",
      icon: "🔥",
      unlocked: asFiniteNumber(safeStats.streak) >= 3,
    },
    {
      id: "hundred_xp",
      title: "100 XP Club",
      description: "Stack 100 total XP across your workout history.",
      icon: "⚡",
      unlocked: totalXp >= 100,
    },
    {
      id: "clean_rep_starter",
      title: "Clean Rep Starter",
      description: "Record at least 10 estimated clean reps in one session.",
      icon: "✅",
      unlocked: hasCleanRepStarter,
    },
    {
      id: "squat_tracker",
      title: "Squat Tracker",
      description: "Use squat tracking in a saved workout session.",
      icon: "🦵",
      unlocked: false,
    },
    {
      id: "pushup_tracker",
      title: "Push-Up Tracker",
      description: "Use push-up tracking in a saved workout session.",
      icon: "💪",
      unlocked: false,
    },
    {
      id: "plank_tracker",
      title: "Plank Tracker",
      description: "Use plank tracking in a saved workout session.",
      icon: "🧱",
      unlocked: false,
    },
    {
      id: "high_score",
      title: "High Score",
      description: "Hit a workout score of 90 or higher.",
      icon: "🌟",
      unlocked: hasHighScore,
    },
  ];
}
