import React, { useState } from "react";
import { X, Play, Volume2, Wind, Clock } from "lucide-react";
import type { Exercise } from "../types/exercise.ts";
import { ExerciseAnimation } from "./ExerciseAnimation.tsx";
import { CATEGORY_LABELS, SESSION_PHASE_LABELS } from "../types/enums.ts";
import { voiceCoach } from "../services/voiceCoach.ts";

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayExercise?: (exercise: Exercise, durationSeconds: number) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onPlayExercise,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(45);

  if (!isOpen || !exercise) return null;

  const handleSpeakGuidance = () => {
    voiceCoach.announceExerciseStart(
      exercise.nameFr || exercise.name || "Exercice",
      exercise.breathingGuidanceFr || exercise.shortDescriptionFr
    );
  };

  const handleStartSingleExercise = () => {
    if (onPlayExercise) {
      onPlayExercise(exercise, selectedDuration);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px 12px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          color: "var(--text-main, #1F2937)",
          borderRadius: "var(--radius-xl)",
          padding: "20px 18px",
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1.5px solid var(--border-color, #E2E8F0)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--color-primary-soft)",
                  color: "var(--color-primary-dark)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {CATEGORY_LABELS[exercise.category] || exercise.category}
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-subtle)" }}>
                • Intensité {exercise.intensity}/5
              </span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", margin: 0, lineHeight: 1.25 }}>
              {exercise.nameFr || exercise.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{
              padding: 6,
              color: "var(--text-muted)",
              marginLeft: 8,
              borderRadius: "50%",
              backgroundColor: "var(--bg-surface-elevated)",
            }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Animation / Posture Demonstration */}
        <ExerciseAnimation exercise={exercise} phase="work" />

        {/* PRIMARY ACTION: Launch Exercise with Duration Picker */}
        {onPlayExercise && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "12px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--color-primary-soft)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                <Clock size={16} color="var(--color-primary)" />
                <span>Durée du minuteur</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[30, 45, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedDuration(sec)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      fontWeight: selectedDuration === sec ? 700 : 500,
                      backgroundColor: selectedDuration === sec ? "var(--color-primary)" : "var(--bg-surface)",
                      color: selectedDuration === sec ? "#FFFFFF" : "var(--text-main)",
                      border: selectedDuration === sec ? "none" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleStartSingleExercise}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 6px 18px rgba(30, 107, 74, 0.3)",
              }}
            >
              <Play size={18} fill="currentColor" />
              <span>Lancer cet exercice ({selectedDuration}s)</span>
            </button>
          </div>
        )}

        {/* Voice Coach Button */}
        <button
          type="button"
          className="btn-secondary"
          onClick={handleSpeakGuidance}
          style={{
            fontSize: "0.82rem",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: "var(--color-primary-soft)",
            borderColor: "transparent",
            color: "var(--color-primary-dark)",
            fontWeight: 600,
          }}
        >
          <Volume2 size={16} />
          <span>Écouter les consignes vocales</span>
        </button>

        {/* Short Description */}
        {exercise.shortDescriptionFr && (
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.86rem",
              color: "var(--text-main)",
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {exercise.shortDescriptionFr}
          </div>
        )}

        {/* Step-by-step instructions */}
        {exercise.instructionsFr && exercise.instructionsFr.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
              Comment réaliser le mouvement :
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                display: "flex",
                flexDirection: "column",
                gap: 5,
                fontSize: "0.84rem",
                color: "var(--text-muted)",
                lineHeight: 1.4,
              }}
            >
              {exercise.instructionsFr.map((step, idx) => (
                <li key={idx}>
                  <span style={{ color: "var(--text-main)" }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Breathing guidance */}
        {exercise.breathingGuidanceFr && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              backgroundColor: "rgba(45, 106, 79, 0.08)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(45, 106, 79, 0.15)",
            }}
          >
            <Wind size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                Conseil de respiration
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-main)", marginTop: 2, lineHeight: 1.4 }}>
                {exercise.breathingGuidanceFr}
              </div>
            </div>
          </div>
        )}

        {/* Phases & Adaptations Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {exercise.suitablePhases?.map((phase) => (
            <span
              key={phase}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                color: "var(--text-muted)",
              }}
            >
              🌱 {SESSION_PHASE_LABELS[phase]}
            </span>
          ))}

          {exercise.compatibleWithUpperBodyDiscomfort && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                color: "#0284C7",
              }}
            >
              ✓ Gêne haut du corps OK
            </span>
          )}

          {exercise.compatibleWithLowerBodyDiscomfort && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(244, 162, 97, 0.14)",
                color: "#E76F51",
              }}
            >
              ✓ Gêne bas du corps OK
            </span>
          )}
        </div>

        {/* Close Button */}
        <button type="button" className="btn-ghost" onClick={onClose} style={{ marginTop: 2, padding: "8px" }}>
          <span>Fermer</span>
        </button>
      </div>
    </div>
  );
};
