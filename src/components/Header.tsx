import React from "react";
import { Sparkles, WifiOff } from "lucide-react";

interface HeaderProps {
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isOnline = true }) => {
  return (
    <header className="app-header">
      <div className="app-title">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: "var(--color-primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary)",
          }}
        >
          <Sparkles size={18} />
        </div>
        <span>BodyTrain</span>
      </div>

      {!isOnline && (
        <div
          className="badge"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
          }}
        >
          <WifiOff size={12} />
          <span>Hors ligne</span>
        </div>
      )}
    </header>
  );
};
