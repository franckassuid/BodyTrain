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
          padding: snapshot.phase === "rest" ? "24px 20px 20px" : "20px 16px 16px",
          backgroundColor: snapshot.phase === "rest" ? "rgba(2, 132, 199, 0.03)" : "var(--bg-surface)",
          borderRadius: "var(--radius-2xl)",
          border: snapshot.phase === "rest" ? "1px solid rgba(2, 132, 199, 0.15)" : "1.5px solid var(--border-color)",
          boxShadow: snapshot.phase === "rest" ? "0 12px 40px rgba(2, 132, 199, 0.08)" : "0 8px 30px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
              stroke={snapshot.phase === "rest" ? "rgba(2, 132, 199, 0.1)" : "var(--bg-surface-elevated)"}
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
              backgroundColor: snapshot.phase === "rest" ? "transparent" : "var(--bg-surface-elevated)",
              zIndex: 1,
            }}
          >
            {snapshot.phase === "rest" ? (
              /* REST PHASE: Serene Breath Waves & Recovery Sphere */
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
                    backgroundColor: "rgba(2, 132, 199, 0.12)",
                  }}
                />

                {/* Pulsing Core Sphere */}
                <div
                  className="breathe-sphere"
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(2, 132, 199, 0.25) 100%)",
                    border: "2px solid rgba(2, 132, 199, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    boxShadow: "0 8px 32px rgba(2, 132, 199, 0.2)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Wind size={32} color="#0284C7" strokeWidth={2.5} />
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "#0284C7",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
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
                isPaused={snapshot.isPaused}
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
            marginTop: 18,
          }}
        >
          <div
            style={{
              fontSize: "3.2rem",
              fontWeight: 900,
              color: snapshot.phase === "rest" ? "#0284C7" : "var(--text-main)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {remainingPhase}
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: snapshot.phase === "rest" ? "rgba(2, 132, 199, 0.6)" : "var(--text-subtle)", marginLeft: 2 }}>
              s
            </span>
          </div>

          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: snapshot.phase === "rest" ? "rgba(2, 132, 199, 0.8)" : phaseDetails.color,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 6,
            }}
          >
            {snapshot.phase === "preparation"
              ? "Préparez-vous"
              : snapshot.phase === "rest"
              ? "Repos en cours"
              : "En mouvement"}
          </div>
        </div>

        {/* ── REST PHASE : INTEGRATED NEXT EXERCISE INFO ── */}
        {snapshot.phase === "rest" && nextExercise && (
          <div
            className="animate-fade-in"
            style={{
              width: "100%",
              marginTop: 24,
              padding: "14px 16px",
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 100%)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 4px 16px rgba(2, 132, 199, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "var(--radius-lg)",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                flexShrink: 0,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Subtle transition badge overlay on thumbnail */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  backgroundColor: transitionInfo.badgeBg,
                  color: transitionInfo.badgeColor,
                  fontSize: "0.6rem",
                  padding: "2px 4px",
                  borderRadius: "4px 0 0 0",
                  fontWeight: 800,
                  zIndex: 2,
                }}
              >
                {transitionInfo.badgeEmoji}
              </div>
              <img
                src={`/animations/${nextExercise.slug || nextExercise.id}.gif`}
                alt={nextExercise.nameFr || nextExercise.name}
                style={{ width: "90%", height: "90%", objectFit: "contain", zIndex: 1 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            {/* Next Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-primary-dark)",
                    backgroundColor: "var(--color-primary-soft)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  À SUIVRE
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-subtle)" }}>
                  {snapshot.nextExercise?.targetDurationSeconds || 45}s
                </span>
              </div>
              
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nextExercise.nameFr || nextExercise.name}
              </div>
              
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  marginTop: 4,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: transitionInfo.badgeColor, fontWeight: 700 }}>
                  {transitionInfo.badgeLabel}
                </span>
                <span>•</span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {transitionInfo.instruction}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTEXTUAL GUIDANCE / INSTRUCTIONS (Work Phase Only) ── */}
      {snapshot.phase !== "rest" && (
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
                padding: "16px",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "var(--radius-xl)",
                fontSize: "0.88rem",
                lineHeight: 1.5,
                color: "var(--text-main)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                border: "1px solid var(--border-subtle)",
              }}
            >
              {currentExercise.shortDescriptionFr && (
                <p style={{ margin: 0, fontWeight: 600, color: "var(--text-muted)" }}>
                  {currentExercise.shortDescriptionFr}
                </p>
              )}
              {currentExercise.instructionsFr && currentExercise.instructionsFr.length > 0 && (
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                  {currentExercise.instructionsFr.map((step, idx) => (
                    <li key={idx} style={{ paddingLeft: 4 }}>{step}</li>
                  ))}
                </ol>
              )}
              {currentExercise.breathingGuidanceFr && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--color-primary-dark)",
                    backgroundColor: "var(--color-primary-soft)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🫁</span>
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
