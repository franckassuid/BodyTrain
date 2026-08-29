import React, { useState } from "react";
import { ArrowRight, ChevronLeft, Sparkles, Check, ShieldCheck, Gauge } from "lucide-react";
import type { DiscomfortZone } from "../types/enums.ts";
import { vibrationService } from "../services/vibration.ts";

interface CheckInProps {
  onGenerate: (
    energy: number,
    discomfort: DiscomfortZone,
    options?: { warmupExtraMinutes?: number; cooldownExtraMinutes?: number }
  ) => void;
  defaultEnergy?: number;
  initialWarmupExtra?: number;
  initialCooldownExtra?: number;
}

interface EnergyLevelInfo {
  emoji: string;
  badge: string;
  title: string;
  subtitle: string;
  themeColor: string;
  bgSoft: string;
  gradient: string;
  tempo: string;
}

const ENERGY_LEVELS: EnergyLevelInfo[] = [
  {
    emoji: "😴",
    badge: "Batterie à plat",
    title: "Besoin d'un réveil ultra-doux",
    subtitle: "Séance passive au sol avec respirations amples et décompression articulaire totale.",
    themeColor: "#4A7C59",
    bgSoft: "rgba(74, 124, 89, 0.12)",
    gradient: "linear-gradient(135deg, #588157 0%, #3A5A40 100%)",
    tempo: "Très lent & réparateur",
  },
  {
    emoji: "🌸",
    badge: "Tout en douceur",
    title: "Éveil au sol tout doux",
    subtitle: "Mobilité légère du bassin et des chevilles sans quitter le tapis.",
    themeColor: "#52B788",
    bgSoft: "rgba(82, 183, 136, 0.14)",
    gradient: "linear-gradient(135deg, #74C69D 0%, #52B788 100%)",
    tempo: "Lent & fluide",
  },
  {
    emoji: "🛏️",
    badge: "Sortie du lit",
    title: "Étirements matinaux déliés",
    subtitle: "Assouplissements assis et dérouillage doux de la colonne vertébrale.",
    themeColor: "#38A169",
    bgSoft: "rgba(56, 161, 105, 0.13)",
    gradient: "linear-gradient(135deg, #48BB78 0%, #2F855A 100%)",
    tempo: "Doux & relaxant",
  },
  {
    emoji: "☕",
    badge: "Besoin d'un café",
    title: "Mise en route debout",
    subtitle: "Mouvements doux pour stimuler la circulation sanguine et délier les épaules.",
    themeColor: "#2D8A61",
    bgSoft: "rgba(45, 138, 97, 0.13)",
    gradient: "linear-gradient(135deg, #38A169 0%, #1E6B4A 100%)",
    tempo: "Modéré & calme",
  },
  {
    emoji: "🌅",
    badge: "Matin tranquille",
    title: "Mobilité globale du corps",
    subtitle: "Enchaînement fluide pour dérouiller les épaules, le dos et les hanches.",
    themeColor: "#1E7A54",
    bgSoft: "rgba(30, 122, 84, 0.13)",
    gradient: "linear-gradient(135deg, #2D8A61 0%, #144F36 100%)",
    tempo: "Fluide & régulier",
  },
  {
    emoji: "🌤️",
    badge: "Forme équilibrée",
    title: "Activation musculaire générale",
    subtitle: "Séance harmonieuse pour chauffer les muscles et gagner en amplitude.",
    themeColor: "#1E6B4A",
    bgSoft: "rgba(30, 107, 74, 0.12)",
    gradient: "linear-gradient(135deg, #2D8A61 0%, #145339 100%)",
    tempo: "Équilibré & tonique",
  },
  {
    emoji: "☀️",
    badge: "Bonne forme",
    title: "Renforcement matinal tonique",
    subtitle: "Activation posturale et gainage doux pour faire le plein d'énergie.",
    themeColor: "#D97706",
    bgSoft: "rgba(217, 119, 6, 0.13)",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    tempo: "Tonique & stimulant",
  },
  {
    emoji: "🏃",
    badge: "Belle vitalité",
    title: "Routine vivifiante & rythmée",
    subtitle: "Rythme actif avec coordination et travail musculaire complet.",
    themeColor: "#EA580C",
    bgSoft: "rgba(234, 88, 12, 0.13)",
    gradient: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
    tempo: "Actif & cardio léger",
  },
  {
    emoji: "⚡",
    badge: "Super forme",
    title: "Séance stimulante & gainage",
    subtitle: "Enchaînement dynamique pour réveiller le cœur et tonifier tout le corps.",
    themeColor: "#DC2626",
    bgSoft: "rgba(220, 38, 38, 0.12)",
    gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    tempo: "Dynamique & intense",
  },
  {
    emoji: "🔥",
    badge: "Plein d'énergie",
    title: "Entraînement complet & intense",
    subtitle: "Séance rythmée à haute intensité pour un réveil sportif maximal.",
    themeColor: "#B91C1C",
    bgSoft: "rgba(185, 28, 28, 0.13)",
    gradient: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
    tempo: "Intense & puissant",
  },
  {
    emoji: "🚀",
    badge: "Énergie au sommet",
    title: "Défi dynamique matinal",
    subtitle: "Puissance musculaire et cardio complet pour attaquer la journée.",
    themeColor: "#9F1239",
    bgSoft: "rgba(159, 18, 57, 0.14)",
    gradient: "linear-gradient(135deg, #E11D48 0%, #9F1239 100%)",
    tempo: "Intensité maximale",
  },
];

export const CheckIn: React.FC<CheckInProps> = ({
  onGenerate,
  defaultEnergy = 6,
  initialWarmupExtra = 0,
  initialCooldownExtra = 0,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [energyScore, setEnergyScore] = useState<number>(Math.max(0, Math.min(10, defaultEnergy)));
  const [discomfortZone, setDiscomfortZone] = useState<DiscomfortZone>("none");
  const [warmupExtra, setWarmupExtra] = useState<number>(initialWarmupExtra);
  const [cooldownExtra, setCooldownExtra] = useState<number>(initialCooldownExtra);

  const currentLevel = ENERGY_LEVELS[energyScore] || ENERGY_LEVELS[5];

  const handleSliderChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(10, newVal));
    setEnergyScore(clamped);
    vibrationService.tick();
  };

  const handleNextQuestion = () => {
    setStep(2);
  };

  const handleSelectDiscomfort = (zone: DiscomfortZone) => {
    setDiscomfortZone(zone);
  };

  const handleConfirmGenerate = () => {
    onGenerate(energyScore, discomfortZone, {
      warmupExtraMinutes: warmupExtra,
      cooldownExtraMinutes: cooldownExtra,
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {step === 1 && (
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "24px 20px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                backgroundColor: currentLevel.bgSoft,
                color: currentLevel.themeColor,
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                transition: "all 0.2s ease",
              }}
            >
              <Sparkles size={13} />
              <span>{currentLevel.badge}</span>
            </div>
            <h1
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--text-main)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              Comment vous sentez-vous ce matin ?
            </h1>
          </div>

          {/* Dynamic Mood Card (Distinct visuals on EVERY single notch) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "22px 16px",
              backgroundColor: currentLevel.bgSoft,
              borderRadius: "var(--radius-xl)",
              border: `2px solid ${currentLevel.themeColor}44`,
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Animated Emoji Avatar */}
            <div
              key={energyScore}
              className="animate-slide-up"
              style={{
                width: 76,
                height: 76,
                borderRadius: "var(--radius-full)",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                boxShadow: `0 8px 24px ${currentLevel.themeColor}33`,
                border: `2px solid ${currentLevel.themeColor}55`,
                marginBottom: 12,
              }}
            >
              <span>{currentLevel.emoji}</span>
            </div>

            {/* Level Title */}
            <h2
              key={`title-${energyScore}`}
              className="animate-fade-in"
              style={{
                fontSize: "1.22rem",
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: 6,
              }}
            >
              {currentLevel.title}
            </h2>

            {/* Subtitle */}
            <p
              key={`desc-${energyScore}`}
              className="animate-fade-in"
              style={{
                fontSize: "0.86rem",
                color: "var(--text-muted)",
                lineHeight: 1.45,
                maxWidth: 320,
                margin: 0,
              }}
            >
              {currentLevel.subtitle}
            </p>

            {/* Tempo Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 10,
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "#FFFFFF",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: currentLevel.themeColor,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <Gauge size={13} />
              <span>Rythme : {currentLevel.tempo}</span>
            </div>
          </div>

          {/* Interactive Multi-Notch Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Slider input */}
            <div style={{ position: "relative", width: "100%", padding: "4px 0" }}>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={energyScore}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: 14,
                  borderRadius: 7,
                  accentColor: currentLevel.themeColor,
                  cursor: "pointer",
                }}
                aria-label="Niveau d'énergie ressenti"
              />
            </div>

            {/* 11 Micro Notch Segments Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 4, padding: "0 2px" }}>
              {ENERGY_LEVELS.map((lvl, idx) => {
                const isActive = idx === energyScore;
                const isPassed = idx <= energyScore;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSliderChange(idx)}
                    style={{
                      height: isActive ? 10 : 6,
                      borderRadius: 3,
                      backgroundColor: isActive
                        ? currentLevel.themeColor
                        : isPassed
                        ? `${currentLevel.themeColor}88`
                        : "var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      transform: isActive ? "scaleY(1.3)" : "scaleY(1)",
                    }}
                    title={lvl.badge}
                  />
                );
              })}
            </div>

            {/* Milestone labels below slider */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.76rem",
                color: "var(--text-subtle)",
                fontWeight: 700,
                padding: "0 2px",
              }}
            >
              <span onClick={() => handleSliderChange(0)} style={{ cursor: "pointer" }}>😴 Doux</span>
              <span onClick={() => handleSliderChange(3)} style={{ cursor: "pointer" }}>☕ Posé</span>
              <span onClick={() => handleSliderChange(6)} style={{ cursor: "pointer" }}>☀️ Tonique</span>
              <span onClick={() => handleSliderChange(10)} style={{ cursor: "pointer" }}>🔥 Intense</span>
            </div>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleNextQuestion}
            style={{
              background: currentLevel.gradient,
              border: "none",
              color: "#FFFFFF",
              marginTop: 4,
              boxShadow: `0 6px 20px ${currentLevel.themeColor}44`,
            }}
          >
            <span>Continuer</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: "24px 20px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          {/* Back button */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep(1)}
              style={{
                padding: "6px 10px",
                marginLeft: -8,
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--text-muted)",
              }}
              aria-label="Retour à l'étape 1"
            >
              <ChevronLeft size={18} />
              <span>Changer mon ressenti</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              <ShieldCheck size={14} />
              <span>Adaptation & Sécurité</span>
            </div>
            <h1
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--text-main)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              Avez-vous une gêne particulière ce matin ?
            </h1>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
              BodyTrain sélectionne automatiquement des postures adaptées pour préserver votre confort.
            </p>
          </div>

          {/* 3 Joyful Discomfort Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 1. Aucune gêne */}
            <button
              type="button"
              onClick={() => handleSelectDiscomfort("none")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "none" ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                border: discomfortZone === "none" ? "2px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: discomfortZone === "none" ? "0 4px 14px rgba(30, 107, 74, 0.1)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  ✨
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Aucune gêne
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Mobilisation globale et complète du corps
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: discomfortZone === "none" ? "var(--color-primary)" : "transparent",
                  border: discomfortZone === "none" ? "none" : "2px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                {discomfortZone === "none" && <Check size={14} />}
              </div>
            </button>

            {/* 2. Haut du corps */}
            <button
              type="button"
              onClick={() => handleSelectDiscomfort("upper")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "upper" ? "rgba(2, 132, 199, 0.12)" : "var(--bg-surface-elevated)",
                border: discomfortZone === "upper" ? "2px solid #0284C7" : "1px solid var(--border-subtle)",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: discomfortZone === "upper" ? "0 4px 14px rgba(2, 132, 199, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  🧘‍♂️
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Haut du corps
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Épaules, cou, poignets ou bras préservés
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: discomfortZone === "upper" ? "#0284C7" : "transparent",
                  border: discomfortZone === "upper" ? "none" : "2px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                {discomfortZone === "upper" && <Check size={14} />}
              </div>
            </button>

            {/* 3. Bas du corps */}
            <button
              type="button"
              onClick={() => handleSelectDiscomfort("lower")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "lower" ? "rgba(231, 111, 81, 0.14)" : "var(--bg-surface-elevated)",
                border: discomfortZone === "lower" ? "2px solid #E76F51" : "1px solid var(--border-subtle)",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: discomfortZone === "lower" ? "0 4px 14px rgba(231, 111, 81, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  🦵
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Bas du corps
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Genoux, chevilles ou jambes préservés
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: discomfortZone === "lower" ? "#E76F51" : "transparent",
                  border: discomfortZone === "lower" ? "none" : "2px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                {discomfortZone === "lower" && <Check size={14} />}
              </div>
            </button>
          </div>

          {/* Optional Warmup & Cooldown Add-on Section */}
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "16px",
              marginTop: 4,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-main)" }}>
              ⏱️ Suppléments facultatifs
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Extra Warmup Button */}
              <button
                type="button"
                onClick={() => setWarmupExtra((prev) => (prev > 0 ? 0 : 2))}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: warmupExtra > 0 ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                  border: warmupExtra > 0 ? "1.5px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: warmupExtra > 0 ? "var(--color-primary-dark)" : "var(--text-main)" }}>
                    🧘 Échauffement
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: warmupExtra > 0 ? "var(--color-primary)" : "var(--border-color)",
                      color: "#FFFFFF",
                    }}
                  >
                    +2 min
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Mobilité douce avant l'effort
                </span>
              </button>

              {/* Extra Cooldown Stretching Button */}
              <button
                type="button"
                onClick={() => setCooldownExtra((prev) => (prev === 0 ? 3 : prev === 3 ? 2 : 0))}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: cooldownExtra > 0 ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                  border: cooldownExtra > 0 ? "1.5px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: cooldownExtra > 0 ? "var(--color-primary-dark)" : "var(--text-main)" }}>
                    ✨ Étirements
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: cooldownExtra > 0 ? "var(--color-primary)" : "var(--border-color)",
                      color: "#FFFFFF",
                    }}
                  >
                    {cooldownExtra > 0 ? `+${cooldownExtra} min` : "+3 min"}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Assouplissements de fin
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirmGenerate}
            style={{ width: "100%", padding: "14px", marginTop: 4 }}
          >
            <span>Générer ma proposition du matin</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
