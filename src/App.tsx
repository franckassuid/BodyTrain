import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.tsx";
import { Navigation, type NavTab } from "./components/Navigation.tsx";
import { SafetyBanner } from "./components/SafetyBanner.tsx";
import { CheckIn } from "./components/CheckIn.tsx";
import { SessionPreview } from "./components/SessionPreview.tsx";
import { WorkoutPlayer } from "./components/WorkoutPlayer.tsx";
import { SessionComplete } from "./components/SessionComplete.tsx";
import { HistoryView } from "./components/HistoryView.tsx";
import { SettingsView } from "./components/SettingsView.tsx";
import { ExerciseLibraryView } from "./components/ExerciseLibraryView.tsx";
import { CustomWorkoutBuilderView } from "./components/CustomWorkoutBuilderView.tsx";

import { generateSession } from "./engine/generator.ts";
import { storageService } from "./services/storage.ts";
import { soundService } from "./services/sound.ts";
import { vibrationService } from "./services/vibration.ts";
import type { DiscomfortZone } from "./types/enums.ts";
import type { GeneratedSession } from "./types/session.ts";
import type { SessionHistoryRecord } from "./types/history.ts";
import type { AppSettings } from "./types/settings.ts";
import type { Exercise } from "./types/exercise.ts";

type WorkoutScreenState = "checkin" | "preview" | "player" | "complete";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("workout");
  const [workoutScreen, setWorkoutScreen] = useState<WorkoutScreenState>("checkin");
  const [currentSession, setCurrentSession] = useState<GeneratedSession | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showSafetyBanner, setShowSafetyBanner] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [returnTabAfterWorkout, setReturnTabAfterWorkout] = useState<NavTab>("workout");

  // Last finished session stats
  const [finishedStats, setFinishedStats] = useState<{
    actualDurationSeconds: number;
    completedCount: number;
    totalCount: number;
    isPartial: boolean;
  }>({ actualDurationSeconds: 0, completedCount: 0, totalCount: 0, isPartial: false });

  useEffect(() => {
    loadInitialSettings();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadInitialSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
    setShowSafetyBanner(!s.safetyDisclaimerAcknowledged);
    soundService.setEnabled(s.soundEnabled);
    vibrationService.setEnabled(s.vibrationEnabled);
  };

  const handleDismissSafety = async () => {
    setShowSafetyBanner(false);
    await storageService.saveSettings({ safetyDisclaimerAcknowledged: true });
  };

  const handleGenerate = async (
    energy: number,
    discomfort: DiscomfortZone,
    options?: { warmupExtraMinutes?: number; cooldownExtraMinutes?: number }
  ) => {
    const recentExerciseArrays = await storageService.getRecentExerciseIds(3);
    const targetDurationMinutes = settings?.defaultDurationMinutes || 7;
    const warmupExtraMinutes = options?.warmupExtraMinutes ?? settings?.warmupExtraMinutes ?? 0;
    const cooldownExtraMinutes = options?.cooldownExtraMinutes ?? settings?.cooldownExtraMinutes ?? 0;

    const session = generateSession({
      energyScore: energy,
      discomfortZone: discomfort,
      targetDurationMinutes,
      warmupExtraMinutes,
      cooldownExtraMinutes,
      recentSessionExerciseIds: recentExerciseArrays,
      seed: Date.now(),
    });

    setCurrentSession(session);
    setWorkoutScreen("preview");
  };

  const handleRegenerate = async () => {
    if (!currentSession) return;
    const recentExerciseArrays = await storageService.getRecentExerciseIds(3);

    const session = generateSession({
      energyScore: currentSession.energyScore,
      discomfortZone: currentSession.discomfortZone,
      targetDurationMinutes: currentSession.baseDurationMinutes || currentSession.targetDurationMinutes,
      warmupExtraMinutes: currentSession.warmupExtraMinutes || 0,
      cooldownExtraMinutes: currentSession.cooldownExtraMinutes || 0,
      recentSessionExerciseIds: recentExerciseArrays,
      seed: Date.now() + Math.floor(Math.random() * 1000),
    });

    setCurrentSession(session);
  };

  const handleStartWorkout = () => {
    setReturnTabAfterWorkout("workout");
    setWorkoutScreen("player");
  };

  // Launch a custom workout created by the user
  const handleStartCustomWorkout = (session: GeneratedSession) => {
    setCurrentSession(session);
    setReturnTabAfterWorkout("custom");
    setActiveTab("workout");
    setWorkoutScreen("player");
  };

  // Launch a single exercise directly from library
  const handlePlaySingleExercise = (exercise: Exercise, durationSeconds = 45) => {
    const singleSession: GeneratedSession = {
      id: `single-${exercise.id}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      energyScore: 6,
      discomfortZone: "none",
      targetDurationMinutes: 1,
      estimatedTotalSeconds: durationSeconds + 5,
      intensityLevel: `Niveau ${exercise.intensity}/5`,
      description: `Mouvement guidé : ${exercise.nameFr || exercise.name}`,
      exercises: [
        {
          exercise,
          phase: exercise.suitablePhases?.[0] || "activation",
          targetDurationSeconds: durationSeconds,
          preparationSeconds: 5,
          restSeconds: 0,
        },
      ],
      seed: Date.now(),
    };

    setReturnTabAfterWorkout(activeTab);
    setCurrentSession(singleSession);
    setActiveTab("workout");
    setWorkoutScreen("player");
  };

  const handleWorkoutFinished = async (actualDuration: number, completedIds: string[]) => {
    if (!currentSession) return;

    const record: SessionHistoryRecord = {
      id: currentSession.id,
      date: new Date().toISOString(),
      energyScore: currentSession.energyScore,
      discomfortZone: currentSession.discomfortZone,
      plannedDurationSeconds: currentSession.estimatedTotalSeconds,
      actualDurationSeconds: actualDuration,
      status: "completed",
      proposedExerciseIds: currentSession.exercises.map((e) => e.exercise.id),
      completedExerciseIds: completedIds,
    };

    await storageService.saveSession(record);

    setFinishedStats({
      actualDurationSeconds: actualDuration,
      completedCount: completedIds.length,
      totalCount: currentSession.exercises.length,
      isPartial: false,
    });
    setWorkoutScreen("complete");
  };

  const handlePartialSave = async (actualDuration: number, completedIds: string[]) => {
    if (!currentSession) return;

    const record: SessionHistoryRecord = {
      id: currentSession.id,
      date: new Date().toISOString(),
      energyScore: currentSession.energyScore,
      discomfortZone: currentSession.discomfortZone,
      plannedDurationSeconds: currentSession.estimatedTotalSeconds,
      actualDurationSeconds: actualDuration,
      status: "partial",
      proposedExerciseIds: currentSession.exercises.map((e) => e.exercise.id),
      completedExerciseIds: completedIds,
    };

    await storageService.saveSession(record);

    setFinishedStats({
      actualDurationSeconds: actualDuration,
      completedCount: completedIds.length,
      totalCount: currentSession.exercises.length,
      isPartial: true,
    });
    setWorkoutScreen("complete");
  };

  const handleDiscard = () => {
    if (returnTabAfterWorkout !== "workout") {
      setActiveTab(returnTabAfterWorkout);
      setReturnTabAfterWorkout("workout");
    }
    setWorkoutScreen("checkin");
    setCurrentSession(null);
  };

  const handleFinishScreen = () => {
    if (returnTabAfterWorkout !== "workout") {
      setActiveTab(returnTabAfterWorkout);
      setReturnTabAfterWorkout("workout");
    } else {
      setActiveTab("history");
    }
    setWorkoutScreen("checkin");
    setCurrentSession(null);
  };

  return (
    <div className="app-container">
      {/* App Header (hidden during workout player for maximum focus) */}
      {workoutScreen !== "player" && <Header isOnline={isOnline} />}

      <main className="main-content">
        {/* TAB 1: WORKOUT FLOW */}
        {activeTab === "workout" && (
          <>
            {workoutScreen === "checkin" && (
              <>
                {showSafetyBanner && <SafetyBanner onDismiss={handleDismissSafety} />}
                <CheckIn
                  onGenerate={handleGenerate}
                  defaultEnergy={6}
                  initialWarmupExtra={settings?.warmupExtraMinutes || 0}
                  initialCooldownExtra={settings?.cooldownExtraMinutes || 0}
                />
              </>
            )}

            {workoutScreen === "preview" && currentSession && (
              <SessionPreview
                session={currentSession}
                onStart={handleStartWorkout}
                onRegenerate={handleRegenerate}
                onBackToCheckIn={() => setWorkoutScreen("checkin")}
              />
            )}

            {workoutScreen === "player" && currentSession && (
              <WorkoutPlayer
                session={currentSession}
                onFinished={handleWorkoutFinished}
                onPartialSave={handlePartialSave}
                onDiscard={handleDiscard}
              />
            )}

            {workoutScreen === "complete" && (
              <SessionComplete
                actualDurationSeconds={finishedStats.actualDurationSeconds}
                completedExercisesCount={finishedStats.completedCount}
                totalExercisesCount={finishedStats.totalCount}
                isPartial={finishedStats.isPartial}
                onFinish={handleFinishScreen}
              />
            )}
          </>
        )}

        {/* TAB 2: LIBRARY */}
        {activeTab === "library" && <ExerciseLibraryView onPlayExercise={handlePlaySingleExercise} />}

        {/* TAB 3: CUSTOM WORKOUT BUILDER */}
        {activeTab === "custom" && <CustomWorkoutBuilderView onStartCustomWorkout={handleStartCustomWorkout} />}

        {/* TAB 4: HISTORY */}
        {activeTab === "history" && <HistoryView />}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Bottom Navigation (hidden during active workout) */}
      {workoutScreen !== "player" && (
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />
      )}
    </div>
  );
};
