import React, { useState } from "react";
import { Play, RefreshCw, Clock, Activity, ListChecks, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { GeneratedSession } from "../types/session.ts";
import { CATEGORY_LABELS, SESSION_PHASE_LABELS } from "../types/enums.ts";
import { ExerciseDetailModal } from "./ExerciseDetailModal.tsx";
import type { Exercise } from "../types/exercise.ts";

interface SessionPreviewProps {
  session: GeneratedSession;
  onStart: () => void;
  onRegenerate: () => void;
  onBackToCheckIn: () => void;
}

export const SessionPreview: React.FC<SessionPreviewProps> = ({
  session,
  onStart,
  onRegenerate,
  onBackToCheckIn,
}) => {
  const [showFullList, setShowFullList] = useState(true);
  const [inspectedExercise, setInspectedExercise] = useState<Exercise | null>(null);

  const durationMin = Math.round(session.estimatedTotalSeconds / 60);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overview Card */}
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "22px 20px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        }}
      >
        {/* Badges Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span className="badge">
            <Clock size={14} />
            <span>~{durationMin} min</span>
          </span>

          <span className="badge badge-accent">
            <Activity size={14} />
            <span>{session.intensityLevel}</span>
          </span>

          <span
            className="badge"
            style={{ backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-muted)" }}
          >
            <ListChecks size={14} />
            <span>{session.exercises.length} mouvements</span>
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            Votre séance de ce matin
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
            {session.description}
          </p>
        </div>

        {/* Dynamic Exercise List */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: "14px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setShowFullList(!showFullList)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={15} color="var(--color-primary)" />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>
                Programme ({session.exercises.length} exercices)
              </span>
            </div>
            <button type="button" className="btn-ghost" style={{ padding: 4, minHeight: 32 }}>
              {showFullList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 12,
              maxHeight: showFullList ? "420px" : "180px",
              overflowY: "auto",
              transition: "max-height 0.3s ease",
            }}
          >
            {session.exercises.map((item, idx) => {
              const slug = item.exercise.slug || item.exercise.id;
              const photoUrl = `/exercises/${slug}/start.webp`;

              return (
                <div
                  key={`${item.exercise.id}-${idx}`}
                  onClick={() => setInspectedExercise(item.exercise)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface)",
                    fontSize: "0.88rem",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Index or Thumbnail */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-surface-elevated)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt={item.exercise.nameFr || item.exercise.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.9rem" }}>
                        {item.exercise.nameFr || item.exercise.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-primary)" }}>
                          {SESSION_PHASE_LABELS[item.phase] || item.phase}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>•</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>
                          {CATEGORY_LABELS[item.exercise.category] || item.exercise.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-primary-soft)",
                      color: "var(--color-primary-dark)",
                      flexShrink: 0,
                    }}
                  >
                    {item.targetDurationSeconds}s
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-primary" onClick={onStart}>
            <Play size={20} fill="currentColor" />
            <span>Commencer la séance</span>
          </button>

          <button type="button" className="btn-secondary" onClick={onRegenerate}>
            <RefreshCw size={18} />
            <span>Générer une autre proposition</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={onBackToCheckIn}
            style={{ marginTop: 2 }}
          >
            <span>Modifier mes réponses</span>
          </button>
        </div>
      </div>

      {/* Inspect Exercise Modal */}
      <ExerciseDetailModal
        exercise={inspectedExercise}
        isOpen={Boolean(inspectedExercise)}
        onClose={() => setInspectedExercise(null)}
      />
    </div>
  );
};
