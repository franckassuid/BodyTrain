import React, { useEffect, useState } from "react";
import { Calendar, Clock, Flame, Dumbbell, ChevronRight, Play } from "lucide-react";
import { storageService } from "../services/storage.ts";
import type { HistoryStats, SessionHistoryRecord } from "../types/history.ts";
import { EXERCISES_MAP } from "../data/exercisesData.ts";
import { DISCOMFORT_LABELS } from "../types/enums.ts";
import type { GeneratedSession } from "../types/session.ts";
import { PastSessionDetailModal } from "./PastSessionDetailModal.tsx";

interface HistoryViewProps {
  onStartWorkout?: (session: GeneratedSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onStartWorkout }) => {
  const [sessions, setSessions] = useState<SessionHistoryRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<SessionHistoryRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allSessions, curStats] = await Promise.all([
      storageService.getAllSessions(),
      storageService.getStats(),
    ]);
    setSessions(allSessions);
    setStats(curStats);
    setLoading(false);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
        Chargement de ton historique...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
          Ton activité
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 2 }}>
          Chaque moment consacré à ton bien-être compte.
        </p>
      </div>

      {/* 3 Calm Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div
          className="card"
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 4,
          }}
        >
          <Calendar size={18} style={{ color: "var(--color-primary)" }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
            {stats?.sessionsThisWeek || 0}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 500 }}>
            CETTE SEMAINE
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 4,
          }}
        >
          <Flame size={18} style={{ color: "var(--color-accent)" }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
            {stats?.sessionsThisMonth || 0}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 500 }}>
            CE MOIS-CI
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 4,
          }}
        >
          <Clock size={18} style={{ color: "var(--color-primary-light)" }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
            {stats?.totalTimeMinutes || 0}m
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 500 }}>
            TEMPS TOTAL
          </div>
        </div>
      </div>

      {/* Recently Used Exercises */}
      {stats?.recentExerciseIds && stats.recentExerciseIds.length > 0 && (
        <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>
            <Dumbbell size={18} style={{ color: "var(--color-primary)" }} />
            <span>Mouvements récents</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {stats.recentExerciseIds.map((exId) => {
              const ex = EXERCISES_MAP[exId];
              if (!ex) return null;
              return (
                <span
                  key={exId}
                  style={{
                    fontSize: "0.8rem",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {ex.nameFr || ex.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Sessions History List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
          Séances récentes
        </h2>

        {sessions.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "32px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              lineHeight: 1.45,
            }}
          >
            Aucune séance enregistrée pour le moment.
            <br />
            Réponds aux 2 questions du check-in pour lancer ta première séance !
          </div>
        ) : (
          sessions.map((s) => {
            const durationMin = Math.max(1, Math.round((s.actualDurationSeconds || s.plannedDurationSeconds) / 60));
            const isCompleted = s.status === "completed";

            return (
              <div
                key={s.id}
                className="card"
                onClick={() => setSelectedSession(s)}
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {formatDate(s.date)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: isCompleted ? "var(--color-primary-soft)" : "var(--bg-surface-elevated)",
                        color: isCompleted ? "var(--color-primary-dark)" : "var(--text-muted)",
                      }}
                    >
                      {isCompleted ? "Complète" : "Partielle"}
                    </span>
                    <ChevronRight size={16} color="var(--text-subtle)" />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <span>Durée : ~{durationMin} min</span>
                  <span>•</span>
                  <span>Énergie : {s.energyScore}/10</span>
                  <span>•</span>
                  <span>Gêne : {DISCOMFORT_LABELS[s.discomfortZone] || s.discomfortZone}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                    {s.completedExerciseIds && s.completedExerciseIds.length > 0
                      ? `${s.completedExerciseIds.length} exercice${s.completedExerciseIds.length > 1 ? "s" : ""} réalisé${s.completedExerciseIds.length > 1 ? "s" : ""}`
                      : "Séance enregistrée"}
                  </div>

                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Détails & Refaire</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Session Detail & Replay Modal */}
      <PastSessionDetailModal
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        onReplaySession={(generatedSession) => {
          if (onStartWorkout) {
            onStartWorkout(generatedSession);
          }
        }}
      />
    </div>
  );
};
