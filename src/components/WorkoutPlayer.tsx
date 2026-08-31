import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Shuffle,
  StopCircle,
  Info,
  Volume2,
  Wind,
} from "lucide-react";
import { workoutEngine, type TimerSnapshot } from "../engine/workoutTimer.ts";
import { ExerciseAnimation } from "./ExerciseAnimation.tsx";
import { StopModal } from "./StopModal.tsx";
import { AudioSettingsModal } from "./AudioSettingsModal.tsx";
import { replaceExerciseInSession } from "../engine/generator.ts";
import type { GeneratedSession } from "../types/session.ts";
import { CATEGORY_LABELS } from "../types/enums.ts";
import { getPositionTransitionInfo } from "../utils/positionTransition.ts";

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
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [breathState, setBreathState] = useState<"inspire" | "expire">("inspire");

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

  // Sync breathing rhythm (4s inspire -> 4s expire)
  useEffect(() => {
    if (snapshot.phase !== "rest") return;
    const interval = setInterval(() => {
      setBreathState((prev) => (prev === "inspire" ? "expire" : "inspire"));
    }, 4000);
    return () => clearInterval(interval);
  }, [snapshot.phase]);

  const handleTogglePause = () => {
    workoutEngine.togglePause();
  };

  const handleSkip = () => {
    workoutEngine.skip();
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

  // Harmonious Unified Circular Gauge Geometry
  const ringSize = 264;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Phase Details & Colors
  const getPhaseDetails = () => {
    if (snapshot.phase === "preparation") {
      return {
        label: "Préparation",
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#D97706",
        ringColor: "#F59E0B",
      };
    }
    if (snapshot.phase === "rest") {
      return {
        label: "Repos & Souffle",
        bg: "rgba(2, 132, 199, 0.12)",
        color: "#0284C7",
        ringColor: "#0284C7",
      };
    }
    const sessionPhase = snapshot.currentExercise?.phase;
    if (sessionPhase === "wakeup") {
      return {
        label: "1. Réveil",
        bg: "var(--color-primary-soft)",
        color: "var(--color-primary)",
        ringColor: "var(--color-primary)",
      };
    }
    if (sessionPhase === "mobility") {
      return {
        label: "2. Mobilité",
        bg: "var(--color-primary-soft)",
        color: "var(--color-primary)",
        ringColor: "var(--color-primary)",
      };
    }
    if (sessionPhase === "activation") {
      return {
        label: "3. Activation",
        bg: "var(--color-primary)",
        color: "#FFFFFF",
        ringColor: "var(--color-primary)",
      };
    }
    if (sessionPhase === "dynamic") {
      return {
        label: "4. Dynamique",
        bg: "var(--color-accent)",
        color: "#FFFFFF",
        ringColor: "var(--color-accent)",
      };
    }
    if (sessionPhase === "finish") {
      return {
        label: "5. Fin active",
        bg: "var(--color-primary-soft)",
        color: "var(--color-primary)",
        ringColor: "var(--color-primary)",
      };
    }
    return {
      label: "Exercice",
      bg: "var(--color-primary)",
      color: "#FFFFFF",
      ringColor: "var(--color-primary)",
    };
  };

  const phaseDetails = getPhaseDetails();
  const transitionInfo = getPositionTransitionInfo(currentExercise, nextExercise);

  if (!currentExercise) return null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top Header: Phase Badge, Counter, Audio & Stop */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="badge"
            style={{
              backgroundColor: phaseDetails.bg,
              color: phaseDetails.color,
              padding: "5px 12px",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            {phaseDetails.label}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-subtle)" }}>
            {snapshot.currentExerciseIndex + 1} / {snapshot.totalExercises}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            className="btn-ghost"
            style={{ padding: "6px 10px", color: "var(--text-subtle)", fontSize: "0.88rem" }}
            aria-label="Options audio & coach vocal"
            title="Options audio & coach vocal"
          >
            <Volume2 size={18} />
          </button>

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
      </div>

      {/* Main Title & Subtitle Area */}
      <div>
        <h1
          style={{
            fontSize: "1.38rem",
            fontWeight: 800,
            color: "var(--text-main)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {snapshot.phase === "rest"
            ? "Repos • Préparez la suite"
            : snapshot.phase === "preparation"
            ? "Préparez-vous..."
            : currentExercise.nameFr || currentExercise.name}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            fontSize: "0.84rem",
            color: "var(--text-muted)",
          }}
        >
          {snapshot.phase === "rest" ? (
            <span>
              {nextExercise
                ? `À suivre : ${nextExercise.nameFr || nextExercise.name}`
                : "Dernière récupération avant la fin"}
            </span>
          ) : (
            <>
              <span>{CATEGORY_LABELS[currentExercise.category] || currentExercise.category}</span>
              <span>•</span>
              <span>Intensité {currentExercise.intensity}/5</span>
              {snapshot.isUnilateral && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: snapshot.isSecondSide
                        ? "rgba(244, 162, 97, 0.2)"
                        : "var(--color-primary-soft)",
                      color: snapshot.isSecondSide ? "#E76F51" : "var(--color-primary-dark)",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                    }}
                  >
                    {snapshot.isSecondSide ? "🔸 2ème côté (Droit)" : "🔹 1er côté (Gauche)"}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── UNIFIED HARMONIOUS HERO STAGE (Constant Dimensions & Circular Gauge Across All Phases) ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 16px 16px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1.5px solid var(--border-color)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Unilateral Halfway Side Switch Flash Banner */}
        {snapshot.showSideSwitchFlash && (
          <div
            className="animate-slide-up"
            style={{
              position: "absolute",
              top: 18,
              zIndex: 30,
              backgroundColor: "#E76F51",
              color: "#FFFFFF",
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 8px 25px rgba(231, 111, 81, 0.45)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              letterSpacing: "0.02em",
            }}
          >
            <span>🔄</span>
            <span>Changez de côté !</span>
          </div>
        )}
        {/* Central Stage: Giant Circular Gauge wrapping the Visual Content */}
        <div
          style={{
            position: "relative",
            width: ringSize,
            height: ringSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Circular SVG Gauge Track */}
          <svg
            width={ringSize}
            height={ringSize}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "rotate(-90deg)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            {/* Background Ring Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="transparent"
              stroke="var(--bg-surface-elevated)"
              strokeWidth={strokeWidth}
            />
            {/* Smooth Animated Progress Arc */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="transparent"
              stroke={phaseDetails.ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.15s linear, stroke 0.3s ease",
              }}
            />
          </svg>

          {/* Interior Viewport (Diameter 224px) */}
          <div
            style={{
              width: 224,
              height: 224,
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              backgroundColor: "var(--bg-surface-elevated)",
              zIndex: 1,
            }}
          >
            {snapshot.phase === "rest" && nextExercise ? (
              /* REST PHASE WITH UPCOMING EXERCISE: Show Next Posture in Action */
              <ExerciseAnimation
                exercise={nextExercise}
                phase="preparation"
                circularMode={true}
              />
            ) : snapshot.phase === "rest" ? (
              /* REST PHASE WITHOUT NEXT EXERCISE: Serene Breath Waves */
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {/* Expanding aura */}
                <div
                  className="breathe-ripple"
                  style={{
                    position: "absolute",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    backgroundColor: "rgba(2, 132, 199, 0.18)",
                  }}
                />

                {/* Pulsing Core Sphere */}
                <div
                  className="breathe-sphere"
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    backgroundColor: "rgba(2, 132, 199, 0.14)",
                    border: "2px solid #0284C7",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    boxShadow: "0 6px 20px rgba(2, 132, 199, 0.2)",
                  }}
                >
                  <Wind size={30} color="#0284C7" />
                  <span
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      color: "#0284C7",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {breathState === "inspire" ? "Inspirez" : "Expirez"}
                  </span>
                </div>
              </div>
            ) : (
              /* WORK & PREPARATION PHASES: Current Movement Animation */
              <ExerciseAnimation
                exercise={currentExercise}
                nextExercise={nextExercise}
                phase={snapshot.phase}
                circularMode={true}
              />
            )}
          </div>
        </div>

        {/* Big Prominent Countdown Digits Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 14,
          }}
        >
          <div
            style={{
              fontSize: "2.7rem",
              fontWeight: 900,
              color: "var(--text-main)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {remainingPhase}
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-subtle)", marginLeft: 2 }}>
              s
            </span>
          </div>

          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: phaseDetails.color,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginTop: 4,
            }}
          >
            {snapshot.phase === "preparation"
              ? "Préparez-vous"
              : snapshot.phase === "rest"
              ? "Repos en cours"
              : "En mouvement"}
          </div>
        </div>
      </div>

      {/* ── CONTEXTUAL GUIDANCE / NEXT UP BANNER ── */}
      {snapshot.phase === "rest" ? (
        /* Next Exercise & Position Preparation Banner during Rest */
        nextExercise && (
          <div
            className="animate-slide-up"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "var(--radius-xl)",
              backgroundColor: "var(--bg-surface)",
              border: "1.5px solid var(--border-color)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Top Row: Position Alert Badge & Target Duration */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: transitionInfo.badgeBg,
                  color: transitionInfo.badgeColor,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                <span>{transitionInfo.badgeEmoji}</span>
                <span>{transitionInfo.badgeLabel}</span>
              </span>

              <span style={{ fontSize: "0.78rem", color: "var(--text-subtle)", fontWeight: 700 }}>
                À suivre • {snapshot.nextExercise?.targetDurationSeconds || 45}s
              </span>
            </div>

            {/* Middle Row: Animated GIF Thumbnail + Exercise Title + Position Advice */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border-subtle)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={`/animations/${nextExercise.slug || nextExercise.id}.gif`}
                  alt={nextExercise.nameFr || nextExercise.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    lineHeight: 1.25,
                  }}
                >
                  {nextExercise.nameFr || nextExercise.name}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {transitionInfo.instruction}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Instructions Toggle during Work / Prep */
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: "2px 0",
              alignSelf: "flex-start",
            }}
          >
            <Info size={15} />
            <span>{showInstructions ? "Masquer les consignes" : "Voir les consignes d'exécution"}</span>
          </button>

          {showInstructions && (
            <div
              className="animate-slide-down"
              style={{
                padding: "12px 14px",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.84rem",
                lineHeight: 1.5,
                color: "var(--text-main)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border: "1px solid var(--border-subtle)",
              }}
            >
              {currentExercise.shortDescriptionFr && (
                <p style={{ margin: 0, fontWeight: 500, color: "var(--text-muted)" }}>
                  {currentExercise.shortDescriptionFr}
                </p>
              )}
              {currentExercise.instructionsFr && currentExercise.instructionsFr.length > 0 && (
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {currentExercise.instructionsFr.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              )}
              {currentExercise.breathingGuidanceFr && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--color-primary)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  <span>🫁 Respiration :</span>
                  <span>{currentExercise.breathingGuidanceFr}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── WORKOUT CONTROLS & OVERALL PROGRESS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        {/* Replace Button (during work/prep) */}
        <button
          type="button"
          onClick={handleReplaceCurrentExercise}
          disabled={snapshot.phase === "rest"}
          className="btn-ghost"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "6px 10px",
            fontSize: "0.75rem",
            color: snapshot.phase === "rest" ? "var(--border-color)" : "var(--text-muted)",
            cursor: snapshot.phase === "rest" ? "not-allowed" : "pointer",
          }}
          aria-label="Changer cet exercice"
          title="Changer cet exercice"
        >
          <Shuffle size={20} />
          <span>Changer</span>
        </button>

        {/* Giant Play/Pause Primary Action Button */}
        <button
          type="button"
          onClick={handleTogglePause}
          style={{
            width: 66,
            height: 66,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(30, 107, 74, 0.35)",
            transition: "transform 0.15s ease",
          }}
          aria-label={snapshot.isPaused ? "Reprendre" : "Pause"}
        >
          {snapshot.isPaused ? (
            <Play size={32} fill="currentColor" style={{ marginLeft: 3 }} />
          ) : (
            <Pause size={30} fill="currentColor" />
          )}
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="btn-ghost"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "6px 10px",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
          aria-label="Passer au suivant"
          title="Passer au suivant"
        >
          <SkipForward size={20} />
          <span>Passer</span>
        </button>
      </div>

      {/* Global Session Elapsed Time Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          fontSize: "0.8rem",
          color: "var(--text-subtle)",
          fontWeight: 600,
        }}
      >
        <span>Temps écoulé : {formatTime(snapshot.totalElapsedSeconds)}</span>
        <span>Durée totale prévue : ~{formatTime(currentSession.estimatedTotalSeconds)}</span>
      </div>

      {/* Modals */}
      <StopModal
        isOpen={showStopModal}
        elapsedSeconds={snapshot.totalElapsedSeconds}
        completedExercisesCount={snapshot.completedExerciseIds.length}
        onResume={handleResumeFromStop}
        onSavePartial={handleConfirmSavePartial}
        onDiscard={handleConfirmDiscard}
      />

      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />
    </div>
  );
};
