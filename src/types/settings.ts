export type DefaultDurationMinutes = 5 | 7 | 10;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ...

export interface AppSettings {
  defaultDurationMinutes: DefaultDurationMinutes;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM" e.g. "07:30"
  activeDays: DayOfWeek[]; // Default: [1, 2, 3, 4, 5, 6] (Lundi à Samedi)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  safetyDisclaimerAcknowledged: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultDurationMinutes: 7,
  reminderEnabled: false,
  reminderTime: "07:30",
  activeDays: [1, 2, 3, 4, 5, 6], // Lundi au samedi
  soundEnabled: true,
  vibrationEnabled: true,
  safetyDisclaimerAcknowledged: false,
};
