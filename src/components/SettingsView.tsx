import React, { useEffect, useState } from "react";
import {
  Bell,
  Volume2,
  Vibrate,
  Clock,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { storageService } from "../services/storage.ts";
import { pushNotificationService } from "../services/pushNotifications.ts";
import { soundService } from "../services/sound.ts";
import { vibrationService } from "../services/vibration.ts";
import type { AppSettings, DayOfWeek, DefaultDurationMinutes } from "../types/settings.ts";

import { voiceCoach, type AudioSettings, type VoiceGenderPreference } from "../services/voiceCoach.ts";

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(voiceCoach.getSettings());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
    setAudioSettings(voiceCoach.getSettings());
    soundService.setEnabled(s.soundEnabled);
    vibrationService.setEnabled(s.vibrationEnabled);
  };

  const handleAudioUpdate = (updates: Partial<AudioSettings>) => {
    const updated = { ...audioSettings, ...updates };
    setAudioSettings(updated);
    voiceCoach.saveSettings(updates);
  };

  const handleVoiceGenderChange = (gender: VoiceGenderPreference) => {
    const voices = voiceCoach.getAvailableVoices();
    let bestMatchUri: string | undefined;

    if (gender === "male") {
      const maleVoice = voices.find((v) => v.gender === "male");
      bestMatchUri = maleVoice?.voiceURI;
    } else if (gender === "female") {
      const femaleVoice = voices.find((v) => v.gender === "female");
      bestMatchUri = femaleVoice?.voiceURI;
    }

    const updates: Partial<AudioSettings> = {
      voiceGenderPreference: gender,
      selectedVoiceURI: bestMatchUri || undefined,
    };

    handleAudioUpdate(updates);
    voiceCoach.testVoice(
      gender === "male"
        ? "Bonjour ! Voici la voix d'homme pour vos séances."
        : gender === "female"
        ? "Bonjour ! Voici la voix de femme pour vos séances."
        : "Bonjour ! Voici la voix sélectionnée."
    );
  };

  const handleUpdate = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = await storageService.saveSettings(updates);
    setSettings(updated);
    if (updates.soundEnabled !== undefined) soundService.setEnabled(updates.soundEnabled);
    if (updates.vibrationEnabled !== undefined) vibrationService.setEnabled(updates.vibrationEnabled);

    // If notification schedule changed and reminders are enabled, sync with backend server
    if (updated.reminderEnabled && (updates.reminderTime || updates.activeDays)) {
      pushNotificationService.updateSchedule(updated.reminderTime, updated.activeDays);
    }
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (!settings) return;
    setIsSubscribing(true);
    setNotificationStatus(null);

    try {
      if (enabled) {
        const sub = await pushNotificationService.subscribe(settings.reminderTime, settings.activeDays);
        if (sub) {
          await handleUpdate({ reminderEnabled: true });
          setNotificationStatus(`Rappels activés à ${settings.reminderTime} !`);
        } else {
          setNotificationStatus("Autorisation refusée ou non disponible.");
        }
      } else {
        await pushNotificationService.unsubscribe();
        await handleUpdate({ reminderEnabled: false });
        setNotificationStatus("Rappels désactivés.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'activation.";
      setNotificationStatus(msg);
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const handleToggleDay = (day: DayOfWeek) => {
    if (!settings) return;
    const current = settings.activeDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    handleUpdate({ activeDays: next });
  };

  const handleTestNotification = async () => {
    if (!settings) return;
    setNotificationStatus("Envoi de la notification de test...");
    const ok = await pushNotificationService.testServerPush(settings.reminderTime, settings.activeDays);
    if (ok) {
      setNotificationStatus("Notification envoyée avec succès !");
    } else {
      setNotificationStatus("Veuillez autoriser les notifications dans votre navigateur.");
    }
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const handleResetHistory = async () => {
    await storageService.clearHistory();
    setShowResetConfirm(false);
  };

  if (!settings) return null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
          Réglages
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 2 }}>
          Personnalisez votre expérience quotidienne
        </p>
      </div>

      {/* 1. Default Duration (5, 7, 10 minutes) */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
          <Clock size={18} style={{ color: "var(--color-primary)" }} />
          <span>Durée par défaut de la séance</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {([5, 7, 10] as DefaultDurationMinutes[]).map((dur) => {
            const isSelected = settings.defaultDurationMinutes === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => handleUpdate({ defaultDurationMinutes: dur })}
                style={{
                  minHeight: 48,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface-elevated)",
                  color: isSelected ? "#FFFFFF" : "var(--text-main)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "1rem",
                  border: isSelected ? "none" : "1px solid var(--border-subtle)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {dur} min
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Chaque matin, la séance sera automatiquement configurée sur cette durée.
        </div>
      </div>

      {/* 2. Morning Reminder & Active Days */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Toggle Switch */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={20} style={{ color: settings.reminderEnabled ? "var(--color-primary)" : "var(--text-subtle)" }} />
            <div>
              <div style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text-main)" }}>
                Rappel matinal quotidien
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {settings.reminderEnabled ? "🟢 Actif sur cet appareil" : "⚪ Désactivé"}
              </div>
            </div>
          </div>

          <label style={{ position: "relative", display: "inline-block", width: 50, height: 28 }}>
            <input
              type="checkbox"
              checked={settings.reminderEnabled}
              disabled={isSubscribing}
              onChange={(e) => handleToggleReminder(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.reminderEnabled ? "var(--color-primary)" : "var(--border-color)",
                borderRadius: 34,
                transition: "0.3s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: 22,
                  width: 22,
                  left: settings.reminderEnabled ? 25 : 3,
                  bottom: 3,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "0.3s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </span>
          </label>
        </div>

        {/* Reminder Time Picker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "var(--bg-surface-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
            Heure du réveil
          </div>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => handleUpdate({ reminderTime: e.target.value })}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border-color)",
              backgroundColor: "#FFFFFF",
              color: "var(--text-main)",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          />
        </div>

        {/* Days of week */}
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
            Jours actifs (par défaut : Lundi au Samedi)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {DAYS_OF_WEEK.map((d) => {
              const active = settings.activeDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => handleToggleDay(d.value)}
                  style={{
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: active ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                    color: active ? "var(--color-primary-dark)" : "var(--text-subtle)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.85rem",
                    border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Notification Button */}
        <button type="button" className="btn-secondary" onClick={handleTestNotification}>
          <Bell size={16} />
          <span>Tester la notification</span>
        </button>

        {notificationStatus && (
          <div
            className="animate-fade-in"
            style={{
              fontSize: "0.85rem",
              color: "var(--color-primary)",
              fontWeight: 600,
              textAlign: "center",
              padding: "6px 10px",
              backgroundColor: "var(--color-primary-soft)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {notificationStatus}
          </div>
        )}

        <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)", lineHeight: 1.4 }}>
          💡 Sur iPhone (iOS 16.4+), ajoutez BodyTrain à l’écran d’accueil pour recevoir les notifications Push.
        </div>
      </div>

      {/* 3. Audio, Voice Coach & Haptics */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Voice Coach Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Volume2 size={18} style={{ color: "var(--color-primary)" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text-main)" }}>Coach vocal parlé</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400 }}>Annonces et consignes pendant la séance</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={audioSettings.voiceCoachEnabled}
            onChange={(e) => handleAudioUpdate({ voiceCoachEnabled: e.target.checked })}
            style={{ width: 22, height: 22, accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>

        {/* Male / Female Voice Selector */}
        {audioSettings.voiceCoachEnabled && (
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
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)" }}>
                Voix de l'entraîneur
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => voiceCoach.testVoice()}
                style={{
                  fontSize: "0.76rem",
                  padding: "4px 8px",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                }}
              >
                ▶ Tester la voix
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {[
                { id: "male" as const, label: "👨 Homme" },
                { id: "female" as const, label: "👩 Femme" },
                { id: "auto" as const, label: "✨ Auto" },
              ].map((item) => {
                const isSelected = (audioSettings.voiceGenderPreference || "auto") === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleVoiceGenderChange(item.id)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface)",
                      color: isSelected ? "#FFFFFF" : "var(--text-main)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.85rem",
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
          </div>
        )}

        {/* Sound Effects Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Volume2 size={18} style={{ color: "var(--color-primary)" }} />
            <span>Signaux sonores (bips)</span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => handleUpdate({ soundEnabled: e.target.checked })}
            style={{ width: 22, height: 22, accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>

        {/* Vibration Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Vibrate size={18} style={{ color: "var(--color-primary)" }} />
            <span>Vibrations (haptique)</span>
          </div>
          <input
            type="checkbox"
            checked={settings.vibrationEnabled}
            onChange={(e) => handleUpdate({ vibrationEnabled: e.target.checked })}
            style={{ width: 22, height: 22, accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* 4. Safety & Medical Notice */}
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", fontWeight: 600 }}>
          <ShieldCheck size={18} />
          <span>Sécurité et conseils</span>
        </div>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
          Les séances BodyTrain sont conçues pour un réveil corporel progressif. En cas de douleur aiguë ou inhabituelle, cessez immédiatement le mouvement et consultez un professionnel de santé.
        </p>
      </div>

      {/* 5. Reset & Data Management */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-main)", fontWeight: 600 }}>
          <RotateCcw size={18} />
          <span>Gestion des données</span>
        </div>

        {!showResetConfirm ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowResetConfirm(true)}
            style={{
              color: "var(--color-accent)",
              border: "1px solid rgba(231, 111, 81, 0.3)",
              alignSelf: "flex-start",
            }}
          >
            Effacer l'historique des séances
          </button>
        ) : (
          <div
            className="animate-slide-down"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 12,
              backgroundColor: "rgba(231, 111, 81, 0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-accent)", fontSize: "0.88rem", fontWeight: 600 }}>
              <AlertTriangle size={16} />
              <span>Confirmer la suppression de l'historique ?</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleResetHistory}
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Oui, tout effacer
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowResetConfirm(false)}
                style={{ padding: "8px 14px", fontSize: "0.85rem" }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
