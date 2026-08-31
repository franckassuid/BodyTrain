import React from "react";
import { createPortal } from "react-dom";
import { X, Play, Clock, Flame, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { SessionHistoryRecord } from "../types/history.ts";
import type { GeneratedSession } from "../types/session.ts";
import { EXERCISES, EXERCISES_MAP } from "../data/exercisesData.ts";
import { CATEGORY_LABELS, DISCOMFORT_LABELS } from "../types/enums.ts";
import { convertHistoryRecordToGeneratedSession } from "../utils/historyReplay.ts";

interface PastSessionDetailModalProps {
  session: SessionHistoryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onReplaySession: (generatedSession: GeneratedSession) => void;
}

export const PastSessionDetailModal: React.FC<PastSessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  onReplaySession,
}) => {
  if (!isOpen || !session) return null;

  const exerciseIds =
    session.proposedExerciseIds && session.proposedExerciseIds.length > 0
      ? session.proposedExerciseIds
      : session.completedExerciseIds || [];

  const durationMin = Math.max(
    1,
    Math.round((session.actualDurationSeconds || session.plannedDurationSeconds) / 60)
  );

  const durationSec = (session.actualDurationSeconds || session.plannedDurationSeconds) % 60;
  const isCompleted = session.status === "completed";

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReplay = () => {
    const replayable = convertHistoryRecordToGeneratedSession(session);
    onReplaySession(replayable);
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px 12px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          color: "var(--text-main, #1F2937)",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1.5px solid var(--border-color, #E2E8F0)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  backgroundColor: isCompleted
                    ? "var(--color-primary-soft)"
                    : "rgba(244, 162, 97, 0.2)",
                  color: isCompleted ? "var(--color-primary-dark)" : "#E76F51",
                }}
              >
                {isCompleted ? "Séance complétée" : "Séance partielle"}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {exerciseIds.length} exercice{exerciseIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <h3 style={{ fontSize: "1.12rem", fontWeight: 800, margin: 0, textTransform: "capitalize" }}>
              {formatDate(session.date)}
            </h3>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: "50%" }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "var(--bg-surface-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={15} style={{ color: "var(--color-primary)" }} />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", fontWeight: 600 }}>DURÉE</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                {durationMin} min {durationSec > 0 ? `${durationSec}s` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Flame size={15} style={{ color: "var(--color-accent)" }} />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", fontWeight: 600 }}>ÉNERGIE</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{session.energyScore}/10</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldAlert size={15} style={{ color: "var(--color-primary-dark)" }} />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", fontWeight: 600 }}>GÊNE</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                {DISCOMFORT_LABELS[session.discomfortZone] || session.discomfortZone}
              </div>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase" }}>
            Déroulement des exercices
          </div>

          {exerciseIds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Aucun détail d'exercice disponible pour cette séance.
            </div>
          ) : (
            exerciseIds.map((exId, index) => {
              const ex = EXERCISES_MAP[exId] || EXERCISES.find((e) => e.id === exId || e.slug === exId);
              const isExerciseCompleted = session.completedExerciseIds?.includes(exId);
              const slug = ex?.slug || exId;
              const gifUrl = `/animations/${slug}.gif`;

              return (
                <div
                  key={`${exId}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Step number */}
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-surface-elevated)",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>

                  {/* Thumbnail GIF */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-md)",
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
                      src={gifUrl}
                      alt={ex?.nameFr || exId}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  </div>

                  {/* Exercise Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {ex && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--color-primary-soft)",
                            color: "var(--color-primary-dark)",
                          }}
                        >
                          {CATEGORY_LABELS[ex.category] || ex.category}
                        </span>
                      )}
                      {isExerciseCompleted && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.68rem",
                            color: "var(--color-primary-dark)",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} /> Réalisé
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "var(--text-main)",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ex?.nameFr || ex?.name || exId}
                    </div>
                  </div>

                  {/* Standard Duration */}
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-subtle)", flexShrink: 0 }}>
                    {ex?.defaultDurationSeconds || 45}s
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: "10px 14px", fontSize: "0.88rem" }}
          >
            Fermer
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleReplay}
            style={{
              padding: "10px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.92rem",
              fontWeight: 700,
            }}
          >
            <Play size={18} fill="currentColor" />
            <span>Refaire cette séance</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
