import React, { useState, useMemo } from "react";
import { Search, Sparkles, Play, Info } from "lucide-react";
import { EXERCISES } from "../data/exercisesData.ts";
import type { Exercise } from "../types/exercise.ts";
import { CATEGORY_LABELS, type SessionPhase } from "../types/enums.ts";
import { ExerciseDetailModal } from "./ExerciseDetailModal.tsx";
import { searchAndRankExercises } from "../utils/exerciseSearch.ts";

interface ExerciseLibraryViewProps {
  onPlayExercise?: (exercise: Exercise, durationSeconds: number) => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onPlayExercise }) => {
  const [search, setSearch] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<SessionPhase | "all">("all");
  const [selectedDiscomfort, setSelectedDiscomfort] = useState<"all" | "upper" | "lower">("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const phases: { id: SessionPhase | "all"; label: string; emoji: string }[] = [
    { id: "all", label: "Tous", emoji: "✨" },
    { id: "wakeup", label: "Réveil", emoji: "🌸" },
    { id: "mobility", label: "Mobilité", emoji: "🧘" },
    { id: "activation", label: "Activation", emoji: "💪" },
    { id: "dynamic", label: "Dynamique", emoji: "⚡" },
    { id: "finish", label: "Fin active", emoji: "🌿" },
  ];

  const filteredExercises = useMemo(() => {
    let pool = EXERCISES.filter((ex) => {
      // 1. Phase filter
      if (selectedPhase !== "all") {
        if (!ex.suitablePhases?.includes(selectedPhase)) {
          return false;
        }
      }

      // 2. Discomfort filter
      if (selectedDiscomfort === "upper" && !ex.compatibleWithUpperBodyDiscomfort) {
        return false;
      }
      if (selectedDiscomfort === "lower" && !ex.compatibleWithLowerBodyDiscomfort) {
        return false;
      }

      return true;
    });

    if (search.trim()) {
      pool = searchAndRankExercises(pool, search);
    }

    return pool;
  }, [search, selectedPhase, selectedDiscomfort]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
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
            marginBottom: 8,
          }}
        >
          <Sparkles size={13} />
          <span>Bibliothèque BodyTrain</span>
        </div>
        <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25 }}>
          Explorez & lancez un mouvement
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 4 }}>
          {EXERCISES.length} mouvements guidés. Touchez un exercice pour voir le détail ou le lancer directement.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <Search size={18} color="var(--text-subtle)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (ex: abdos, fessiers, dos, cuisses, épaules...)"
            style={{
              border: "none",
              background: "transparent",
              width: "100%",
              fontSize: "0.9rem",
              color: "var(--text-main)",
              outline: "none",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Phase Filter Chips */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {phases.map((p) => {
            const isSelected = selectedPhase === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPhase(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface)",
                  color: isSelected ? "#FFFFFF" : "var(--text-main)",
                  border: isSelected ? "none" : "1px solid var(--border-subtle)",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Discomfort Filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 600, textTransform: "uppercase" }}>
            Filtre gêne :
          </span>
          <button
            type="button"
            onClick={() => setSelectedDiscomfort("all")}
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.74rem",
              fontWeight: 600,
              backgroundColor: selectedDiscomfort === "all" ? "var(--bg-surface-elevated)" : "transparent",
              color: selectedDiscomfort === "all" ? "var(--text-main)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setSelectedDiscomfort("upper")}
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.74rem",
              fontWeight: 600,
              backgroundColor: selectedDiscomfort === "upper" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: selectedDiscomfort === "upper" ? "#0284C7" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Haut OK
          </button>
          <button
            type="button"
            onClick={() => setSelectedDiscomfort("lower")}
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.74rem",
              fontWeight: 600,
              backgroundColor: selectedDiscomfort === "lower" ? "rgba(244, 162, 97, 0.18)" : "transparent",
              color: selectedDiscomfort === "lower" ? "#E76F51" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Bas OK
          </button>
        </div>
      </div>

      {/* Exercises List Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-subtle)" }}>
          {filteredExercises.length} exercice{filteredExercises.length > 1 ? "s" : ""} trouvé{filteredExercises.length > 1 ? "s" : ""}
        </div>

        {filteredExercises.map((ex) => {
          const slug = ex.slug || ex.id;
          const gifUrl = `/animations/${slug}.gif`;
          const photoUrl = `/exercises/${slug}/start.webp`;

          return (
            <div
              key={ex.id}
              onClick={() => {
                if (onPlayExercise) {
                  onPlayExercise(ex, 45);
                } else {
                  setSelectedExercise(ex);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                {/* Thumbnail */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <img
                    src={gifUrl}
                    alt={ex.nameFr || ex.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== photoUrl) {
                        target.src = photoUrl;
                      } else {
                        target.style.display = "none";
                      }
                    }}
                  />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-primary-soft)",
                        color: "var(--color-primary-dark)",
                      }}
                    >
                      {CATEGORY_LABELS[ex.category] || ex.category}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 500 }}>
                      Intensité {ex.intensity}/5
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ex.nameFr || ex.name}
                  </div>

                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ex.shortDescriptionFr}
                  </div>
                </div>
              </div>

              {/* Quick Launch & Info Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedExercise(ex);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  aria-label={`Détails et consignes pour ${ex.nameFr || ex.name}`}
                  title="Détails et consignes"
                >
                  <Info size={15} />
                </button>

                {onPlayExercise && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayExercise(ex, 45);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--color-primary)",
                      color: "#FFFFFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(30, 107, 74, 0.3)",
                      transition: "transform 0.15s ease",
                    }}
                    aria-label={`Lancer ${ex.nameFr || ex.name}`}
                  >
                    <Play size={15} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredExercises.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "2rem" }}>🔍</span>
            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>Aucun exercice trouvé</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Essayez de modifier votre recherche ou vos filtres.
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal with launch support */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={Boolean(selectedExercise)}
        onClose={() => setSelectedExercise(null)}
        onPlayExercise={onPlayExercise}
      />
    </div>
  );
};
