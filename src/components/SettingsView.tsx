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
import type { AppSettings, DayOfWeek } from "../types/settings.ts";

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

      {/* 1. Workout Flow & Durations: Premium Routine Flow UI */}
      {(() => {
        const warmup = settings.warmupExtraMinutes || 0;
        const main = settings.defaultDurationMinutes || 7;
        const cooldown = settings.cooldownExtraMinutes || 0;
        const total = warmup + main + cooldown;

        const warmupPct = total > 0 ? (warmup / total) * 100 : 0;
        const mainPct = total > 0 ? (main / total) * 100 : 100;
        const cooldownPct = total > 0 ? (cooldown / total) * 100 : 0;

        return (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "20px 18px" }}>
            {/* Header & Total Badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-primary-soft)",
                    color: "var(--color-primary-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    Déroulement de la séance
                  </h3>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>
                    Structure quotidienne personnalisée
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  backgroundColor: "var(--color-primary-soft)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(27, 67, 50, 0.12)",
                }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Durée totale
                </span>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-primary-dark)", lineHeight: 1.1 }}>
                  {total} min
                </span>
              </div>
            </div>

            {/* Visual Multi-Segment Routine Timeline Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  width: "100%",
                  height: 10,
                  borderRadius: 99,
                  backgroundColor: "var(--bg-surface-elevated)",
                  overflow: "hidden",
                  display: "flex",
                  gap: 2,
                  padding: 1,
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                {warmup > 0 && (
                  <div
                    style={{
                      width: `${warmupPct}%`,
                      height: "100%",
                      borderRadius: 99,
                      backgroundColor: "#2A9D8F",
                      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    title={`Échauffement: +${warmup} min`}
                  />
                )}
                <div
                  style={{
                    width: `${mainPct}%`,
                    height: "100%",
                    borderRadius: 99,
                    backgroundColor: "var(--color-primary)",
                    transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  title={`Séance: ${main} min`}
                />
                {cooldown > 0 && (
                  <div
                    style={{
                      width: `${cooldownPct}%`,
                      height: "100%",
                      borderRadius: 99,
                      backgroundColor: "#E76F51",
                      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    title={`Étirements: +${cooldown} min`}
                  />
                )}
              </div>

              {/* Timeline Micro Legend */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: warmup > 0 ? "#2A9D8F" : "var(--border-color)" }} />
                  <span>1. Avant ({warmup > 0 ? `+${warmup}m` : "Off"})</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                  <span>2. Séance ({main}m)</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cooldown > 0 ? "#E76F51" : "var(--border-color)" }} />
                  <span>3. Après ({cooldown > 0 ? `+${cooldown}m` : "Off"})</span>
                </span>
              </div>
            </div>

            {/* 3 Sequential Stage Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {/* STAGE 1: Échauffement préparatoire */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: warmup > 0 ? "rgba(42, 157, 143, 0.07)" : "var(--bg-surface-elevated)",
                  border: warmup > 0 ? "1.5px solid rgba(42, 157, 143, 0.35)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.2rem" }}>🧘</span>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                        1. Échauffement & étirements avant
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        Mobilité douce et déverrouillage articulaire
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: warmup > 0 ? "#2A9D8F" : "transparent",
                      color: warmup > 0 ? "#FFFFFF" : "var(--text-subtle)",
                    }}
                  >
                    {warmup === 0 ? "Off" : `+${warmup} min`}
                  </span>
                </div>

                {/* Segmented Options */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {[
                    { label: "Désactivé", val: 0 },
                    { label: "+2 min", val: 2 },
                    { label: "+3 min", val: 3 },
                    { label: "+5 min", val: 5 },
                  ].map((opt) => {
                    const active = warmup === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => handleUpdate({ warmupExtraMinutes: opt.val })}
                        style={{
                          padding: "8px 4px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.78rem",
                          fontWeight: active ? 800 : 500,
                          backgroundColor: active ? "#2A9D8F" : "var(--bg-surface)",
                          color: active ? "#FFFFFF" : "var(--text-main)",
                          border: active ? "none" : "1px solid var(--border-subtle)",
                          boxShadow: active ? "0 2px 8px rgba(42, 157, 143, 0.3)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STAGE 2: Séance Principale */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-primary-soft)",
                  border: "1.5px solid var(--color-primary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.2rem" }}>⏱️</span>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                        2. Corps de la séance
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        Entraînement actif adapté à votre état du jour
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-primary)",
                      color: "#FFFFFF",
                    }}
                  >
                    {main} min
                  </span>
                </div>

                {/* Segmented Options */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {[
                    { label: "5 min", val: 5 },
                    { label: "7 min", val: 7 },
                    { label: "10 min", val: 10 },
                    { label: "12 min", val: 12 },
                    { label: "15 min", val: 15 },
                  ].map((opt) => {
                    const active = main === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => handleUpdate({ defaultDurationMinutes: opt.val })}
                        style={{
                          padding: "8px 2px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.78rem",
                          fontWeight: active ? 800 : 500,
                          backgroundColor: active ? "var(--color-primary)" : "var(--bg-surface)",
                          color: active ? "#FFFFFF" : "var(--text-main)",
                          border: active ? "none" : "1px solid var(--border-subtle)",
                          boxShadow: active ? "0 2px 8px rgba(27, 67, 50, 0.3)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STAGE 3: Étirements après séance */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: cooldown > 0 ? "rgba(231, 111, 81, 0.07)" : "var(--bg-surface-elevated)",
                  border: cooldown > 0 ? "1.5px solid rgba(231, 111, 81, 0.35)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.2rem" }}>✨</span>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                        3. Étirements après séance
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        Assouplissements de fin & retour au calme
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: cooldown > 0 ? "#E76F51" : "transparent",
                      color: cooldown > 0 ? "#FFFFFF" : "var(--text-subtle)",
                    }}
                  >
                    {cooldown === 0 ? "Off" : `+${cooldown} min`}
                  </span>
                </div>

                {/* Segmented Options */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {[
                    { label: "Désactivé", val: 0 },
                    { label: "+2 min", val: 2 },
                    { label: "+3 min", val: 3 },
                    { label: "+5 min", val: 5 },
                  ].map((opt) => {
                    const active = cooldown === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => handleUpdate({ cooldownExtraMinutes: opt.val })}
                        style={{
                          padding: "8px 4px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.78rem",
                          fontWeight: active ? 800 : 500,
                          backgroundColor: active ? "#E76F51" : "var(--bg-surface)",
                          color: active ? "#FFFFFF" : "var(--text-main)",
                          border: active ? "none" : "1px solid var(--border-subtle)",
                          boxShadow: active ? "0 2px 8px rgba(231, 111, 81, 0.3)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
