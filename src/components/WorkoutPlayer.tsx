import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Shuffle,
  StopCircle,
  CheckCircle,
  ChevronRight,
  Info,
} from "lucide-react";
import { workoutEngine, type TimerSnapshot } from "../engine/workoutTimer.ts";
import { ExerciseAnimation } from "./ExerciseAnimation.tsx";
import { StopModal } from "./StopModal.tsx";
import { replaceExerciseInSession } from "../engine/generator.ts";
import type { GeneratedSession } from "../types/session.ts";
import { CATEGORY_LABELS } from "../types/enums.ts";

interface WorkoutPlayerProps {
  session: GeneratedSession;
  onFinished: (actualDurationSeconds: number, completedExerciseIds: string[]) => void;
  onPartialSave: (actualDurationSeconds: number, completedExerciseIds: string[]) => void;
  onDiscard: () => void;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  session: initialSession,
  onFinished,
  onPartialSave,
  onDiscard,
}) => {
  const [currentSession, setCurrentSession] = useState<GeneratedSession>(initialSession);
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(workoutEngine.getSnapshot());
  const [showStopModal, setShowStopModal] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    workoutEngine.start(currentSession);
    const unsubscribe = workoutEngine.subscribe((newSnap) => {
      setSnapshot(newSnap);
      if (newSnap.state === "completed") {
        onFinished(newSnap.totalElapsedSeconds, newSnap.completedExerciseIds);
      }
    });

    return () => {
      unsubscribe();
      workoutEngine.destroy();
    };
  }, []);

  const handleTogglePause = () => {
    workoutEngine.togglePause();
  };

  const handleSkip = () => {
    workoutEngine.skip();
  };

  const handleCompleteReps = () => {
    workoutEngine.completeRepetitionExercise();
  };

  const handleReplaceCurrentExercise = () => {
    const updated = replaceExerciseInSession(currentSession, snapshot.currentExerciseIndex);
    setCurrentSession(updated);
    workoutEngine.updateSession(updated);
  };

  const handleOpenStop = () => {
    workoutEngine.pause();
    setShowStopModal(true);
  };

  const handleResumeFromStop = () => {
    setShowStopModal(false);
    workoutEngine.resume();
  };

  const handleConfirmSavePartial = () => {
    setShowStopModal(false);
    workoutEngine.destroy();
    onPartialSave(snapshot.totalElapsedSeconds, snapshot.completedExerciseIds);
  };

  const handleConfirmDiscard = () => {
    setShowStopModal(false);
    workoutEngine.destroy();
    onDiscard();
  };

  const currentExercise = snapshot.currentExercise?.exercise;
  const nextExercise = snapshot.nextExercise?.exercise;

  // Phase Progress calculation
  const totalPhase = Math.max(1, snapshot.phaseTotalSeconds);
  const remainingPhase = snapshot.phaseTimeRemainingSeconds;
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingPhase / totalPhase));

  // Circular progress dimensions
  const circleSize = 100;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Phase Title & Badge
  const getPhaseDetails = () => {
    if (snapshot.phase === "preparation") {
      return {
        label: "Préparation",
        bg: "var(--bg-surface-elevated)",
        color: "var(--text-muted)",
      };
    }
    if (snapshot.phase === "rest") {
      return {
        label: "Repos & Récupération",
        bg: "var(--color-primary-soft)",
        color: "var(--color-primary-dark)",
      };
    }
    if (snapshot.currentExercise?.phase === "cooldown") {
      return {
        label: "Retour au calme",
        bg: "var(--color-primary-soft)",
        color: "var(--color-primary)",
      };
    }
    return {
      label: "Exercice en cours",
      bg: "var(--color-primary)",
      color: "#FFFFFF",
    };
  };

  const phaseDetails = getPhaseDetails();

  if (!currentExercise) return null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top Header: Session Progress & Stop Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="badge"
            style={{
              backgroundColor: phaseDetails.bg,
              color: phaseDetails.color,
              padding: "4px 12px",
            }}
          >
            {phaseDetails.label}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-subtle)" }}>
            {snapshot.currentExerciseIndex + 1} / {snapshot.totalExercises}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenStop}
          className="btn-ghost"
          style={{ padding: "6px 10px", color: "var(--color-accent)", fontSize: "0.88rem" }}
          aria-label="Arrêter la séance"
        >
          <StopCircle size={18} />
          <span>Arrêter</span>
        </button>
      </div>

      {/* Exercise Name & Short Description */}
      <div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.25 }}>
          {snapshot.phase === "rest" ? "Repos & Souffle" : (currentExercise.nameFr || currentExercise.name)}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          <span>{CATEGORY_LABELS[currentExercise.category] || currentExercise.category}</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: "var(--color-primary)",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          >
            <Info size={14} />
            <span>{showInstructions ? "Masquer consignes" : "Voir consignes"}</span>
          </button>
        </div>
      </div>

      {/* Optional Collapsible Instructions */}
      {showInstructions && (
        <div
          className="card animate-fade-in"
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--bg-surface-elevated)",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>Instructions :</div>
          <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {(currentExercise.instructionsFr || currentExercise.instructions || []).map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
          {(currentExercise.breathingGuidanceFr) && (
            <div style={{ marginTop: 4, fontStyle: "italic", color: "var(--color-primary)" }}>
              {currentExercise.breathingGuidanceFr}
            </div>
          )}
        </div>
      )}

      {/* Animation or Fallback Box */}
      <ExerciseAnimation
        exercise={currentExercise}
        nextExercise={nextExercise}
        phase={snapshot.phase}
      />

      {/* Primary Cue / Short instruction */}
      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          textAlign: "center",
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "var(--text-main)",
        }}
      >
        {snapshot.phase === "preparation"
          ? "Mets-toi en position calmement..."
          : snapshot.phase === "rest"
          ? `Prends ton temps avant : ${nextExercise?.nameFr || nextExercise?.name || "la fin"}`
          : (currentExercise.shortDescriptionFr || currentExercise.shortDescription)}
      </div>

      {/* Timer & Circular Progress Bar Row */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "14px 20px",
        }}
      >
        {/* Circular Progress Gauge */}
        <div style={{ position: "relative", width: circleSize, height: circleSize }}>
          <svg width={circleSize} height={circleSize} style={{ transform: "rotate(-90deg)" }}>
            {/* Background track */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="transparent"
              stroke="var(--bg-surface-subtle)"
              strokeWidth={strokeWidth}
            />
            {/* Animated progress indicator */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="transparent"
              stroke="var(--color-primary)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.15s linear" }}
            />
          </svg>

          {/* Time Centered in Circle */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--text-main)",
                lineHeight: 1,
              }}
            >
              {snapshot.phase === "work" && currentExercise.mode === "repetitions"
                ? `${snapshot.currentExercise?.targetRepetitions || 10}`
                : formatTime(remainingPhase)}
            </div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-subtle)", marginTop: 2 }}>
              {snapshot.phase === "work" && currentExercise.mode === "repetitions" ? "REPS" : "RESTANT"}
            </div>
          </div>
        </div>

        {/* Global Workout Progress Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 500 }}>
            Temps écoulé
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>
            {formatTime(snapshot.totalElapsedSeconds)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            sur ~{formatTime(snapshot.totalEstimatedSeconds)}
          </div>
        </div>
      </div>

      {/* Next Exercise Preview */}
      {nextExercise && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>À suivre :</span>
            <span>{nextExercise.name}</span>
          </div>
          <ChevronRight size={16} />
        </div>
      )}

      {/* Main Touch Player Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {/* If repetitions mode in work phase, show big "J'ai terminé les reps" button */}
        {snapshot.phase === "work" && currentExercise.mode === "repetitions" && (
          <button type="button" className="btn-accent" onClick={handleCompleteReps}>
            <CheckCircle size={20} />
            <span>J’ai terminé les {snapshot.currentExercise?.targetRepetitions || 10} répétitions</span>
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 10 }}>
          {/* Replace Exercise Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReplaceCurrentExercise}
            style={{ fontSize: "0.85rem", padding: "10px 8px" }}
            title="Changer d'exercice"
          >
            <Shuffle size={16} />
            <span>Changer</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleTogglePause}
            style={{ minHeight: 52 }}
          >
            {snapshot.isPaused ? (
              <>
                <Play size={20} fill="currentColor" />
                <span>Reprendre</span>
              </>
            ) : (
              <>
                <Pause size={20} fill="currentColor" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Skip Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSkip}
            style={{ fontSize: "0.85rem", padding: "10px 8px" }}
            title="Passer à l'exercice suivant"
          >
            <SkipForward size={16} />
            <span>Passer</span>
          </button>
        </div>
      </div>

      {/* Stop confirmation modal */}
      <StopModal
        isOpen={showStopModal}
        completedExercisesCount={snapshot.completedExerciseIds.length}
        elapsedSeconds={snapshot.totalElapsedSeconds}
        onSavePartial={handleConfirmSavePartial}
        onDiscard={handleConfirmDiscard}
        onResume={handleResumeFromStop}
      />
    </div>
  );
};
