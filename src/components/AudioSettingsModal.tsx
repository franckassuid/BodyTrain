import React, { useState, useEffect } from "react";
import {
  X,
  Volume2,
  Mic,
  Bell,
  Clock,
  HelpCircle,
  Check,
  Play,
  Gauge,
  User,
} from "lucide-react";
import {
  voiceCoach,
  type AudioSettings,
  type AvailableVoice,
  type VoiceGenderPreference,
} from "../services/voiceCoach.ts";
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

  const handleGenderChange = (gender: VoiceGenderPreference) => {
    // Pick the best matching voice for this gender
    const voices = voiceCoach.getAvailableVoices();
    let bestMatchUri: string | undefined;

    if (gender === "male") {
      const maleVoice = voices.find((v) => v.gender === "male");
      bestMatchUri = maleVoice?.voiceURI;
    } else if (gender === "female") {
      const femaleVoice = voices.find((v) => v.gender === "female");
      bestMatchUri = femaleVoice?.voiceURI;
    }

    const updated: Partial<AudioSettings> = {
      voiceGenderPreference: gender,
      selectedVoiceURI: bestMatchUri || undefined,
    };

    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    voiceCoach.saveSettings(updated);
    setAvailableVoices(voiceCoach.getAvailableVoices());

    // Preview
    voiceCoach.testVoice(
      gender === "male"
        ? "Bonjour ! Voici la voix d'homme pour vos séances."
        : gender === "female"
        ? "Bonjour ! Voici la voix de femme pour vos séances."
        : "Bonjour ! Voici la voix sélectionnée."
    );
  };

  const handleVoiceChange = (voiceURI: string) => {
    const matched = availableVoices.find((v) => v.voiceURI === voiceURI);
    const updated: Partial<AudioSettings> = {
      selectedVoiceURI: voiceURI,
      voiceGenderPreference: matched?.gender === "male" ? "male" : matched?.gender === "female" ? "female" : "auto",
    };
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    voiceCoach.saveSettings(updated);
    // Preview
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
        zIndex: 10000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          padding: "22px 20px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border-color)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
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
              <p style={{ fontSize: "0.78rem", margin: 0, color: "var(--text-muted)" }}>
                Personnalisez la voix de votre entraîneur
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: 6, color: "var(--text-muted)", borderRadius: "50%" }}
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
              ? "1.5px solid var(--color-primary)"
              : "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mic size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                Coach vocal
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Annonces et guidage parlé en temps réel
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

        {/* Voice Gender Preference (Homme / Femme / Auto) */}
        {settings.voiceCoachEnabled && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "12px 14px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <User size={15} color="var(--color-primary)" />
                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Type de voix
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
                  fontWeight: 600,
                }}
              >
                <Play size={12} fill="currentColor" />
                <span>Tester</span>
              </button>
            </div>

            {/* Gender Switch Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {[
                { id: "male" as VoiceGenderPreference, label: "👨 Homme" },
                { id: "female" as VoiceGenderPreference, label: "👩 Femme" },
                { id: "auto" as VoiceGenderPreference, label: "✨ Auto" },
              ].map((item) => {
                const isSelected = (settings.voiceGenderPreference || "auto") === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleGenderChange(item.id)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface)",
                      color: isSelected ? "#FFFFFF" : "var(--text-main)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.82rem",
                      border: isSelected ? "none" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Individual Voice Select */}
            {availableVoices.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                  Voix système détectée :
                </label>
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
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.gender === "male" ? "👨 " : v.gender === "female" ? "👩 " : "🎙️ "}
                      {v.name} {v.qualityBadge ? `(${v.qualityBadge})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speech Rate Control */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Gauge size={14} color="var(--text-muted)" />
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Débit : {settings.speechRate || 0.98}x
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
                      backgroundColor: settings.speechRate === rate ? "var(--color-primary)" : "var(--bg-surface)",
                      color: settings.speechRate === rate ? "#FFFFFF" : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {rate === 0.9 ? "Calme" : rate === 0.98 ? "Normal" : "Rapide"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Guidance Toggles */}
        {settings.voiceCoachEnabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Éléments vocaux
            </span>

            {/* Announce Exercise Names */}
            <div
              onClick={() => handleToggle("announceExerciseNames")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-main)" }}>
                <Bell size={16} color="var(--color-primary)" />
                <span>Annoncer le nom des exercices</span>
              </div>
              <input
                type="checkbox"
                checked={settings.announceExerciseNames}
                onChange={() => {}}
                style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
            </div>

            {/* Countdown 5s */}
            <div
              onClick={() => handleToggle("announceCountdown5s")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-main)" }}>
                <Clock size={16} color="var(--color-primary)" />
                <span>Décompte vocal (5, 4, 3, 2, 1)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.announceCountdown5s}
                onChange={() => {}}
                style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
            </div>

            {/* Guidance Tips */}
            <div
              onClick={() => handleToggle("announceGuidance")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-main)" }}>
                <HelpCircle size={16} color="var(--color-primary)" />
                <span>Conseils de posture & respiration</span>
              </div>
              <input
                type="checkbox"
                checked={settings.announceGuidance}
                onChange={() => {}}
                style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
            </div>
          </div>
        )}

        {/* Sound Effects Toggle */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
            <Volume2 size={16} color="var(--color-primary)" />
            <span>Sons & bips du minuteur</span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEffectsEnabled}
            onChange={() => {}}
            style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>

        {/* Close Button */}
        <button type="button" className="btn-primary" onClick={onClose} style={{ marginTop: 4 }}>
          <span>Terminé</span>
        </button>
      </div>
    </div>
  );
};
