import React from "react";
import { PlayCircle, Dumbbell, History, Settings } from "lucide-react";

export type NavTab = "workout" | "library" | "history" | "settings";

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item ${activeTab === "workout" ? "active" : ""}`}
        onClick={() => onSelectTab("workout")}
        aria-label="Séance du jour"
      >
        <PlayCircle />
        <span>Séance</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === "library" ? "active" : ""}`}
        onClick={() => onSelectTab("library")}
        aria-label="Bibliothèque d'exercices"
      >
        <Dumbbell />
        <span>Exercices</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === "history" ? "active" : ""}`}
        onClick={() => onSelectTab("history")}
        aria-label="Historique des séances"
      >
        <History />
        <span>Historique</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
        onClick={() => onSelectTab("settings")}
        aria-label="Réglages de l'application"
      >
        <Settings />
        <span>Réglages</span>
      </button>
    </nav>
  );
};
