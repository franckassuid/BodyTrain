import React, { useState, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  Bell,
  Clock,
  HelpCircle,
  Check,
  Play,
  Sparkles,
  Gauge,
} from "lucide-react";
import { voiceCoach, type AudioSettings, type AvailableVoice } from "../services/voiceCoach.ts";
import { soundService } from "../services/sound.ts";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(voiceCoach.getSettings());
  const [availableVoices, setAvailableVoices] = useState<AvailableVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSettings(voiceCoach.getSettings());
      setAvailableVoices(voiceCoach.getAvailableVoices());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof AudioSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    voiceCoach.saveSettings(updated);
    if (key === "soundEffectsEnabled") {
      soundService.setEnabled(updated.soundEffectsEnabled);
    }
  };

  const handleVoiceChange = (voiceURI: string) => {
    const updated = { ...settings, selectedVoiceURI: voiceURI };
    setSettings(updated);
    voiceCoach.saveSettings(updated);
    // Preview the new voice immediately
    voiceCoach.testVoice("Bonjour ! Voici la voix sélectionnée pour vos séances matinales.");
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...settings, speechRate: rate };
    setSettings(updated);
    voiceCoach.saveSettings(updated);
  };

  const handleTestVoice = () => {
    voiceCoach.testVoice();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          padding: "22px 20px",
          width: "100%",
          maxWidth: 400,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border-color)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Volume2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                Audio & Coach Vocal
              </h3>
              <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--text-muted)" }}>
                Voix naturelle & guidage sonore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: 6, color: "var(--text-muted)" }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Master Voice Toggle */}
        <div
          onClick={() => handleToggle("voiceCoachEnabled")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: settings.voiceCoachEnabled
              ? "var(--color-primary-soft)"
              : "var(--bg-surface-elevated)",
            cursor: "pointer",
            border: settings.voiceCoachEnabled
              ? "1px solid var(--color-primary)"
              : "1px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mic size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-main)" }}>
                Coach vocal
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Commentaires vocaux en temps réel
              </div>
            </div>
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "var(--radius-full)",
              backgroundColor: settings.voiceCoachEnabled ? "var(--color-primary)" : "var(--border-color)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {settings.voiceCoachEnabled && <Check size={14} />}
          </div>
        </div>

        {/* Voice Selection & Quality */}
        {settings.voiceCoachEnabled && availableVoices.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "12px 14px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={15} color="var(--color-primary)" />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
                  Choix de la voix
                </span>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleTestVoice}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Play size={12} fill="currentColor" />
                <span>Tester</span>
              </button>
            </div>

            <select
              value={settings.selectedVoiceURI || (availableVoices[0]?.voiceURI ?? "")}
              onChange={(e) => handleVoiceChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.qualityBadge ? `✨ ${v.name} (${v.qualityBadge})` : v.name}
                </option>
              ))}
            </select>

            {/* Speech Rate Control */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Gauge size={14} color="var(--text-muted)" />
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Débit de parole : {settings.speechRate || 0.98}x
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0.9, 0.98, 1.05].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRateChange(rate)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      border: "none",
                      backgroundColor:
                        (settings.speechRate || 0.98) === rate
                          ? "var(--color-primary)"
                          : "var(--bg-surface)",
                      color:
                        (settings.speechRate || 0.98) === rate
                          ? "#FFFFFF"
                          : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {rate === 0.9 ? "Posé" : rate === 0.98 ? "Naturel" : "Dynamique"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Options List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            opacity: settings.voiceCoachEnabled ? 1 : 0.45,
            pointerEvents: settings.voiceCoachEnabled ? "auto" : "none",
          }}
        >
          {/* Announce Exercise Names */}
          <div
            onClick={() => handleToggle("announceExerciseNames")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} color="var(--text-subtle)" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                Annoncer le nom des exercices
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.announceExerciseNames}
              onChange={() => {}}
              style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>

          {/* 5-second countdown */}
          <div
            onClick={() => handleToggle("announceCountdown5s")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color="var(--text-subtle)" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                Décompte vocal (5 dernières secondes)
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.announceCountdown5s}
              onChange={() => {}}
              style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>

          {/* Guidance tips */}
          <div
            onClick={() => handleToggle("announceGuidance")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle size={16} color="var(--text-subtle)" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                Conseils d'exécution & respiration
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.announceGuidance}
              onChange={() => {}}
              style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Sound effects toggle */}
        <div
          onClick={() => handleToggle("soundEffectsEnabled")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {settings.soundEffectsEnabled ? (
              <Volume2 size={16} color="var(--text-subtle)" />
            ) : (
              <VolumeX size={16} color="var(--text-muted)" />
            )}
            <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
              Bips et signaux sonores
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEffectsEnabled}
            onChange={() => {}}
            style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>

        {/* Close / Save button */}
        <button type="button" className="btn-primary" onClick={onClose} style={{ marginTop: 2 }}>
          <span>Terminé</span>
        </button>
      </div>
    </div>
  );
};
