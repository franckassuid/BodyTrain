import type { DiscomfortZone, SessionPhase } from "./enums.ts";
import type { Exercise } from "./exercise.ts";

export { SessionPhase };

export interface SessionExercise {
  exercise: Exercise;
  phase: SessionPhase;
  targetDurationSeconds: number;
  targetRepetitions?: number;
  preparationSeconds: number;
  restSeconds: number;
}

export interface GeneratedSession {
  id: string;
  createdAt: string;
  energyScore: number; // 0 - 10
  discomfortZone: DiscomfortZone;
  targetDurationMinutes: number; // 5, 7, or 10
  estimatedTotalSeconds: number;
  intensityLevel: string; // "Très doux", "Doux", "Équilibré", "Dynamique"
  description: string;
  templateId?: string; // ID of the session template used
  exercises: SessionExercise[];
  seed: number;
}

export type WorkoutState =
  | "not_started"
  | "preparation"
  | "work"
  | "rest"
  | "paused"
  | "completed"
  | "abandoned";
