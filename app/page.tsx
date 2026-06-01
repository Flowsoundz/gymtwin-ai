"use client";

import React, { useEffect, useEffectEvent, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  AppScreen,
  AvatarDisplaySettings,
  BodyProfile,
  CoachAvatar,
  CoachName,
  WorkoutGoal,
  WorkoutLevel,
  Equipment,
  TraineeStats,
  WeeklyPlan,
  WorkoutSummaryData,
  WorkoutMovement,
  ActiveSessionData,
} from "@/types";
import { supabase } from "@/lib/supabase";
import {
  pushSettingsToSupabase,
  pullSettingsFromSupabase,
  pushStatsToSupabase,
  pullStatsFromSupabase,
  pushWorkoutToSupabase,
  pullWorkoutHistoryFromSupabase,
} from "@/lib/supabaseSync";
import { AuthScreen } from "@/components/AuthScreen";
import { CameraSandboxScreen } from "@/components/CameraSandboxScreen";
import { LandingScreen } from "@/components/LandingScreen";
import { ModelLabScreen } from "@/components/ModelLabScreen";
import { ProgressScreen } from "@/components/ProgressScreen";
import { RoutinePreviewScreen } from "@/components/RoutinePreviewScreen";
import { SafetyStopScreen } from "@/components/SafetyStopScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { SetupScreen } from "@/components/SetupScreen";
import { WorkoutDetailScreen } from "@/components/WorkoutDetailScreen";
import { WorkoutPlayerScreen } from "@/components/WorkoutPlayerScreen";
import { WorkoutSummaryScreen } from "@/components/WorkoutSummaryScreen";
import {
  readActiveSession,
  saveActiveSession,
  clearStoredActiveSession,
  hasStoredActiveSession,
} from "@/hooks/useActiveSession";
import { getCoachQuote } from "@/lib/coachEngine";
import { useSpeechCoach } from "@/hooks/useSpeechCoach";
import {
  clearWorkoutStorage,
  readLastWorkoutSummary,
  readUserStats,
  readWorkoutHistory,
  saveLastWorkoutSummary,
  saveUserStats,
  saveWorkoutHistory,
} from "@/lib/workoutStorage";
import {
  todayString,
  yesterdayString,
  secondsToClock,
  calculateActualMinutes,
} from "@/lib/time";
import {
  buildScoredWorkoutSummary,
} from "@/lib/sessionScoring";
import { getAchievementBadges } from "@/lib/achievementEngine";
import { readBodyProfile, saveBodyProfile } from "@/lib/bodyProfileStorage";
import { generateWeeklyPlan } from "@/lib/weeklyPlanEngine";
import { clearWeeklyPlan, markTodayComplete, readWeeklyPlan, saveWeeklyPlan } from "@/lib/weeklyPlanStorage";
import { buildRoutine, cleanMovementName } from "@/lib/workoutEngine";
import {
  defaultAvatarDisplaySettings,
  readAvatarDisplaySettings,
  saveAvatarDisplaySettings,
} from "@/lib/avatarDisplaySettings";
import { DraggableCoach } from "@/components/DraggableCoach";
import { getExerciseClipName } from "@/lib/exerciseAnimationMap";
import type { CoachAnimationHint } from "@/lib/coachBrain";

export default function GymTwinApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("landing");
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [userStats, setUserStats] = useState<TraineeStats>({ workoutsCompleted: 0, streak: 0, lastWorkoutDate: null, totalMinutes: 0 });
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [avatarDisplaySettings, setAvatarDisplaySettings] = useState<AvatarDisplaySettings>(
    defaultAvatarDisplaySettings
  );
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState<WorkoutSummaryData | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSummaryData[]>([]);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutSummaryData | null>(null);
  const [hasResumeSession, setHasResumeSession] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal>("Build muscle");
  const [selectedLevel, setSelectedLevel] = useState<WorkoutLevel>("Beginner");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>("None");
  const [sessionLength, setSessionLength] = useState("20");
  const [selectedAvatar, setSelectedAvatar] = useState<CoachAvatar>("Nova");
  const [selectedCoach, setSelectedCoach] = useState<CoachName>("Supportive");

  const [activeRoutine, setActiveRoutine] = useState<WorkoutMovement[]>([]);
  const [movementIndex, setMovementIndex] = useState(0);
  const [workingSet, setWorkingSet] = useState(1);
  const [currentReps, setCurrentReps] = useState(0);
  const [totalAccumulatedReps, setTotalAccumulatedReps] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  const [isRestPhase, setIsRestPhase] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [exerciseCountdown, setExerciseCountdown] = useState(0);
  const [hasAcceptedSafety, setHasAcceptedSafety] = useState(false);

  const {
    isMuted,
    setIsMuted,
    displayedSpeech,
    setDisplayedSpeech,
    speak,
    updateCoachLine,
  } = useSpeechCoach(selectedCoach, selectedAvatar);

  const activeMovement = activeRoutine[movementIndex];

  const totalWorkoutSets = useMemo(() => {
    return activeRoutine.reduce((sum, move) => sum + move.sets, 0);
  }, [activeRoutine]);

  const completedSetEstimate = useMemo(() => {
    if (!activeRoutine.length) return 0;
    const completedPrevious = activeRoutine.slice(0, movementIndex).reduce((sum, move) => sum + move.sets, 0);
    return completedPrevious + Math.max(0, workingSet - 1);
  }, [activeRoutine, movementIndex, workingSet]);

  const achievementBadges = useMemo(() => {
    return getAchievementBadges({
      userStats,
      workoutHistory,
      lastWorkoutSummary,
    });
  }, [lastWorkoutSummary, userStats, workoutHistory]);

  const handleRestCountdownFinished = useEffectEvent(() => {
    if (activeRoutine.length > 0) advanceExecutionTrack();
  });

  const handleExerciseCountdownFinished = useEffectEvent(() => {
    if (!activeMovement) return;
    const line = "Time target reached. Finish your final reps if needed, then press Complete Set.";
    setDisplayedSpeech(line);
    speak(line);
  });

  const progressPercent = totalWorkoutSets ? Math.min(100, Math.round((completedSetEstimate / totalWorkoutSets) * 100)) : 0;

  const primaryButton = "w-full py-4 rounded-2xl font-black transition-all active:scale-95 flex justify-center items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_22px_rgba(139,92,246,0.42)] hover:shadow-[0_0_32px_rgba(139,92,246,0.62)]";
  const secondaryButton = "w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex justify-center items-center bg-slate-900 text-slate-200 border border-slate-800 hover:border-blue-500";
  const selectClass = "w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:border-purple-500 transition-colors text-slate-200";

  function clearActiveSession() {
    clearStoredActiveSession();
    setHasResumeSession(false);
  }

  function resetLocalAppData() {
    clearActiveSession();
    clearWorkoutStorage();
    clearWeeklyPlan();
    setUserStats({ workoutsCompleted: 0, streak: 0, lastWorkoutDate: null, totalMinutes: 0 });
    setWeeklyPlan(null);
    setLastWorkoutSummary(null);
    setWorkoutHistory([]);
    setSelectedWorkoutDetail(null);
    setCurrentScreen("landing");
  }

  useEffect(() => {
    const savedStats = readUserStats();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedStats) setUserStats(savedStats);

    const savedSummary = readLastWorkoutSummary();
    if (savedSummary) setLastWorkoutSummary(savedSummary);

    setWorkoutHistory(readWorkoutHistory());
    setBodyProfile(readBodyProfile());
    setWeeklyPlan(readWeeklyPlan());
    setAvatarDisplaySettings(readAvatarDisplaySettings());

    setHasResumeSession(hasStoredActiveSession());
  }, []);

  // Auth listener — runs once, updates user state on login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSupabaseUser(user);

      if (user) {
        // Pull cloud data and merge with localStorage
        void Promise.all([
          pullSettingsFromSupabase(user.id).then((remote) => {
            if (remote) {
              const merged = { ...readAvatarDisplaySettings(), ...remote };
              setAvatarDisplaySettings(merged as AvatarDisplaySettings);
              saveAvatarDisplaySettings(merged as AvatarDisplaySettings);
            }
          }),
          pullStatsFromSupabase(user.id).then((remote) => {
            if (remote) {
              const local = readUserStats() ?? { workoutsCompleted: 0, streak: 0, lastWorkoutDate: null, totalMinutes: 0 };
              const merged: TraineeStats = {
                workoutsCompleted: Math.max(local.workoutsCompleted, remote.workoutsCompleted ?? 0),
                streak: Math.max(local.streak, remote.streak ?? 0),
                totalMinutes: Math.max(local.totalMinutes, remote.totalMinutes ?? 0),
                lastWorkoutDate: remote.lastWorkoutDate ?? local.lastWorkoutDate,
              };
              setUserStats(merged);
              saveUserStats(merged);
            }
          }),
          pullWorkoutHistoryFromSupabase(user.id).then((remote) => {
            if (remote.length) {
              const local = readWorkoutHistory();
              const ids = new Set(local.map((w) => w.id));
              const merged = [...local, ...remote.filter((w) => !ids.has(w.id))].slice(0, 20);
              setWorkoutHistory(merged);
              saveWorkoutHistory(merged);
            }
          }),
        ]);

        // Go to landing after sign-in if on auth screen
        setCurrentScreen((s) => (s === "auth" ? "landing" : s));
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle "Sign In" button from SettingsScreen
  useEffect(() => {
    const handler = () => setCurrentScreen("auth");
    window.addEventListener("gymtwin:goto-auth", handler);
    return () => window.removeEventListener("gymtwin:goto-auth", handler);
  }, []);

  function handleGenerateWeeklyPlan() {
    const nextPlan = generateWeeklyPlan(selectedGoal, selectedLevel, selectedEquipment);
    setWeeklyPlan(nextPlan);
    saveWeeklyPlan(nextPlan);
  }

  useEffect(() => {
    if (currentScreen !== "player" || activeRoutine.length === 0) return;
    const activeSessionPayload: ActiveSessionData = {
      activeRoutine,
      movementIndex,
      workingSet,
      currentReps,
      totalAccumulatedReps,
      isRestPhase,
      restCountdown,
      exerciseCountdown,
      selectedGoal,
      selectedLevel,
      selectedEquipment,
      sessionLength,
      selectedCoach,
      sessionStartedAt,
      displayedSpeech,
    };

    saveActiveSession(activeSessionPayload);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasResumeSession(true);
  }, [
    currentScreen, activeRoutine, movementIndex, workingSet, currentReps, totalAccumulatedReps,
    isRestPhase, restCountdown, exerciseCountdown, selectedGoal, selectedLevel, selectedEquipment,
    sessionLength, selectedCoach, sessionStartedAt, displayedSpeech
  ]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (currentScreen !== "player") return;
    if (isRestPhase && restCountdown > 0) {
      timer = setInterval(() => setRestCountdown((seconds) => seconds - 1), 1000);
    }
    if (!isRestPhase && exerciseCountdown > 0) {
      timer = setInterval(() => setExerciseCountdown((seconds) => seconds - 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [currentScreen, isRestPhase, restCountdown, exerciseCountdown]);

  useEffect(() => {
    if (currentScreen !== "player") return;
    if (isRestPhase && restCountdown === 0) handleRestCountdownFinished();
  }, [restCountdown, isRestPhase, currentScreen]);

  useEffect(() => {
    if (currentScreen !== "player") return;
    if (!isRestPhase && exerciseCountdown === 0) handleExerciseCountdownFinished();
  }, [exerciseCountdown, isRestPhase, currentScreen]);

  function resumeWorkoutSession() {
    const session = readActiveSession();
    if (!session) { setHasResumeSession(false); return; }
    setActiveRoutine(session.activeRoutine); setMovementIndex(session.movementIndex); setWorkingSet(session.workingSet);
    setCurrentReps(session.currentReps); setTotalAccumulatedReps(session.totalAccumulatedReps); setIsRestPhase(session.isRestPhase);
    setRestCountdown(session.restCountdown); setExerciseCountdown(session.exerciseCountdown); setSelectedGoal(session.selectedGoal);
    setSelectedLevel(session.selectedLevel); setSelectedEquipment(session.selectedEquipment); setSessionLength(session.sessionLength);
    setSelectedCoach(session.selectedCoach); setSessionStartedAt(session.sessionStartedAt || Date.now()); setDisplayedSpeech(session.displayedSpeech);
    setCurrentScreen("player");
    setTimeout(() => speak("Workout resumed. Keep going."), 300);
  }

  function initializeTrainingSession() {
    if (!hasAcceptedSafety) return;
    let routine = buildRoutine(selectedGoal, selectedLevel, selectedEquipment, Number(sessionLength));
    const historicalMatch = workoutHistory.find(
      (item) =>
        item.goal === selectedGoal &&
        item.level === selectedLevel &&
        item.equipment === selectedEquipment &&
        item.difficultyFeedback !== null
    );

    if (historicalMatch?.difficultyFeedback) {
      const feedback = historicalMatch.difficultyFeedback;
      routine = routine.map((ex) => {
        if (ex.phase !== "core") return ex;
        if (feedback === "too_easy") return { ...ex, baseReps: ex.baseReps + 2 };
        if (feedback === "too_hard") return { ...ex, baseReps: Math.max(1, ex.baseReps - 2) };
        return ex;
      });
    }

    if (routine.length === 0) {
      setDisplayedSpeech("No compatible routine found. Please adjust your settings.");
      return;
    }

    setActiveRoutine(routine); setMovementIndex(0); setWorkingSet(1); setCurrentReps(routine[0].baseReps);
    setTotalAccumulatedReps(0); setSessionStartedAt(null); setIsRestPhase(false); setRestCountdown(0);
    setExerciseCountdown(routine[0].activeSeconds); clearStoredActiveSession();
    setHasResumeSession(false); setCurrentScreen("preview");
    const phrase = "Review your custom program. Press Start when ready.";
    setDisplayedSpeech(phrase); setTimeout(() => speak(phrase), 450);
  }

  function launchActiveWorkoutTracking() {
    if (activeRoutine.length === 0) { setCurrentScreen("setup"); return; }
    const startedAt = Date.now();
    const intro = getCoachQuote(selectedCoach, "intro");
    const opening = `First movement: ${cleanMovementName(activeRoutine[0].name)}. ${intro}`;

    const activeSessionPayload: ActiveSessionData = {
      activeRoutine, movementIndex: 0, workingSet: 1, currentReps: activeRoutine[0].baseReps, totalAccumulatedReps: 0,
      isRestPhase: false, restCountdown: 0, exerciseCountdown: activeRoutine[0].activeSeconds, selectedGoal,
      selectedLevel, selectedEquipment, sessionLength, selectedCoach, sessionStartedAt: startedAt, displayedSpeech: opening
    };

    saveActiveSession(activeSessionPayload);

    setHasResumeSession(true); setSessionStartedAt(startedAt); setMovementIndex(0); setWorkingSet(1);
    setCurrentReps(activeRoutine[0].baseReps); setTotalAccumulatedReps(0); setIsRestPhase(false); setRestCountdown(0);
    setExerciseCountdown(activeRoutine[0].activeSeconds); setCurrentScreen("player"); setDisplayedSpeech(opening); speak(opening);
  }

  function viewWorkoutDetail(workout: WorkoutSummaryData) {
    setSelectedWorkoutDetail(workout);
    setCurrentScreen("workout_detail");
  }

  function handleRepeatSimilarWorkout() {
    if (!selectedWorkoutDetail) return;
    setSelectedGoal(selectedWorkoutDetail.goal); setSelectedLevel(selectedWorkoutDetail.level);
    setSelectedEquipment(selectedWorkoutDetail.equipment); setSessionLength(selectedWorkoutDetail.sessionLength);
    setSelectedCoach(selectedWorkoutDetail.coach); setCurrentScreen("setup");
  }

  function updateHistoricalFeedback(feedback: "too_easy" | "too_hard") {
    if (!selectedWorkoutDetail) return;
    const updatedDetail = { ...selectedWorkoutDetail, difficultyFeedback: feedback };
    setSelectedWorkoutDetail(updatedDetail);

    if (lastWorkoutSummary && lastWorkoutSummary.id === selectedWorkoutDetail.id) {
      setLastWorkoutSummary(updatedDetail); saveLastWorkoutSummary(updatedDetail);
    }
    const updatedHistory = workoutHistory.map((item) => item.id === selectedWorkoutDetail.id ? updatedDetail : item);
    setWorkoutHistory(updatedHistory); saveWorkoutHistory(updatedHistory);
  }

  function advanceExecutionTrack() {
    if (!activeMovement) return;
    setIsRestPhase(false); setRestCountdown(0); setTotalAccumulatedReps((prev) => prev + currentReps);

    if (workingSet < activeMovement.sets) {
      const nextSet = workingSet + 1; setWorkingSet(nextSet); setExerciseCountdown(activeMovement.activeSeconds);
      updateCoachLine("action", `Set ${nextSet}.`); return;
    }
    if (movementIndex + 1 < activeRoutine.length) {
      const nextEx = activeRoutine[movementIndex + 1]; setMovementIndex((curr) => curr + 1); setWorkingSet(1);
      setCurrentReps(nextEx.baseReps); setExerciseCountdown(nextEx.activeSeconds);
      updateCoachLine("action", `Next movement: ${cleanMovementName(nextEx.name)}.`); return;
    }
    finalizeRoutineMetrics();
  }

  function triggerRestPhase() {
    if (!activeMovement) return;
    if (activeMovement.restPeriod > 0 && !(movementIndex === activeRoutine.length - 1 && workingSet === activeMovement.sets)) {
      setIsRestPhase(true); setRestCountdown(activeMovement.restPeriod);
      updateCoachLine("recovery", `Rest for ${activeMovement.restPeriod} seconds.`); return;
    }
    advanceExecutionTrack();
  }

  function finalizeRoutineMetrics() {
    const today = todayString(); const yesterday = yesterdayString(); const actualMins = calculateActualMinutes(sessionStartedAt);
    let nextStreak = 1;
    if (userStats.lastWorkoutDate === today) nextStreak = userStats.streak;
    else if (userStats.lastWorkoutDate === yesterday) nextStreak = userStats.streak + 1;

    const nextStats = { workoutsCompleted: userStats.workoutsCompleted + 1, streak: nextStreak, lastWorkoutDate: today, totalMinutes: userStats.totalMinutes + actualMins };
    setUserStats(nextStats); saveUserStats(nextStats);

    const summaryPayload = buildScoredWorkoutSummary({
      id: `session-${Date.now()}`, goal: selectedGoal, level: selectedLevel, equipment: selectedEquipment, sessionLength,
      actualSessionMinutes: actualMins, exerciseCount: activeRoutine.length, totalSets: totalWorkoutSets, estimatedReps: totalAccumulatedReps + currentReps,
      coach: selectedCoach,
      difficultyFeedback: null,
      completedAt: today,
    } satisfies WorkoutSummaryData);

    setLastWorkoutSummary(summaryPayload); saveLastWorkoutSummary(summaryPayload);
    const updatedHistory = [summaryPayload, ...workoutHistory].slice(0, 10); setWorkoutHistory(updatedHistory);
    saveWorkoutHistory(updatedHistory);
    if (supabaseUser) {
      void pushWorkoutToSupabase(supabaseUser.id, summaryPayload);
      void pushStatsToSupabase(supabaseUser.id, nextStats);
    }
    const updatedWeeklyPlan = markTodayComplete(weeklyPlan);
    if (updatedWeeklyPlan) setWeeklyPlan(updatedWeeklyPlan);

    clearActiveSession(); setSessionStartedAt(null);
    const line = `Workout complete. ${getCoachQuote(selectedCoach, "outro")}`;
    setDisplayedSpeech(line); speak(line); setCurrentScreen("summary");
  }

  function submitDifficultyFeedback(feedback: "too_easy" | "perfect" | "too_hard") {
    if (!lastWorkoutSummary) return;
    const updatedSummary = buildScoredWorkoutSummary({
      ...lastWorkoutSummary,
      difficultyFeedback: feedback,
    });
    setLastWorkoutSummary(updatedSummary); saveLastWorkoutSummary(updatedSummary);
    const updatedHistory = workoutHistory.map((item) => item.id === lastWorkoutSummary.id ? updatedSummary : item);
    setWorkoutHistory(updatedHistory); saveWorkoutHistory(updatedHistory);
    setCurrentScreen("progress");
  }

  function recallCoachDialogue() { if (currentScreen === "player") updateCoachLine(isRestPhase ? "recovery" : "action"); }
  function activateSafetyShutdown() { speak("Workout stopped. Safety comes first."); clearActiveSession(); setSessionStartedAt(null); setCurrentScreen("safety_stop"); }
  function resetWorkout() { clearActiveSession(); setActiveRoutine([]); setMovementIndex(0); setWorkingSet(1); setCurrentReps(0); setTotalAccumulatedReps(0); setSessionStartedAt(null); setIsRestPhase(false); setRestCountdown(0); setExerciseCountdown(0); setCurrentScreen("landing"); }

  function changeDifficulty(direction: "easy" | "hard") {
    if (direction === "easy") { setCurrentReps((r) => r + 2); updateCoachLine("action", "Difficulty increased slightly."); }
    else { setCurrentReps((r) => Math.max(1, r - 2)); updateCoachLine("action", "Difficulty lowered. Clean form matters more than ego."); }
  }

  // Floating coach state — mirrors exercise during workout, idles otherwise
  const floatingDemoClip = useMemo<string | null>(() => {
    if (currentScreen !== "player" || !activeMovement || isRestPhase) return null;
    return getExerciseClipName(activeMovement);
  }, [currentScreen, activeMovement, isRestPhase]);

  const [floatingHint, setFloatingHint] = useState<CoachAnimationHint>("idle");

  // Reset hint when leaving screens that drive it
  useEffect(() => {
    if (currentScreen === "summary") {
      setFloatingHint("celebrate");
    } else {
      setFloatingHint("idle");
    }
  }, [currentScreen]);

  // Hide the floating coach where the screen already features the coach prominently
  const showFloatingCoach =
    currentScreen !== "model_lab" &&
    currentScreen !== "camera_sandbox" &&
    currentScreen !== "landing";

  const elapsedMinutes = sessionStartedAt ? calculateActualMinutes(sessionStartedAt) : 0;

  return (
    <>
      {currentScreen === "auth" && (
        <AuthScreen onSkip={() => setCurrentScreen("landing")} />
      )}

      {/* Guest sync banner — shown on landing when not signed in */}
      {currentScreen === "landing" && !supabaseUser && !syncBannerDismissed && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-purple-500/30 bg-slate-950/90 px-4 py-3 shadow-[0_0_24px_rgba(139,92,246,0.2)] backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-200">Sign in to sync your progress across devices</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setCurrentScreen("auth")}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-[11px] font-black text-white"
            >
              Sign In
            </button>
            <button
              onClick={() => setSyncBannerDismissed(true)}
              className="text-slate-500 hover:text-slate-300 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {currentScreen === "landing" && (
        <LandingScreen
          userStats={userStats}
          hasResumeSession={hasResumeSession}
          onResumeWorkout={resumeWorkoutSession}
          onStartWorkout={() => setCurrentScreen("setup")}
          onStartTodaysWorkout={() => setCurrentScreen("setup")}
          onViewProgress={() => setCurrentScreen("progress")}
          onOpenCameraSandbox={() => setCurrentScreen("camera_sandbox")}
          onOpenSettings={() => setCurrentScreen("settings")}
          weeklyPlan={weeklyPlan}
          bodyProfile={bodyProfile}
          workoutHistory={workoutHistory}
          latestWorkoutSummary={lastWorkoutSummary}
          onGenerateWeeklyPlan={handleGenerateWeeklyPlan}
          selectedAvatar={selectedAvatar}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
      )}

      {currentScreen === "settings" && (
        <SettingsScreen
          onBackHome={() => setCurrentScreen("landing")}
          onOpenCameraSandbox={() => setCurrentScreen("camera_sandbox")}
          onOpenModelLab={() => setCurrentScreen("model_lab")}
          onResetLocalData={resetLocalAppData}
          selectedAvatar={selectedAvatar}
          bodyProfile={bodyProfile}
          avatarDisplaySettings={avatarDisplaySettings}
          onBodyProfileChange={(profile) => {
            setBodyProfile(profile);
            if (profile) saveBodyProfile(profile);
          }}
          onAvatarDisplaySettingsChange={(settings) => {
            setAvatarDisplaySettings(settings);
            saveAvatarDisplaySettings(settings);
            if (supabaseUser) void pushSettingsToSupabase(supabaseUser.id, settings);
          }}
          supabaseUser={supabaseUser}
          onSignOut={async () => {
            await supabase.auth.signOut();
            setCurrentScreen("landing");
          }}
        />
      )}

      {currentScreen === "model_lab" && (
        <ModelLabScreen
          onBackHome={() => setCurrentScreen("settings")}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
      )}

      {currentScreen === "camera_sandbox" && (
        <CameraSandboxScreen
          onBack={() => setCurrentScreen("landing")}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
          selectedAvatar={selectedAvatar}
          avatarDisplaySettings={avatarDisplaySettings}
        />
      )}

      {currentScreen === "setup" && (
        <SetupScreen
          selectedGoal={selectedGoal}
          setSelectedGoal={setSelectedGoal}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
          sessionLength={sessionLength}
          setSessionLength={setSessionLength}
          selectedAvatar={selectedAvatar}
          setSelectedAvatar={setSelectedAvatar}
          selectedCoach={selectedCoach}
          setSelectedCoach={setSelectedCoach}
          hasAcceptedSafety={hasAcceptedSafety}
          setHasAcceptedSafety={setHasAcceptedSafety}
          onBack={() => setCurrentScreen("landing")}
          onGeneratePreview={initializeTrainingSession}
          primaryButton={primaryButton}
          selectClass={selectClass}
        />
      )}

      {currentScreen === "preview" && activeRoutine.length > 0 && (
        <RoutinePreviewScreen
          activeRoutine={activeRoutine}
          cleanMovementName={cleanMovementName}
          onBackToSetup={() => setCurrentScreen("setup")}
          onBeginWorkout={launchActiveWorkoutTracking}
          onCancel={resetWorkout}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
          selectedAvatar={selectedAvatar}
        />
      )}

      {currentScreen === "player" && activeMovement && (
        <WorkoutPlayerScreen
          activeMovement={activeMovement}
          activeRoutine={activeRoutine}
          movementIndex={movementIndex}
          workingSet={workingSet}
          currentReps={currentReps}
          progressPercent={progressPercent}
          isRestPhase={isRestPhase}
          restCountdown={restCountdown}
          exerciseCountdown={exerciseCountdown}
          elapsedMinutes={elapsedMinutes}
          selectedCoach={selectedCoach}
          selectedAvatar={selectedAvatar}
          avatarDisplaySettings={avatarDisplaySettings}
          isMuted={isMuted}
          displayedSpeech={displayedSpeech}
          cleanMovementName={cleanMovementName}
          secondsToClock={secondsToClock}
          onToggleMute={() => setIsMuted((muted) => !muted)}
          onSafetyStop={activateSafetyShutdown}
          onRecallCoachDialogue={recallCoachDialogue}
          onAdvanceExecutionTrack={advanceExecutionTrack}
          onTriggerRestPhase={triggerRestPhase}
          onChangeDifficultyEasy={() => changeDifficulty("easy")}
          onChangeDifficultyHard={() => changeDifficulty("hard")}
          onCoachAnimHint={setFloatingHint}
          primaryButton={primaryButton}
        />
      )}

      {currentScreen === "summary" && lastWorkoutSummary && (
        <WorkoutSummaryScreen
          lastWorkoutSummary={lastWorkoutSummary}
          displayedSpeech={displayedSpeech}
          selectedAvatar={selectedAvatar}
          bodyProfile={bodyProfile}
          weeklyPlan={weeklyPlan}
          workoutHistory={workoutHistory}
          userStats={userStats}
          onSubmitDifficultyFeedback={submitDifficultyFeedback}
          onRepeatWorkout={initializeTrainingSession}
          onStartNewWorkout={() => setCurrentScreen("setup")}
          onViewProgress={() => setCurrentScreen("progress")}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
      )}

      {currentScreen === "workout_detail" && selectedWorkoutDetail && (
        <WorkoutDetailScreen
          selectedWorkoutDetail={selectedWorkoutDetail}
          onBackToProgress={() => setCurrentScreen("progress")}
          onRepeatSimilarWorkout={handleRepeatSimilarWorkout}
          onMakeNextEasier={() => updateHistoricalFeedback("too_hard")}
          onMakeNextHarder={() => updateHistoricalFeedback("too_easy")}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
      )}

      {currentScreen === "safety_stop" && (
        <SafetyStopScreen
          onReturnHome={resetWorkout}
          secondaryButton={secondaryButton}
        />
      )}

      {currentScreen === "progress" && (
        <ProgressScreen
          selectedAvatar={selectedAvatar}
          badges={achievementBadges}
          bodyProfile={bodyProfile}
          weeklyPlan={weeklyPlan}
          userStats={userStats}
          workoutHistory={workoutHistory}
          onStartAnotherWorkout={() => setCurrentScreen("setup")}
          onReturnHome={resetWorkout}
          onViewWorkoutDetail={viewWorkoutDetail}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
      )}

      {showFloatingCoach && (
        <DraggableCoach
          selectedAvatar={selectedAvatar}
          animationHint={floatingHint}
          demoClipName={floatingDemoClip}
          message={displayedSpeech || null}
        />
      )}
    </>
  );
}
