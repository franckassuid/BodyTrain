import React from "react";
import { ShieldAlert, X } from "lucide-react";

interface SafetyBannerProps {
  onDismiss: () => void;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ onDismiss }) => {
  return (
    <div
      className="card animate-fade-in"
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
        padding: "14px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }}>
        <ShieldAlert size={20} />
      </div>

      <div style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
        <strong style={{ color: "var(--text-main)", display: "block", marginBottom: 2 }}>
          Règle de prudence
        </strong>
        Arrête le mouvement en cas de douleur vive, croissante ou inhabituelle. Si une gêne persiste,
        s’aggrave ou limite tes mouvements, demande l’avis d’un professionnel.
      </div>

      <button
        type="button"
        onClick={onDismiss}
        style={{
          color: "var(--text-subtle)",
          padding: 4,
          minWidth: 32,
          minHeight: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
        }}
        aria-label="Fermer le message de prudence"
      >
        <X size={16} />
      </button>
    </div>
  );
};
