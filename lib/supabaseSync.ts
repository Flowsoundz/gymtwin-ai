"use client";

import { supabase } from "@/lib/supabase";
import type {
  AvatarDisplaySettings,
  BodyProfile,
  TraineeStats,
  WeeklyPlan,
  WorkoutSummaryData,
} from "@/types";

// ── Settings ──────────────────────────────────────────────────────────────────

export async function pushSettingsToSupabase(
  userId: string,
  settings: AvatarDisplaySettings
): Promise<void> {
  await supabase.from("user_settings").upsert({
    id: userId,
    avatar: settings.mode,
    show_3d_coach: settings.show3DCoach,
    compact_in_workout: settings.compactInWorkout,
    show_during_camera: settings.showDuringCamera,
    show_exercise_demos: settings.showExerciseDemos,
    minimal_camera_hud: settings.minimalCameraHud,
    countdown_audio_enabled: settings.countdownAudioEnabled,
    talkativeness: settings.talkativeness,
    rep_counting_enabled: settings.repCountingEnabled,
    workout_audio_mode: settings.workoutAudioMode,
    coach_voice_volume: settings.coachVoiceVolume,
    cue_volume: settings.cueVolume,
    duck_external_music: settings.duckExternalMusic,
    updated_at: new Date().toISOString(),
  });
}

export async function pullSettingsFromSupabase(
  userId: string
): Promise<Partial<AvatarDisplaySettings> | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    mode: data.avatar ?? "floating_overlay",
    show3DCoach: data.show_3d_coach ?? true,
    compactInWorkout: data.compact_in_workout ?? true,
    showDuringCamera: data.show_during_camera ?? true,
    showExerciseDemos: data.show_exercise_demos ?? true,
    minimalCameraHud: data.minimal_camera_hud ?? false,
    countdownAudioEnabled: data.countdown_audio_enabled ?? true,
    talkativeness: data.talkativeness ?? "normal",
    repCountingEnabled: data.rep_counting_enabled ?? true,
    workoutAudioMode: data.workout_audio_mode ?? "external",
    coachVoiceVolume: data.coach_voice_volume ?? "normal",
    cueVolume: data.cue_volume ?? "normal",
    duckExternalMusic: data.duck_external_music ?? true,
  };
}

// ── Body profile / weekly plan ───────────────────────────────────────────────

export async function pushBodyProfileToSupabase(
  userId: string,
  profile: BodyProfile | null
): Promise<void> {
  await supabase.from("user_settings").upsert({
    id: userId,
    body_profile: profile,
    updated_at: new Date().toISOString(),
  });
}

export async function pullBodyProfileFromSupabase(
  userId: string
): Promise<BodyProfile | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("body_profile")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return (data.body_profile as BodyProfile | null) ?? null;
}

export async function pushWeeklyPlanToSupabase(
  userId: string,
  plan: WeeklyPlan | null
): Promise<void> {
  await supabase.from("user_settings").upsert({
    id: userId,
    weekly_plan: plan,
    updated_at: new Date().toISOString(),
  });
}

export async function pullWeeklyPlanFromSupabase(
  userId: string
): Promise<WeeklyPlan | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("weekly_plan")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return (data.weekly_plan as WeeklyPlan | null) ?? null;
}

// ── Stats / Streak ────────────────────────────────────────────────────────────

export async function pushStatsToSupabase(
  userId: string,
  stats: TraineeStats
): Promise<void> {
  await supabase.from("streaks").upsert({
    id: userId,
    current_streak: stats.streak,
    longest_streak: stats.streak,
    workouts_completed: stats.workoutsCompleted,
    total_minutes: stats.totalMinutes,
    last_workout_date: stats.lastWorkoutDate,
  });
}

export async function pullStatsFromSupabase(
  userId: string
): Promise<Partial<TraineeStats> | null> {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    streak: data.current_streak ?? 0,
    workoutsCompleted: data.workouts_completed ?? 0,
    totalMinutes: data.total_minutes ?? 0,
    lastWorkoutDate: data.last_workout_date ?? null,
  };
}

// ── Workouts ──────────────────────────────────────────────────────────────────

export async function pushWorkoutToSupabase(
  userId: string,
  workout: WorkoutSummaryData
): Promise<void> {
  await supabase.from("workouts").upsert({
    id: workout.id,
    user_id: userId,
    completed_at: workout.completedAt,
    duration_seconds: workout.actualSessionMinutes * 60,
    goal: workout.goal,
    level: workout.level,
    equipment: workout.equipment,
    total_reps: workout.estimatedReps,
    workout_score: workout.workoutScore ?? null,
    xp_earned: workout.xpEarned ?? null,
    summary: workout,
  });
}

export async function pullWorkoutHistoryFromSupabase(
  userId: string
): Promise<WorkoutSummaryData[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("summary")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((row) => row.summary as WorkoutSummaryData).filter(Boolean);
}

export async function deleteUserDataFromSupabase(userId: string): Promise<void> {
  await Promise.all([
    supabase.from("workouts").delete().eq("user_id", userId),
    supabase.from("streaks").delete().eq("id", userId),
    supabase.from("user_settings").delete().eq("id", userId),
  ]);
}
