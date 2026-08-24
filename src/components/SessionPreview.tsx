import React, { useState } from "react";
import { Play, RefreshCw, Clock, Activity, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import type { GeneratedSession } from "../types/session.ts";
import { CATEGORY_LABELS } from "../types/enums.ts";

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
  const [showFullList, setShowFullList] = useState(false);

  const durationMin = Math.round(session.estimatedTotalSeconds / 60);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overview Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
            Ta routine de ce matin
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
            {session.description}
          </p>
        </div>

        {/* Compact Exercise List */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 14px",
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
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
              Programme ({session.exercises.length} exercices)
            </span>
            <button type="button" className="btn-ghost" style={{ padding: 4, minHeight: 32 }}>
              {showFullList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 10,
              maxHeight: showFullList ? "400px" : "180px",
              overflowY: "auto",
              transition: "max-height 0.3s ease",
            }}
          >
            {session.exercises.map((item, idx) => (
              <div
                key={`${item.exercise.id}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  fontSize: "0.88rem",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary-soft)",
                      color: "var(--color-primary-dark)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {item.exercise.nameFr || item.exercise.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                      {CATEGORY_LABELS[item.exercise.category] || item.exercise.category}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  {item.exercise.mode === "repetitions"
                    ? `${item.targetRepetitions || 10} reps`
                    : `${item.targetDurationSeconds}s`}
                </div>
              </div>
            ))}
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
            <span>Une autre séance</span>
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
    </div>
  );
};
