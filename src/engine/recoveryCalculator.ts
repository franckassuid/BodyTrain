import type { Exercise } from "../types/exercise.ts";
import type { Position, SessionPhase } from "../types/enums.ts";
import { getTransitionLevel } from "../types/enums.ts";

export interface RecoveryContext {
  currentExercise: Exercise;
  nextExercise?: Exercise | null;
  phase: SessionPhase;
  energyScore: number; // 0 - 10
  isLastExercise?: boolean;
}

/**
 * Calculates adapted recovery time (in seconds) between two consecutive exercises.
 *
 * Factors taken into account:
 * 1. Last exercise of workout -> 0s (workout completes immediately)
 * 2. User energy level -> lower energy gets more recovery time (13-18s), higher energy gets brisk pacing (10-12s)
 * 3. Intensity of finished exercise -> intensity 4-5 adds +3s to +5s
 * 4. Phase of workout -> activation/dynamic provide sufficient rest
 * 5. Position transition -> changing between Floor and Standing adds +4s for safe, unhurried repositioning (14-20s)
 * 6. Hard constraint -> strict minimum of 10 seconds enforced for all intermediate transitions.
 */
export function calculateRecoverySeconds(context: RecoveryContext): number {
  const { currentExercise, nextExercise, phase, energyScore, isLastExercise } = context;

  // 1. Last exercise of the workout gets 0s rest
  if (isLastExercise || !nextExercise) {
    return 0;
  }

  // 2. Base recovery from energy tier (0 to 10)
  let rest = 11;
  if (energyScore <= 2) {
    rest = 16; // Very low energy: plenty of time to breathe and pace
  } else if (energyScore <= 4) {
    rest = 13; // Low energy
  } else if (energyScore <= 7) {
    rest = 11; // Medium energy
  } else {
    rest = 10; // High energy
  }

  // 3. Exercise intensity factor
  if (currentExercise.intensity >= 5) {
    rest += 4;
  } else if (currentExercise.intensity === 4) {
    rest += 2;
  } else if (currentExercise.intensity <= 2) {
    rest -= 1;
  }

  // 4. Phase specific adjustments
  if (phase === "wakeup") {
    rest = Math.min(rest, 12);
  } else if (phase === "mobility") {
    rest = Math.min(rest, 12);
  } else if (phase === "finish") {
    rest = Math.min(rest, 10);
  }

  // 5. Position transition bonus (Floor <-> Standing)
  const currLevel = getTransitionLevel(currentExercise.positions as Position[]);
  const nextLevel = getTransitionLevel(nextExercise.positions as Position[]);
  if (currLevel !== nextLevel) {
    rest += 4; // Extra 4 seconds for safe floor-to-standing or standing-to-floor repositioning
  }

  // 6. Hard bounds:
  // - Strict minimum of 10 seconds for all intermediate exercises
  // - Capped at 30 seconds max
  return Math.max(10, Math.min(30, Math.round(rest)));
}
