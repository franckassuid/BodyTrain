import type { HistoryStats, SessionHistoryRecord } from "../types/history.ts";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings.ts";

const DB_NAME = "bodytrain_db";
const DB_VERSION = 1;
const STORE_SESSIONS = "sessions";
const STORE_SETTINGS = "settings";
const SETTINGS_KEY = "user_settings";

/** Open or upgrade IndexedDB */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        sessionStore.createIndex("date", "date", { unique: false });
        sessionStore.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** LocalStorage fallback in case of strict private browsing */
const LS_SESSIONS_KEY = "bodytrain_sessions_fallback";
const LS_SETTINGS_KEY = "bodytrain_settings_fallback";

export const storageService = {
  async saveSession(record: SessionHistoryRecord): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, "readwrite");
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem(LS_SESSIONS_KEY) || "[]");
        existing.unshift(record);
        localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(existing.slice(0, 100)));
      } catch (e) {
        console.error("Failed to save session to localStorage", e);
      }
    }
  },

  async getAllSessions(): Promise<SessionHistoryRecord[]> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, "readonly");
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.getAll();
        req.onsuccess = () => {
          const results: SessionHistoryRecord[] = req.result || [];
          results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      try {
        const data = JSON.parse(localStorage.getItem(LS_SESSIONS_KEY) || "[]");
        data.sort((a: SessionHistoryRecord, b: SessionHistoryRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return data;
      } catch {
        return [];
      }
    }
  },

  async getRecentExerciseIds(limitSessions = 3): Promise<string[][]> {
    const sessions = await this.getAllSessions();
    return sessions.slice(0, limitSessions).map((s) => s.completedExerciseIds.length > 0 ? s.completedExerciseIds : s.proposedExerciseIds);
  },

  async getStats(): Promise<HistoryStats> {
    const sessions = await this.getAllSessions();
    const now = new Date();

    // Start of this week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let sessionsThisWeek = 0;
    let sessionsThisMonth = 0;
    let totalTimeSeconds = 0;
    const recentExerciseSet = new Set<string>();

    for (const s of sessions) {
      const d = new Date(s.date);
      if (d >= startOfWeek) sessionsThisWeek++;
      if (d >= startOfMonth) sessionsThisMonth++;
      totalTimeSeconds += s.actualDurationSeconds || 0;

      for (const exId of s.completedExerciseIds) {
        if (recentExerciseSet.size < 12) recentExerciseSet.add(exId);
      }
    }

    return {
      sessionsThisWeek,
      sessionsThisMonth,
      totalTimeMinutes: Math.round(totalTimeSeconds / 60),
      totalSessions: sessions.length,
      recentExerciseIds: Array.from(recentExerciseSet),
    };
  },

  async clearHistory(): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, "readwrite");
        const req = tx.objectStore(STORE_SESSIONS).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem(LS_SESSIONS_KEY);
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, "readonly");
        const req = tx.objectStore(STORE_SETTINGS).get(SETTINGS_KEY);
        req.onsuccess = () => resolve({ ...DEFAULT_SETTINGS, ...(req.result || {}) });
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      try {
        const raw = localStorage.getItem(LS_SETTINGS_KEY);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = { ...current, ...settings };
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SETTINGS, "readwrite");
        const req = tx.objectStore(STORE_SETTINGS).put(updated, SETTINGS_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  // ── Custom Workouts Storage ─────────────────────────────────────────────
  async getCustomWorkouts(): Promise<any[]> {
    try {
      const raw = localStorage.getItem("bodytrain_custom_workouts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveCustomWorkout(workout: any): Promise<any> {
    const list = await this.getCustomWorkouts();
    const existingIndex = list.findIndex((w) => w.id === workout.id);
    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = workout;
    } else {
      updatedList = [workout, ...list];
    }
    localStorage.setItem("bodytrain_custom_workouts", JSON.stringify(updatedList));
    return workout;
  },

  async deleteCustomWorkout(id: string): Promise<boolean> {
    const list = await this.getCustomWorkouts();
    const filtered = list.filter((w) => w.id !== id);
    localStorage.setItem("bodytrain_custom_workouts", JSON.stringify(filtered));
    return true;
  },
};

