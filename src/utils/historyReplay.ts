import type { SessionHistoryRecord } from "../types/history.ts";
import type { GeneratedSession, SessionExercise } from "../types/session.ts";
import { EXERCISES, EXERCISES_MAP } from "../data/exercisesData.ts";

/**
 * Converts a past SessionHistoryRecord into a fully playable GeneratedSession.
 */
export function convertHistoryRecordToGeneratedSession(record: SessionHistoryRecord): GeneratedSession {
  const exerciseIds =
    record.proposedExerciseIds && record.proposedExerciseIds.length > 0
      ? record.proposedExerciseIds
      : record.completedExerciseIds && record.completedExerciseIds.length > 0
      ? record.completedExerciseIds
      : [];

  const sessionExercises: SessionExercise[] = [];
  let totalSeconds = 0;

  for (let i = 0; i < exerciseIds.length; i++) {
    const exId = exerciseIds[i];
    const exercise = EXERCISES_MAP[exId] || EXERCISES.find((e) => e.id === exId || e.slug === exId);
    if (!exercise) continue;

    const phase = exercise.suitablePhases?.[0] || "activation";
    const duration = exercise.defaultDurationSeconds || 45;
    const isLast = i === exerciseIds.length - 1;
    const rest = isLast ? 0 : 10;

    sessionExercises.push({
      exercise,
      phase,
      targetDurationSeconds: duration,
      preparationSeconds: i === 0 ? 5 : 0,
      restSeconds: rest,
    });

    totalSeconds += duration + (i === 0 ? 5 : 0) + rest;
  }

  const durationMin = Math.max(1, Math.round(totalSeconds / 60));

  return {
    id: `replay-${record.id}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    energyScore: record.energyScore,
    discomfortZone: record.discomfortZone,
    targetDurationMinutes: durationMin,
    estimatedTotalSeconds: totalSeconds,
    intensityLevel: `Niveau ${record.energyScore > 6 ? "3" : "2"}/5`,
    description: `Séance réémise du ${new Date(record.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })} (${sessionExercises.length} exercices)`,
    exercises: sessionExercises,
    seed: Date.now(),
  };
}
