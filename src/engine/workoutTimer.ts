import type { GeneratedSession, SessionExercise } from "../types/session.ts";
import { soundService } from "../services/sound.ts";
import { vibrationService } from "../services/vibration.ts";
import { voiceCoach } from "../services/voiceCoach.ts";

export type WorkoutState = "not_started" | "preparation" | "work" | "rest" | "paused" | "completed" | "abandoned";
export type WorkoutPhase = "preparation" | "work" | "rest" | "finished";

export interface TimerSnapshot {
  state: WorkoutState;
  phase: WorkoutPhase;
  currentExerciseIndex: number;
  totalExercises: number;
  currentExercise: SessionExercise | null;
  nextExercise: SessionExercise | null;
  phaseTimeRemainingSeconds: number;
  phaseTotalSeconds: number;
  totalElapsedSeconds: number;
  completedExerciseIds: string[];
  isPaused: boolean;
}

export type TimerSubscriber = (snapshot: TimerSnapshot) => void;

export class WorkoutEngine {
  private session: GeneratedSession | null = null;
  private currentExerciseIndex: number = 0;
  private currentPhase: WorkoutPhase = "preparation";
  private state: WorkoutState = "not_started";

  private phaseTimeRemaining: number = 0;
  private phaseTotalSeconds: number = 0;
  private totalElapsedSeconds: number = 0;

  private completedExerciseIds: Set<string> = new Set();
  private subscribers: Set<TimerSubscriber> = new Set();

  private timerId: number | null = null;
  private lastTimestamp: number = 0;

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  public destroy() {
    this.stopTimer();
    voiceCoach.stop();
    this.subscribers.clear();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  public subscribe(callback: TimerSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getSnapshot());
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    const snap = this.getSnapshot();
    this.subscribers.forEach((cb) => cb(snap));
  }

  public getSnapshot(): TimerSnapshot {
    const currentEx = this.session?.exercises[this.currentExerciseIndex] || null;
    const nextEx = this.session?.exercises[this.currentExerciseIndex + 1] || null;

    return {
      state: this.state,
      phase: this.currentPhase,
      currentExerciseIndex: this.currentExerciseIndex,
      totalExercises: this.session?.exercises.length || 0,
      currentExercise: currentEx,
      nextExercise: nextEx,
      phaseTimeRemainingSeconds: Math.max(0, Math.ceil(this.phaseTimeRemaining)),
      phaseTotalSeconds: this.phaseTotalSeconds,
      totalElapsedSeconds: Math.floor(this.totalElapsedSeconds),
      completedExerciseIds: Array.from(this.completedExerciseIds),
      isPaused: this.state === "paused",
    };
  }

  public start(session: GeneratedSession) {
    this.stopTimer();
    voiceCoach.stop();
    this.session = session;
    this.currentExerciseIndex = 0;
    this.completedExerciseIds.clear();
    this.totalElapsedSeconds = 0;

    const firstEx = session.exercises[0];
    // Initial preparation before starting the whole workout (5s)
    this.currentPhase = "preparation";
    this.phaseTotalSeconds = 5;
    this.phaseTimeRemaining = 5;
    this.state = "preparation";

    this.lastTimestamp = performance.now();
    this.startTimer();
    if (firstEx) {
      voiceCoach.announcePreparation(firstEx.exercise.nameFr || firstEx.exercise.name || "");
    }
    this.notify();
  }

  public pause() {
    if (this.state === "not_started" || this.state === "completed" || this.state === "abandoned") return;
    this.state = "paused";
    this.stopTimer();
    voiceCoach.stop();
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

  /** Advance past current exercise or skip preparation immediately */
  public skip() {
    if (!this.session) return;
    voiceCoach.stop();

    if (this.currentPhase === "preparation") {
      // Skip initial prep directly into work of Exercise 0
      const currentEx = this.session.exercises[this.currentExerciseIndex];
      this.currentPhase = "work";
      this.state = "work";
      this.phaseTotalSeconds = currentEx.targetDurationSeconds;
      this.phaseTimeRemaining = currentEx.targetDurationSeconds;
      soundService.playStartChime();
      vibrationService.transition();
      voiceCoach.announceExerciseStart(
        currentEx.exercise.nameFr || currentEx.exercise.name || "",
        currentEx.exercise.breathingGuidanceFr || currentEx.exercise.shortDescriptionFr
      );
      this.notify();
      return;
    }

    this.advanceNext();
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

    // Audio & voice countdown on 5, 4, 3, 2, 1 during work phase
    if (this.currentPhase === "work" && newSec !== prevSec && newSec > 0 && newSec <= 5) {
      voiceCoach.announceCountdown(newSec);
      soundService.playCountdownBeep(newSec === 1);
      vibrationService.tick();
    } else if (this.currentPhase === "preparation" && newSec !== prevSec && newSec > 0 && newSec <= 3) {
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
      // Start initial Exercise Work
      this.currentPhase = "work";
      this.state = "work";
      this.phaseTotalSeconds = currentEx.targetDurationSeconds;
      this.phaseTimeRemaining = currentEx.targetDurationSeconds;
      soundService.playStartChime();
      vibrationService.transition();
      voiceCoach.announceExerciseStart(
        currentEx.exercise.nameFr || currentEx.exercise.name || "",
        currentEx.exercise.breathingGuidanceFr || currentEx.exercise.shortDescriptionFr
      );
      this.notify();
    } else if (this.currentPhase === "work") {
      this.finishCurrentExerciseWork();
    } else if (this.currentPhase === "rest") {
      // Rest completed -> move directly to the work phase of next exercise (no redundant second prep!)
      this.advanceNext();
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
      const nextEx = this.session.exercises[this.currentExerciseIndex + 1];
      this.currentPhase = "rest";
      this.state = "rest";
      this.phaseTotalSeconds = currentEx.restSeconds;
      this.phaseTimeRemaining = currentEx.restSeconds;
      soundService.playRestChime();
      vibrationService.transition();
      voiceCoach.announceRest(nextEx?.exercise.nameFr || nextEx?.exercise.name);
      this.notify();
    }
  }

  private advanceNext() {
    if (!this.session) return;
    this.currentExerciseIndex++;

    if (this.currentExerciseIndex >= this.session.exercises.length) {
      this.completeWorkout();
    } else {
      // Transition directly to work of the next exercise
      const next = this.session.exercises[this.currentExerciseIndex];
      this.currentPhase = "work";
      this.state = "work";
      this.phaseTotalSeconds = next.targetDurationSeconds;
      this.phaseTimeRemaining = next.targetDurationSeconds;
      soundService.playStartChime();
      vibrationService.transition();
      voiceCoach.announceExerciseStart(
        next.exercise.nameFr || next.exercise.name || "",
        next.exercise.breathingGuidanceFr || next.exercise.shortDescriptionFr
      );
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
    voiceCoach.announceCompletion();
    this.notify();
  }

  public abandon() {
    this.stopTimer();
    voiceCoach.stop();
    this.state = "abandoned";
    this.notify();
  }
}

export const workoutEngine = new WorkoutEngine();
