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
  // Minimized by default so all action buttons fit on the page without scrolling
  const [showFullList, setShowFullList] = useState<boolean>(false);
  const [inspectedExercise, setInspectedExercise] = useState<Exercise | null>(null);

  const durationMin = Math.round(session.estimatedTotalSeconds / 60);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Overview Card */}
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "20px 18px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        }}
      >
        {/* Badges Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap", gap: 6 }}>
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

          {session.warmupExtraMinutes && session.warmupExtraMinutes > 0 ? (
            <span
              className="badge"
              style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
            >
              <span>🧘 Échauffement +{session.warmupExtraMinutes} min</span>
            </span>
          ) : null}

          {session.cooldownExtraMinutes && session.cooldownExtraMinutes > 0 ? (
            <span
              className="badge"
              style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
            >
              <span>✨ Étirements +{session.cooldownExtraMinutes} min</span>
            </span>
          ) : null}
        </div>

        {/* Title & Description */}
        <div>
          <h1 style={{ fontSize: "1.38rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            Votre séance de ce matin
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>
            {session.description}
          </p>
        </div>

        {/* Collapsible Exercise Program Accordion (Minimized by default) */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 14px",
            border: "1px solid var(--border-subtle)",
            transition: "all 0.25s ease",
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Programme des {session.exercises.length} exercices
                </span>
                {!showFullList && (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 600 }}>
                    Toucher pour voir le détail des mouvements
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{
                padding: 4,
                minHeight: 32,
                color: "var(--text-muted)",
              }}
              aria-label={showFullList ? "Masquer la liste" : "Afficher la liste"}
            >
              {showFullList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Expanded Exercise List */}
          {showFullList && (
            <div
              className="animate-slide-down"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
                maxHeight: "360px",
                overflowY: "auto",
                paddingTop: 4,
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
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "0.85rem",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
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
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.88rem" }}>
                          {item.exercise.nameFr || item.exercise.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-primary)" }}>
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
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        padding: "3px 7px",
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
          )}
        </div>

        {/* Action Buttons (All immediately visible on screen) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onStart}
            style={{
              padding: "14px",
              fontSize: "1.05rem",
              boxShadow: "0 6px 20px rgba(30, 107, 74, 0.3)",
            }}
          >
            <Play size={20} fill="currentColor" />
            <span>Commencer la séance</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onRegenerate}
            style={{ padding: "10px 14px", fontSize: "0.9rem" }}
          >
            <RefreshCw size={17} />
            <span>Générer une autre proposition</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={onBackToCheckIn}
            style={{ padding: "8px", fontSize: "0.85rem" }}
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
