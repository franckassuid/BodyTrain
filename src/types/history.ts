import type { DiscomfortZone } from "./enums.ts";

export type SessionStatus = "completed" | "partial" | "abandoned";

export interface SessionHistoryRecord {
  id: string;
  date: string; // ISO string
  energyScore: number; // 0 - 10
  discomfortZone: DiscomfortZone;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  status: SessionStatus;
  proposedExerciseIds: string[];
  completedExerciseIds: string[];
}

export interface HistoryStats {
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalTimeMinutes: number;
  totalSessions: number;
  recentExerciseIds: string[];
}
