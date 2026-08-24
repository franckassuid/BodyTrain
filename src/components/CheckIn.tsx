import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import type { DiscomfortZone } from "../types/enums.ts";

interface CheckInProps {
  onGenerate: (energy: number, discomfort: DiscomfortZone) => void;
  defaultEnergy?: number;
}

export const CheckIn: React.FC<CheckInProps> = ({ onGenerate, defaultEnergy = 6 }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [energyScore, setEnergyScore] = useState<number>(defaultEnergy);
  const [discomfortZone, setDiscomfortZone] = useState<DiscomfortZone>("none");

  // Helper label for energy
  const getEnergyLabel = (val: number) => {
    if (val <= 2) return "Épuisé • Réveil très doux";
    if (val <= 4) return "Un peu fatigué • Rythme doux";
    if (val <= 7) return "Ça va • Séance équilibrée";
    return "En pleine forme • Séance dynamique";
  };

  const handleNextQuestion = () => {
    setStep(2);
  };

  const handleSelectDiscomfort = (zone: DiscomfortZone) => {
    setDiscomfortZone(zone);
    onGenerate(energyScore, zone);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {step === 1 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 20px" }}>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Étape 1 sur 2
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
              Comment tu te sens aujourd’hui ?
            </h1>
          </div>

          {/* Large Thumb Energy Display */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 16px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-subtle)",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: "3.2rem",
                fontWeight: 800,
                color: energyScore <= 2 ? "var(--color-energy-low)" : energyScore <= 7 ? "var(--color-primary)" : "var(--color-accent)",
                lineHeight: 1,
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              <span>{energyScore}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "var(--text-subtle)" }}>/ 10</span>
            </div>

            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)", textAlign: "center" }}>
              {getEnergyLabel(energyScore)}
            </div>
          </div>

          {/* Quick Slider & Numbers Pill Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={energyScore}
              onChange={(e) => setEnergyScore(Number(e.target.value))}
              style={{
                width: "100%",
                height: 38,
                accentColor: "var(--color-primary)",
                cursor: "pointer",
              }}
              aria-label="Niveau d'énergie de 0 à 10"
            />

            {/* Discreet helper labels */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 500, padding: "0 4px" }}>
              <span>0 : Épuisé</span>
              <span>5 : Ça va</span>
              <span>10 : En forme</span>
            </div>

            {/* Quick Number Buttons for 1-Tap thumb selection */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 6,
                marginTop: 4,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = energyScore === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEnergyScore(num)}
                    style={{
                      height: 44,
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface-elevated)",
                      color: isSelected ? "#FFFFFF" : "var(--text-main)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "1rem",
                      border: isSelected ? "none" : "1px solid var(--border-subtle)",
                      transition: "all var(--transition-fast)",
                    }}
                    aria-label={`Choisir le niveau ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" className="btn-primary" onClick={handleNextQuestion}>
            <span>Continuer</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep(1)}
              style={{ padding: "4px 8px", marginLeft: -8 }}
              aria-label="Retour à la question 1"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
          </div>

          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Étape 2 sur 2
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
              As-tu une gêne ?
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 4 }}>
              BodyTrain adaptera immédiatement les exercices pour préserver cette zone.
            </p>
          </div>

          {/* 3 Large Discomfort Choices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="card"
              onClick={() => handleSelectDiscomfort("none")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "none" ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                borderColor: discomfortZone === "none" ? "var(--color-primary)" : "var(--border-subtle)",
                textAlign: "left",
                minHeight: 64,
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>
                  Aucune gêne
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Mobilisation complète et équilibrée
                </div>
              </div>
              <CheckCircle2
                size={24}
                style={{
                  color: discomfortZone === "none" ? "var(--color-primary)" : "var(--text-subtle)",
                  opacity: discomfortZone === "none" ? 1 : 0.4,
                }}
              />
            </button>

            <button
              type="button"
              className="card"
              onClick={() => handleSelectDiscomfort("upper")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "upper" ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                borderColor: discomfortZone === "upper" ? "var(--color-primary)" : "var(--border-subtle)",
                textAlign: "left",
                minHeight: 64,
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>
                  Haut du corps
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Épaule, cou, dos haut, poignet ou bras
                </div>
              </div>
              <CheckCircle2
                size={24}
                style={{
                  color: discomfortZone === "upper" ? "var(--color-primary)" : "var(--text-subtle)",
                  opacity: discomfortZone === "upper" ? 1 : 0.4,
                }}
              />
            </button>

            <button
              type="button"
              className="card"
              onClick={() => handleSelectDiscomfort("lower")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: discomfortZone === "lower" ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                borderColor: discomfortZone === "lower" ? "var(--color-primary)" : "var(--border-subtle)",
                textAlign: "left",
                minHeight: 64,
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>
                  Bas du corps
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Genou, cheville, hanche ou bas du dos
                </div>
              </div>
              <CheckCircle2
                size={24}
                style={{
                  color: discomfortZone === "lower" ? "var(--color-primary)" : "var(--text-subtle)",
                  opacity: discomfortZone === "lower" ? 1 : 0.4,
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
