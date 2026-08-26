import React, { useEffect, useState } from "react";
import {
  Bell,
  Volume2,
  Vibrate,
  Clock,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import { storageService } from "../services/storage.ts";
import { pushNotificationService } from "../services/pushNotifications.ts";
import { soundService } from "../services/sound.ts";
import { vibrationService } from "../services/vibration.ts";
import type { AppSettings, DayOfWeek, DefaultDurationMinutes } from "../types/settings.ts";

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
    soundService.setEnabled(s.soundEnabled);
    vibrationService.setEnabled(s.vibrationEnabled);
  };

  const handleUpdate = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = await storageService.saveSettings(updates);
    setSettings(updated);
    if (updates.soundEnabled !== undefined) soundService.setEnabled(updates.soundEnabled);
    if (updates.vibrationEnabled !== undefined) vibrationService.setEnabled(updates.vibrationEnabled);

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
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
    setNotificationStatus("Envoi de la notification de test...");
    const ok = await pushNotificationService.testServerPush();
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
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  if (!settings) return null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
            Réglages
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 2 }}>
            Personnalise ton expérience quotidienne
          </p>
        </div>

        {savedFeedback && (
          <span
            className="badge animate-fade-in"
            style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
          >
            <Check size={14} />
            <span>Enregistré</span>
          </span>
        )}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Bell size={18} style={{ color: "var(--color-accent)" }} />
            <span>Rappel matinal quotidien</span>
          </div>

          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => handleUpdate({ reminderTime: e.target.value })}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface-elevated)",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          />
        </div>

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
                    border: active ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={handleTestNotification}>
          <Bell size={16} />
          <span>Tester la notification</span>
        </button>

        {notificationStatus && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 500, textAlign: "center" }}>
            {notificationStatus}
          </div>
        )}

        <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)", lineHeight: 1.4 }}>
          💡 Sur iPhone (iOS 16.4+), ajoutez BodyTrain à l’écran d’accueil pour recevoir les notifications Push.
        </div>
      </div>

      {/* 3. Audio & Haptics Toggles */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Volume2 size={18} style={{ color: "var(--color-primary)" }} />
            <span>Signaux sonores</span>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => handleUpdate({ soundEnabled: e.target.checked })}
            style={{ width: 22, height: 22, accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 600 }}>
            <Vibrate size={18} style={{ color: "var(--color-primary)" }} />
            <span>Vibrations lors des transitions</span>
          </div>
          <input
            type="checkbox"
            checked={settings.vibrationEnabled}
            onChange={(e) => handleUpdate({ vibrationEnabled: e.target.checked })}
            style={{ width: 22, height: 22, accentColor: "var(--color-primary)", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* 4. Safety Reminder Box */}
      <div
        className="card"
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: "var(--border-subtle)",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
          <ShieldCheck size={18} style={{ color: "var(--color-primary)" }} />
          <span>Rappels de sécurité</span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          Arrête le mouvement en cas de douleur vive, croissante ou inhabituelle. Si une gêne persiste,
          s’aggrave ou limite tes mouvements, demande l’avis d’un professionnel.
        </p>
      </div>

      {/* 5. Reset History */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!showResetConfirm ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowResetConfirm(true)}
            style={{ color: "var(--color-accent)", justifyContent: "center" }}
          >
            <RotateCcw size={16} />
            <span>Réinitialiser l’historique</span>
          </button>
        ) : (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--color-accent)", fontWeight: 600 }}>
              <AlertTriangle size={18} />
              <span>Confirmer la suppression ?</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Toutes tes séances passées seront effacées de cet appareil.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn-accent" onClick={handleResetHistory} style={{ flex: 1 }}>
                Oui, réinitialiser
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowResetConfirm(false)} style={{ flex: 1 }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
