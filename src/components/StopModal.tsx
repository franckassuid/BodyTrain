import React from "react";
import { Check, X, Play } from "lucide-react";

interface StopModalProps {
  isOpen: boolean;
  completedExercisesCount: number;
  elapsedSeconds: number;
  onSavePartial: () => void;
  onDiscard: () => void;
  onResume: () => void;
}

export const StopModal: React.FC<StopModalProps> = ({
  isOpen,
  completedExercisesCount,
  elapsedSeconds,
  onSavePartial,
  onDiscard,
  onResume,
}) => {
  if (!isOpen) return null;

  const elapsedMin = Math.max(1, Math.round(elapsedSeconds / 60));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 200,
      }}
      className="animate-fade-in"
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "24px 20px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
            Tu peux t’arrêter ici
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginTop: 8, lineHeight: 1.45 }}>
            Même quelques minutes comptent. Tu as déjà réalisé {completedExercisesCount} exercice
            {completedExercisesCount > 1 ? "s" : ""} en ~{elapsedMin} minute{elapsedMin > 1 ? "s" : ""}.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn-primary" onClick={onSavePartial}>
            <Check size={18} />
            <span>Valider ce que j’ai fait</span>
          </button>

          <button type="button" className="btn-secondary" onClick={onDiscard}>
            <X size={18} />
            <span>Arrêter sans enregistrer</span>
          </button>

          <button type="button" className="btn-ghost" onClick={onResume} style={{ marginTop: 4 }}>
            <Play size={18} fill="currentColor" />
            <span>Continuer la séance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
