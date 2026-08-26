import React from "react";
import { X, Volume2, Wind } from "lucide-react";
import type { Exercise } from "../types/exercise.ts";
import { ExerciseAnimation } from "./ExerciseAnimation.tsx";
import { CATEGORY_LABELS, SESSION_PHASE_LABELS } from "../types/enums.ts";
import { voiceCoach } from "../services/voiceCoach.ts";

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !exercise) return null;

  const handleSpeakGuidance = () => {
    voiceCoach.announceExerciseStart(
      exercise.nameFr || exercise.name || "Exercice",
      exercise.breathingGuidanceFr || exercise.shortDescriptionFr
    );
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
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          padding: "24px 20px",
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border-color)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
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
            style={{ padding: 6, color: "var(--text-muted)", marginLeft: 8 }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Animation / Posture Demonstration */}
        <ExerciseAnimation exercise={exercise} phase="work" />

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
              padding: "12px 14px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.88rem",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>
              Comment réaliser le mouvement :
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.45,
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
              padding: "12px 14px",
              backgroundColor: "rgba(45, 106, 79, 0.08)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(45, 106, 79, 0.15)",
            }}
          >
            <Wind size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                Conseil de respiration
              </div>
              <div style={{ fontSize: "0.84rem", color: "var(--text-main)", marginTop: 2, lineHeight: 1.4 }}>
                {exercise.breathingGuidanceFr}
              </div>
            </div>
          </div>
        )}

        {/* Phases & Adaptations Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {exercise.suitablePhases?.map((phase) => (
            <span
              key={phase}
              style={{
                fontSize: "0.74rem",
                fontWeight: 600,
                padding: "3px 8px",
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
                fontSize: "0.74rem",
                fontWeight: 600,
                padding: "3px 8px",
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
                fontSize: "0.74rem",
                fontWeight: 600,
                padding: "3px 8px",
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
        <button type="button" className="btn-primary" onClick={onClose} style={{ marginTop: 6 }}>
          <span>Fermer</span>
        </button>
      </div>
    </div>
  );
};
