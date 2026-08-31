import React from "react";
import { createPortal } from "react-dom";
import { X, Play, Clock, Flame, ShieldAlert, CheckCircle2, Pause, RotateCcw, AlertTriangle } from "lucide-react";
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

  const isCompleted = session.status === "completed";
  const completedIds = session.completedExerciseIds || [];
  const completedCount = completedIds.length;

  const exerciseIds =
    session.proposedExerciseIds && session.proposedExerciseIds.length > 0
      ? session.proposedExerciseIds
      : completedIds.length > 0
      ? completedIds
      : [];

  const totalCount = exerciseIds.length;

  // The index of the exercise where the workout was stopped (0-indexed)
  const stopIndex = !isCompleted ? Math.min(completedCount, Math.max(0, totalCount - 1)) : -1;
  const stoppedExerciseId = stopIndex >= 0 ? exerciseIds[stopIndex] : null;
  const stoppedExercise = stoppedExerciseId
    ? EXERCISES_MAP[stoppedExerciseId] ||
      EXERCISES.find((e) => e.id === stoppedExerciseId || e.slug === stoppedExerciseId)
    : null;

  const durationMin = Math.max(
    1,
    Math.round((session.actualDurationSeconds || session.plannedDurationSeconds) / 60)
  );
  const durationSec = (session.actualDurationSeconds || session.plannedDurationSeconds) % 60;

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

  const handleReplayFromStart = () => {
    const replayable = convertHistoryRecordToGeneratedSession(session, 0);
    onReplaySession(replayable);
    onClose();
  };

  const handleResumeFromStop = () => {
    const startIdx = stopIndex >= 0 ? stopIndex : 0;
    const replayable = convertHistoryRecordToGeneratedSession(session, startIdx);
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
          maxHeight: "90vh",
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  backgroundColor: isCompleted
                    ? "var(--color-primary-soft)"
                    : "rgba(244, 162, 97, 0.2)",
                  color: isCompleted ? "var(--color-primary-dark)" : "#D97706",
                }}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Séance complétée</span>
                  </>
                ) : (
                  <>
                    <Pause size={12} />
                    <span>Interrompue ({completedCount}/{totalCount})</span>
                  </>
                )}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {totalCount} exercice{totalCount > 1 ? "s" : ""}
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

        {/* Interrupted Alert Banner */}
        {!isCompleted && (
          <div
            style={{
              padding: "12px 18px",
              backgroundColor: "rgba(244, 162, 97, 0.12)",
              borderBottom: "1.5px solid rgba(244, 162, 97, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(244, 162, 97, 0.22)",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#D97706" }}>
                Arrêt à l'exercice {stopIndex + 1} sur {totalCount}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 1 }}>
                {stoppedExercise ? (
                  <>
                    Séance arrêtée pendant :{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {stoppedExercise.nameFr || stoppedExercise.name}
                    </strong>
                  </>
                ) : (
                  <>{completedCount} exercice(s) validé(s) sur {totalCount} prévus</>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Exercises Breakdown List */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase" }}>
              Déroulement des exercices
            </span>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {isCompleted
                ? "Tous les exercices ont été réalisés"
                : `${completedCount} validé${completedCount > 1 ? "s" : ""} • ${totalCount - completedCount} restant${totalCount - completedCount > 1 ? "s" : ""}`}
            </span>
          </div>

          {exerciseIds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Aucun détail d'exercice disponible pour cette séance.
            </div>
          ) : (
            exerciseIds.map((exId, index) => {
              const ex = EXERCISES_MAP[exId] || EXERCISES.find((e) => e.id === exId || e.slug === exId);
              const slug = ex?.slug || exId;
              const gifUrl = `/animations/${slug}.gif`;

              const isItemCompleted = isCompleted || index < completedCount;
              const isItemStoppedHere = !isCompleted && index === stopIndex;
              const isItemNotReached = !isCompleted && index > stopIndex;

              return (
                <div
                  key={`${exId}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: isItemStoppedHere
                      ? "rgba(244, 162, 97, 0.08)"
                      : "var(--bg-surface)",
                    border: isItemStoppedHere
                      ? "1.5px solid #F4A261"
                      : isItemCompleted
                      ? "1px solid rgba(45, 106, 79, 0.25)"
                      : "1px dashed var(--border-subtle)",
                    opacity: isItemNotReached ? 0.6 : 1,
                    boxShadow: isItemStoppedHere ? "0 4px 14px rgba(244, 162, 97, 0.15)" : "none",
                  }}
                >
                  {/* Step status icon / number */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: isItemCompleted
                        ? "var(--color-primary)"
                        : isItemStoppedHere
                        ? "#D97706"
                        : "var(--bg-surface-elevated)",
                      color: isItemCompleted || isItemStoppedHere ? "#FFFFFF" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {isItemCompleted ? (
                      <CheckCircle2 size={15} />
                    ) : isItemStoppedHere ? (
                      <Pause size={13} fill="currentColor" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Thumbnail GIF */}
                  <div
                    style={{
                      width: 46,
                      height: 46,
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

                      {/* Status Tag */}
                      {isItemCompleted && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.68rem",
                            color: "var(--color-primary-dark)",
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={12} /> Validé
                        </span>
                      )}

                      {isItemStoppedHere && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.68rem",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "rgba(244, 162, 97, 0.22)",
                            color: "#D97706",
                            fontWeight: 800,
                          }}
                        >
                          🛑 Arrêt ici
                        </span>
                      )}

                      {isItemNotReached && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-subtle)",
                            fontWeight: 500,
                          }}
                        >
                          Non réalisé
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.90rem",
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

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isCompleted && stopIndex < totalCount && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleResumeFromStop}
                style={{
                  padding: "10px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(244, 162, 97, 0.15)",
                  color: "#D97706",
                  border: "1px solid rgba(244, 162, 97, 0.3)",
                }}
                title={`Reprendre dès l'exercice ${stopIndex + 1}`}
              >
                <Play size={16} fill="currentColor" />
                <span>Reprendre (Ex. {stopIndex + 1})</span>
              </button>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleReplayFromStart}
              style={{
                padding: "10px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.90rem",
                fontWeight: 700,
              }}
            >
              <RotateCcw size={16} />
              <span>{isCompleted ? "Refaire cette séance" : "Refaire du début"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
