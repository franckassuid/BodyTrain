import React from "react";
import { CheckCircle2, Clock, Award, ArrowRight } from "lucide-react";

interface SessionCompleteProps {
  actualDurationSeconds: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  isPartial?: boolean;
  onFinish: () => void;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  actualDurationSeconds,
  completedExercisesCount,
  totalExercisesCount,
  isPartial = false,
  onFinish,
}) => {
  const durationMin = Math.max(1, Math.round(actualDurationSeconds / 60));

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingTop: 10,
      }}
    >
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
          padding: "32px 20px",
        }}
      >
        {/* Success Check Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary-soft)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(45, 106, 79, 0.15)",
          }}
        >
          <CheckCircle2 size={44} />
        </div>

        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25 }}>
            {isPartial ? "Bien joué pour cet effort !" : "Séance terminée !"}
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
            {isPartial
              ? "Chaque minute passée à bouger est bénéfique pour ton corps et ton esprit."
              : "Tu commences la journée avec énergie et mobilité. Prends soin de toi !"}
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "16px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Clock size={20} style={{ color: "var(--color-primary)" }} />
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
              ~{durationMin} min
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 500 }}>
              DURÉE EFFECTUÉE
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "16px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Award size={20} style={{ color: "var(--color-accent)" }} />
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
              {completedExercisesCount} / {totalExercisesCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 500 }}>
              MOUVEMENTS
            </div>
          </div>
        </div>

        <button type="button" className="btn-primary" onClick={onFinish} style={{ marginTop: 8 }}>
          <span>Terminer</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
