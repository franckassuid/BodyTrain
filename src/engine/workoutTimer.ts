import { soundService } from "../services/sound.ts";
import { vibrationService } from "../services/vibration.ts";
import type { GeneratedSession, SessionExercise, WorkoutState } from "../types/session.ts";

export interface TimerSnapshot {
  state: WorkoutState;
  currentExerciseIndex: number;
  currentExercise: SessionExercise | null;
  nextExercise: SessionExercise | null;
  totalExercises: number;
  phase: "preparation" | "work" | "rest" | "finished";
  phaseTimeRemainingSeconds: number;
  phaseTotalSeconds: number;
  totalElapsedSeconds: number;
  totalEstimatedSeconds: number;
  isPaused: boolean;
  completedExerciseIds: string[];
}

export type TimerCallback = (snapshot: TimerSnapshot) => void;

export class WorkoutEngine {
  private session: GeneratedSession | null = null;
  private state: WorkoutState = "not_started";
  private currentExerciseIndex: number = 0;
  private currentPhase: "preparation" | "work" | "rest" | "finished" = "preparation";

  private phaseTotalSeconds: number = 5;
  private phaseTimeRemaining: number = 5;
  private totalElapsedSeconds: number = 0;

  private completedExerciseIds: Set<string> = new Set();
  private timerId: number | null = null;
  private lastTimestamp: number = 0;

  private listeners: Set<TimerCallback> = new Set();

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  public destroy() {
    this.stopTimer();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    this.listeners.clear();
  }

  public subscribe(cb: TimerCallback): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  public getSnapshot(): TimerSnapshot {
    const currentEx = this.session?.exercises[this.currentExerciseIndex] || null;
    const nextEx =
      this.session && this.currentExerciseIndex + 1 < this.session.exercises.length
        ? this.session.exercises[this.currentExerciseIndex + 1]
        : null;

    return {
      state: this.state,
      currentExerciseIndex: this.currentExerciseIndex,
      currentExercise: currentEx,
      nextExercise: nextEx,
      totalExercises: this.session?.exercises.length || 0,
      phase: this.currentPhase,
      phaseTimeRemainingSeconds: Math.max(0, Math.ceil(this.phaseTimeRemaining)),
      phaseTotalSeconds: this.phaseTotalSeconds,
      totalElapsedSeconds: Math.floor(this.totalElapsedSeconds),
      totalEstimatedSeconds: this.session?.estimatedTotalSeconds || 0,
      isPaused: this.state === "paused",
      completedExerciseIds: Array.from(this.completedExerciseIds),
    };
  }

  public start(session: GeneratedSession) {
    this.stopTimer();
    this.session = session;
    this.currentExerciseIndex = 0;
    this.completedExerciseIds.clear();
    this.totalElapsedSeconds = 0;

    const firstEx = session.exercises[0];
    this.currentPhase = "preparation";
    this.phaseTotalSeconds = firstEx?.preparationSeconds || 5;
    this.phaseTimeRemaining = this.phaseTotalSeconds;
    this.state = "preparation";

    this.lastTimestamp = performance.now();
    this.startTimer();
    this.notify();
  }

  public pause() {
    if (this.state === "not_started" || this.state === "completed" || this.state === "abandoned") return;
    this.state = "paused";
    this.stopTimer();
    this.notify();
  }

  public resume() {
    if (this.state !== "paused") return;
    this.state = this.currentPhase === "preparation" ? "preparation" : this.currentPhase === "rest" ? "rest" : "work";
    this.lastTimestamp = performance.now();
    this.startTimer();
    this.notify();
  }

  public togglePause() {
    if (this.state === "paused") this.resume();
    else this.pause();
  }

  /** Advance past current exercise immediately */
  public skip() {
    if (!this.session) return;
    this.advanceNext();
  }

  /** Complete repetitions for repetitions-mode exercise */
  public completeRepetitionExercise() {
    if (!this.session) return;
    if (this.currentPhase === "work") {
      this.finishCurrentExerciseWork();
    }
  }

  /** Replace the exercise currently displayed */
  public updateSession(newSession: GeneratedSession) {
    this.session = newSession;
    const curr = newSession.exercises[this.currentExerciseIndex];
    if (curr && this.currentPhase === "work") {
      this.phaseTotalSeconds = curr.targetDurationSeconds;
      this.phaseTimeRemaining = curr.targetDurationSeconds;
    }
    this.notify();
  }

  private startTimer() {
    if (this.timerId !== null) return;
    this.timerId = globalThis.setInterval(() => this.tick(), 100) as unknown as number;
  }

  private stopTimer() {
    if (this.timerId !== null) {
      globalThis.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      // Backgrounded
    } else {
      // Foregrounded, sync delta
      if (this.state !== "paused" && this.state !== "not_started" && this.state !== "completed") {
        const now = performance.now();
        const delta = (now - this.lastTimestamp) / 1000;
        this.lastTimestamp = now;
        this.advanceByDelta(delta);
      }
    }
  };

  private tick() {
    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    this.advanceByDelta(delta);
  }

  private advanceByDelta(delta: number) {
    if (this.state === "paused" || !this.session) return;

    this.totalElapsedSeconds += delta;
    const prevSec = Math.ceil(this.phaseTimeRemaining);
    this.phaseTimeRemaining -= delta;
    const newSec = Math.ceil(this.phaseTimeRemaining);

    // Audio & haptic countdown cues on 3, 2, 1
    if (newSec !== prevSec && newSec > 0 && newSec <= 3) {
      soundService.playCountdownBeep(newSec === 1);
      vibrationService.tick();
    }

    if (this.phaseTimeRemaining <= 0) {
      this.onPhaseCompleted();
    } else {
      this.notify();
    }
  }

  private onPhaseCompleted() {
    if (!this.session) return;
    const currentEx = this.session.exercises[this.currentExerciseIndex];

    if (this.currentPhase === "preparation") {
      // Start Exercise Work
      this.currentPhase = "work";
      this.state = "work";
      this.phaseTotalSeconds = currentEx.targetDurationSeconds;
      this.phaseTimeRemaining = currentEx.targetDurationSeconds;
      soundService.playStartChime();
      vibrationService.transition();
      this.notify();
    } else if (this.currentPhase === "work") {
      this.finishCurrentExerciseWork();
    } else if (this.currentPhase === "rest") {
      // Move to next exercise prep or work
      this.currentExerciseIndex++;
      if (this.currentExerciseIndex >= this.session.exercises.length) {
        this.completeWorkout();
      } else {
        const next = this.session.exercises[this.currentExerciseIndex];
        this.currentPhase = "preparation";
        this.state = "preparation";
        this.phaseTotalSeconds = next.preparationSeconds;
        this.phaseTimeRemaining = next.preparationSeconds;
        vibrationService.transition();
        this.notify();
      }
    }
  }

  private finishCurrentExerciseWork() {
    if (!this.session) return;
    const currentEx = this.session.exercises[this.currentExerciseIndex];
    this.completedExerciseIds.add(currentEx.exercise.id);

    const isLastExercise = this.currentExerciseIndex >= this.session.exercises.length - 1;

    if (isLastExercise || currentEx.restSeconds <= 0) {
      this.advanceNext();
    } else {
      // Enter Rest Phase
      this.currentPhase = "rest";
      this.state = "rest";
      this.phaseTotalSeconds = currentEx.restSeconds;
      this.phaseTimeRemaining = currentEx.restSeconds;
      soundService.playRestChime();
      vibrationService.transition();
      this.notify();
    }
  }

  private advanceNext() {
    if (!this.session) return;
    this.currentExerciseIndex++;

    if (this.currentExerciseIndex >= this.session.exercises.length) {
      this.completeWorkout();
    } else {
      const next = this.session.exercises[this.currentExerciseIndex];
      this.currentPhase = "preparation";
      this.state = "preparation";
      this.phaseTotalSeconds = next.preparationSeconds;
      this.phaseTimeRemaining = next.preparationSeconds;
      vibrationService.transition();
      this.notify();
    }
  }

  private completeWorkout() {
    this.stopTimer();
    this.state = "completed";
    this.currentPhase = "finished";
    this.phaseTimeRemaining = 0;
    soundService.playCompletionFanfare();
    vibrationService.completion();
    this.notify();
  }

  public abandon() {
    this.stopTimer();
    this.state = "abandoned";
    this.notify();
  }
}

export const workoutEngine = new WorkoutEngine();
