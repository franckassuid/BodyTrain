import type { Exercise } from "./exercise.ts";
import type { GeneratedSession, SessionExercise } from "./session.ts";

export interface CustomWorkoutItem {
  exercise: Exercise;
  durationSeconds: number;
  restSeconds: number;
}

export interface CustomWorkout {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: CustomWorkoutItem[];
  totalEstimatedSeconds: number;
}

/** Convert a CustomWorkout into a GeneratedSession ready for WorkoutPlayer */
export function convertCustomToGeneratedSession(custom: CustomWorkout): GeneratedSession {
  const exercises: SessionExercise[] = custom.items.map((item, index) => ({
    exercise: item.exercise,
    phase:
      item.exercise.category === "breathing" ||
      item.exercise.category === "cooldown" ||
      item.exercise.category === "light_stretching"
        ? "finish"
        : item.exercise.category === "gentle_wakeup" ||
          item.exercise.category === "neck_mobility" ||
          item.exercise.category === "shoulder_mobility"
        ? "wakeup"
        : "dynamic",
    targetDurationSeconds: item.durationSeconds,
    preparationSeconds: index === 0 ? 5 : 0,
    restSeconds: index === custom.items.length - 1 ? 0 : item.restSeconds,
  }));

  const totalSec = exercises.reduce(
    (sum, ex) => sum + ex.preparationSeconds + ex.targetDurationSeconds + ex.restSeconds,
    0
  );

  return {
    id: `custom_${custom.id}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    energyScore: 6,
    discomfortZone: "none",
    targetDurationMinutes: Math.round(totalSec / 60) || 5,
    estimatedTotalSeconds: totalSec,
    intensityLevel: "Sur-mesure",
    description: custom.title || "Séance personnalisée",
    exercises,
    seed: Date.now(),
  };
}
