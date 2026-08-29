export type DefaultDurationMinutes = number; // e.g. 5, 7, 10, 12, 15

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ...

export interface AppSettings {
  defaultDurationMinutes: number; // e.g. 5, 7, 10, 12, 15
  warmupExtraMinutes: number; // 0 to 5 min
  cooldownExtraMinutes: number; // 0 to 5 min
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM" e.g. "07:30"
  activeDays: DayOfWeek[]; // Default: [1, 2, 3, 4, 5, 6] (Lundi à Samedi)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  safetyDisclaimerAcknowledged: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultDurationMinutes: 7,
  warmupExtraMinutes: 0,
  cooldownExtraMinutes: 0,
  reminderEnabled: false,
  reminderTime: "07:30",
  activeDays: [1, 2, 3, 4, 5, 6], // Lundi au samedi
  soundEnabled: true,
  vibrationEnabled: true,
  safetyDisclaimerAcknowledged: false,
};
