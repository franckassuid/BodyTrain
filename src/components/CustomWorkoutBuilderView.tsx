import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Play,
  Trash2,
  Edit2,
  Clock,
  Dumbbell,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  Sliders,
} from "lucide-react";
import { EXERCISES } from "../data/exercisesData.ts";
import type { Exercise } from "../types/exercise.ts";
import type { CustomWorkout, CustomWorkoutItem } from "../types/customWorkout.ts";
import { convertCustomToGeneratedSession } from "../types/customWorkout.ts";
import { storageService } from "../services/storage.ts";
import { CATEGORY_LABELS } from "../types/enums.ts";
import type { GeneratedSession } from "../types/session.ts";

interface CustomWorkoutBuilderViewProps {
  onStartCustomWorkout: (session: GeneratedSession) => void;
}

const DURATION_PRESETS = [20, 30, 45, 60, 90];
const REST_PRESETS = [5, 10, 15, 20];

const TITLE_SUGGESTIONS = [
  "Mon Réveil Matinal",
  "Spécial Abdos & Gainage",
  "Fessiers & Cuisses",
  "Mobilité Douce du Dos",
  "Haut du Corps & Bras",
  "Pause Express 5 min",
];

export const CustomWorkoutBuilderView: React.FC<CustomWorkoutBuilderViewProps> = ({
  onStartCustomWorkout,
}) => {
  const [savedWorkouts, setSavedWorkouts] = useState<CustomWorkout[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit form state
  const [workoutTitle, setWorkoutTitle] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<CustomWorkoutItem[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState<boolean>(false);

  // Exercise Picker search & filter
  const [pickerSearch, setPickerSearch] = useState<string>("");
  const [pickerCategory, setPickerCategory] = useState<string>("all");

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const list = await storageService.getCustomWorkouts();
    setSavedWorkouts(list);
  };

  const handleStartCreateNew = () => {
    setEditingId(null);
    setWorkoutTitle("");
    setSelectedItems([]);
    setIsEditing(true);
  };

  const handleStartEdit = (workout: CustomWorkout) => {
    setEditingId(workout.id);
    setWorkoutTitle(workout.title);
    setSelectedItems([...workout.items]);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await storageService.deleteCustomWorkout(id);
    await loadWorkouts();
  };

  const handleAddItem = (exercise: Exercise) => {
    const defaultDuration = exercise.defaultDurationSeconds || 45;
    const defaultRest = 10;
    const newItem: CustomWorkoutItem = {
      exercise,
      durationSeconds: defaultDuration,
      restSeconds: defaultRest,
    };
    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedItems.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...selectedItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSelectedItems(updated);
  };

  const handleUpdateDuration = (index: number, duration: number) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], durationSeconds: duration };
    setSelectedItems(updated);
  };

  const handleUpdateRest = (index: number, rest: number) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], restSeconds: rest };
    setSelectedItems(updated);
  };

  const totalCalculatedSeconds = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    let sum = 5; // initial prep
    selectedItems.forEach((item, idx) => {
      sum += item.durationSeconds;
      if (idx < selectedItems.length - 1) {
        sum += item.restSeconds;
      }
    });
    return sum;
  }, [selectedItems]);

  const handleSaveAndExit = async (andLaunch = false) => {
    if (selectedItems.length === 0) return;

    const title = workoutTitle.trim() || `Séance personnalisée du ${new Date().toLocaleDateString("fr-FR")}`;
    const id = editingId || `custom_${Date.now()}`;
    const now = new Date().toISOString();

    const customWorkout: CustomWorkout = {
      id,
      title,
      createdAt: editingId ? savedWorkouts.find((w) => w.id === editingId)?.createdAt || now : now,
      updatedAt: now,
      items: selectedItems,
      totalEstimatedSeconds: totalCalculatedSeconds,
    };

    await storageService.saveCustomWorkout(customWorkout);
    await loadWorkouts();

    if (andLaunch) {
      const session = convertCustomToGeneratedSession(customWorkout);
      onStartCustomWorkout(session);
    } else {
      setIsEditing(false);
    }
  };

  const handleDirectLaunchSaved = (workout: CustomWorkout) => {
    const session = convertCustomToGeneratedSession(workout);
    onStartCustomWorkout(session);
  };

  // Filtered exercises for picker modal
  const filteredPickerExercises = useMemo(() => {
    return EXERCISES.filter((ex) => {
      if (!ex.enabled) return false;
      if (pickerCategory !== "all" && ex.category !== pickerCategory) return false;
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase();
        const nameMatch = (ex.nameFr || ex.name || "").toLowerCase().includes(q);
        const descMatch = (ex.shortDescriptionFr || "").toLowerCase().includes(q);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [pickerSearch, pickerCategory]);

  const formatDurationMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m} min ${s > 0 ? `${s}s` : ""}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24 }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
            {isEditing ? (editingId ? "Modifier la séance" : "Créer une séance") : "Séances sur-mesure"}
          </h1>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            {isEditing
              ? "Composez votre entraînement avec vos mouvements préférés"
              : "Créez et organisez vos propres programmes d'entraînement"}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleStartCreateNew}
            style={{ padding: "8px 14px", fontSize: "0.85rem", gap: 6 }}
          >
            <Plus size={16} />
            <span>Nouvelle séance</span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 1: WORKOUT EDITOR
      ══════════════════════════════════════════════════════════════════════ */}
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Workout Title Input & Quick Suggestions */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)" }}>
              Nom de votre séance
            </label>
            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              placeholder="Ex: Mon réveil fessiers & dos, Express 5 min..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface-elevated)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            />

            {/* Quick Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {TITLE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setWorkoutTitle(sug)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.74rem",
                    fontWeight: 500,
                    backgroundColor: workoutTitle === sug ? "var(--color-primary-soft)" : "var(--bg-surface)",
                    color: workoutTitle === sug ? "var(--color-primary-dark)" : "var(--text-muted)",
                    border: workoutTitle === sug ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--color-primary-soft)",
              border: "1.5px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} color="var(--color-primary-dark)" />
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                  {selectedItems.length} exercice{selectedItems.length > 1 ? "s" : ""} sélectionné{selectedItems.length > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Durée totale estimée : {formatDurationMinSec(totalCalculatedSeconds)}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowExercisePicker(true)}
              style={{ padding: "6px 12px", fontSize: "0.82rem", gap: 4 }}
            >
              <Plus size={15} />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Selected Exercises List */}
          {selectedItems.length === 0 ? (
            <div
              onClick={() => setShowExercisePicker(true)}
              style={{
                padding: "36px 20px",
                borderRadius: "var(--radius-xl)",
                border: "2px dashed var(--border-color)",
                textAlign: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                Aucun exercice pour l'instant
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 280 }}>
                Cliquez ici pour choisir parmi les 131 exercices de la bibliothèque.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedItems.map((item, index) => {
                const slug = item.exercise.slug || item.exercise.id;
                const gifUrl = `/animations/${slug}.gif`;

                return (
                  <div
                    key={`${item.exercise.id}_${index}`}
                    className="card"
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {/* Top Row: Thumbnail, Name, Reorder & Delete */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-surface-elevated)",
                            color: "var(--text-subtle)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>

                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--bg-surface-elevated)",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={gifUrl}
                            alt={item.exercise.nameFr || item.exercise.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.exercise.nameFr || item.exercise.name}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            {CATEGORY_LABELS[item.exercise.category] || item.exercise.category}
                            {item.exercise.unilateral && " • 🔄 2 côtés"}
                          </div>
                        </div>
                      </div>

                      {/* Reorder and Delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, "up")}
                          style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}
                          aria-label="Monter"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          disabled={index === selectedItems.length - 1}
                          onClick={() => handleMoveItem(index, "down")}
                          style={{ padding: 4, opacity: index === selectedItems.length - 1 ? 0.3 : 1 }}
                          aria-label="Descendre"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleRemoveItem(index)}
                          style={{ padding: 4, color: "var(--color-accent)" }}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Controls Row: Duration & Rest Presets */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        borderTop: "1px solid var(--border-subtle)",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {/* Work Duration */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                          Effort :
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {DURATION_PRESETS.map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => handleUpdateDuration(index, dur)}
                              style={{
                                padding: "3px 7px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.72rem",
                                fontWeight: item.durationSeconds === dur ? 700 : 500,
                                border: item.durationSeconds === dur ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                                backgroundColor: item.durationSeconds === dur ? "var(--color-primary-soft)" : "var(--bg-surface)",
                                color: item.durationSeconds === dur ? "var(--color-primary-dark)" : "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              {dur}s
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rest Duration */}
                      {index < selectedItems.length - 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                            Repos :
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {REST_PRESETS.map((rest) => (
                              <button
                                key={rest}
                                type="button"
                                onClick={() => handleUpdateRest(index, rest)}
                                style={{
                                  padding: "3px 7px",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "0.72rem",
                                  fontWeight: item.restSeconds === rest ? 700 : 500,
                                  border: item.restSeconds === rest ? "1px solid var(--border-color)" : "1px solid var(--border-subtle)",
                                  backgroundColor: item.restSeconds === rest ? "var(--bg-surface-elevated)" : "transparent",
                                  color: item.restSeconds === rest ? "var(--text-main)" : "var(--text-subtle)",
                                  cursor: "pointer",
                                }}
                              >
                                {rest}s
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add more button */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowExercisePicker(true)}
                style={{ padding: "10px", marginTop: 4, width: "100%" }}
              >
                <Plus size={16} />
                <span>Ajouter un autre exercice</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(false)}
              style={{ flex: 1 }}
            >
              <span>Annuler</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={selectedItems.length === 0}
              onClick={() => handleSaveAndExit(false)}
              style={{ flex: 1.2, opacity: selectedItems.length === 0 ? 0.5 : 1 }}
            >
              <span>Enregistrer</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={selectedItems.length === 0}
              onClick={() => handleSaveAndExit(true)}
              style={{
                flex: 1.4,
                backgroundColor: "var(--color-primary-dark)",
                opacity: selectedItems.length === 0 ? 0.5 : 1,
              }}
            >
              <Play size={16} fill="currentColor" />
              <span>Lancer</span>
            </button>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            MODE 2: SAVED WORKOUTS LIST
        ══════════════════════════════════════════════════════════════════════ */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {savedWorkouts.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "36px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sliders size={26} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                Aucune séance personnalisée
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, maxWidth: 320, lineHeight: 1.45 }}>
                Créez vos propres entraînements en combinant les exercices de votre choix avec les durées souhaitées.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleStartCreateNew}
                style={{ marginTop: 6 }}
              >
                <Plus size={16} />
                <span>Créer ma première séance</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {savedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: "1.08rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                        {workout.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Dumbbell size={14} color="var(--color-primary)" />
                          <span>{workout.items.length} exercices</span>
                        </span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={14} color="var(--color-primary)" />
                          <span>{formatDurationMinSec(workout.totalEstimatedSeconds)}</span>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleStartEdit(workout)}
                        style={{ padding: 6, color: "var(--text-muted)" }}
                        aria-label="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleDelete(workout.id)}
                        style={{ padding: 6, color: "var(--color-accent)" }}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Exercise Tags Preview */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {workout.items.slice(0, 4).map((it, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {it.exercise.nameFr || it.exercise.name}
                      </span>
                    ))}
                    {workout.items.length > 4 && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          color: "var(--text-muted)",
                        }}
                      >
                        +{workout.items.length - 4} autres
                      </span>
                    )}
                  </div>

                  {/* Launch Button */}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleDirectLaunchSaved(workout)}
                    style={{ marginTop: 2 }}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Lancer cette séance</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EXERCISE PICKER MODAL (131 Exercises)
      ══════════════════════════════════════════════════════════════════════ */}
      {showExercisePicker &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 12px",
              boxSizing: "border-box",
            }}
            onClick={() => setShowExercisePicker(false)}
          >
            <div
              className="animate-slide-up"
              style={{
                backgroundColor: "var(--bg-surface, #FFFFFF)",
                borderRadius: "var(--radius-xl)",
                width: "100%",
                maxWidth: 480,
                height: "85vh",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid var(--border-color, #E2E8F0)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                    Choisir un exercice
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    {filteredPickerExercises.length} exercices disponibles
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowExercisePicker(false)}
                  style={{ padding: 6, borderRadius: "50%" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search and Category Filter */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Search size={16} color="var(--text-subtle)" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Rechercher par nom (ex: pompe, fente, gainage...)"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-main)",
                      width: "100%",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Category selector */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => setPickerCategory("all")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.74rem",
                      fontWeight: pickerCategory === "all" ? 700 : 500,
                      backgroundColor: pickerCategory === "all" ? "var(--color-primary)" : "var(--bg-surface-elevated)",
                      color: pickerCategory === "all" ? "#FFFFFF" : "var(--text-main)",
                      border: "none",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    Tous
                  </button>
                  {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setPickerCategory(catKey)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.74rem",
                        fontWeight: pickerCategory === catKey ? 700 : 500,
                        backgroundColor: pickerCategory === catKey ? "var(--color-primary)" : "var(--bg-surface-elevated)",
                        color: pickerCategory === catKey ? "#FFFFFF" : "var(--text-main)",
                        border: "none",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                    >
                      {catLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredPickerExercises.map((ex) => {
                  const slug = ex.slug || ex.id;
                  const gifUrl = `/animations/${slug}.gif`;
                  const alreadyCount = selectedItems.filter((it) => it.exercise.id === ex.id).length;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        handleAddItem(ex);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--bg-surface-elevated)",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={gifUrl}
                            alt={ex.nameFr || ex.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ex.nameFr || ex.name}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            {CATEGORY_LABELS[ex.category] || ex.category} • Intensité {ex.intensity}/5
                            {ex.unilateral && " • 🔄 2 côtés"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          backgroundColor: alreadyCount > 0 ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                          color: alreadyCount > 0 ? "var(--color-primary-dark)" : "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Plus size={14} />
                        <span>{alreadyCount > 0 ? `Ajouté (${alreadyCount})` : "Ajouter"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  {selectedItems.length} exercice{selectedItems.length > 1 ? "s" : ""} dans la séance
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowExercisePicker(false)}
                  style={{ padding: "6px 14px", fontSize: "0.84rem" }}
                >
                  <span>Terminer la sélection</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
