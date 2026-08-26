import type { SessionPhase } from "../types/enums.ts";

// ── Phase slot definition ───────────────────────────────────────────────────

export interface PhaseSlot {
  phase: SessionPhase;
  /** Time budget for exercises in this phase (including rest) */
  budgetSeconds: { min: number; max: number };
  /** How many exercises to pick for this phase */
  exerciseCount: { min: number; max: number };
  /** Maximum intensity allowed for exercises in this phase */
  maxIntensity: number;
  /** If true, this phase can be skipped if not enough exercises are available */
  optional?: boolean;
}

// ── Session template ────────────────────────────────────────────────────────

export type EnergyTier = "very_low" | "low" | "medium" | "high";

export interface SessionTemplate {
  id: string;
  label: string;
  durationMinutes: 5 | 7 | 10;
  energyTier: EnergyTier;
  phases: PhaseSlot[];
}

// ── Template definitions ────────────────────────────────────────────────────

/**
 * All templates follow the 5-phase progression:
 *   wakeup → mobility → activation → dynamic → finish
 *
 * The intensity curve rises progressively, peaks during dynamic,
 * and comes back down during finish.
 *
 * Very-low energy templates skip the dynamic phase entirely.
 * Low energy templates have a softer dynamic phase.
 */

export const SESSION_TEMPLATES: SessionTemplate[] = [
  // ── 5 minutes ─────────────────────────────────────────────────────────

  {
    id: "5min-verylow",
    label: "5 min · Très doux",
    durationMinutes: 5,
    energyTier: "very_low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 30, max: 50 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 1 },
      { phase: "mobility", budgetSeconds: { min: 60, max: 100 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 2 },
      { phase: "activation", budgetSeconds: { min: 40, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2, optional: true },
      { phase: "finish", budgetSeconds: { min: 40, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 1 },
    ],
  },
  {
    id: "5min-low",
    label: "5 min · Doux",
    durationMinutes: 5,
    energyTier: "low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 30, max: 45 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3 },
      { phase: "finish", budgetSeconds: { min: 30, max: 50 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },
  {
    id: "5min-medium",
    label: "5 min · Équilibré",
    durationMinutes: 5,
    energyTier: "medium",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 25, max: 40 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 40, max: 60 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 4 },
      { phase: "dynamic", budgetSeconds: { min: 40, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 4 },
      { phase: "finish", budgetSeconds: { min: 25, max: 40 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },
  {
    id: "5min-high",
    label: "5 min · Dynamique",
    durationMinutes: 5,
    energyTier: "high",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 25, max: 35 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 30, max: 50 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 40, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 5 },
      { phase: "dynamic", budgetSeconds: { min: 60, max: 90 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 5 },
      { phase: "finish", budgetSeconds: { min: 25, max: 35 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },

  // ── 7 minutes ─────────────────────────────────────────────────────────

  {
    id: "7min-verylow",
    label: "7 min · Très doux",
    durationMinutes: 7,
    energyTier: "very_low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 40, max: 60 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 1 },
      { phase: "mobility", budgetSeconds: { min: 120, max: 170 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 2 },
      { phase: "activation", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2, optional: true },
      { phase: "finish", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 1 },
    ],
  },
  {
    id: "7min-low",
    label: "7 min · Doux",
    durationMinutes: 7,
    energyTier: "low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 35, max: 55 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 90, max: 130 }, exerciseCount: { min: 2, max: 2 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 70, max: 100 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 3 },
      { phase: "dynamic", budgetSeconds: { min: 40, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3, optional: true },
      { phase: "finish", budgetSeconds: { min: 40, max: 60 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },
  {
    id: "7min-medium",
    label: "7 min · Équilibré",
    durationMinutes: 7,
    energyTier: "medium",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 30, max: 50 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 60, max: 90 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 80, max: 120 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 4 },
      { phase: "dynamic", budgetSeconds: { min: 70, max: 100 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 4 },
      { phase: "finish", budgetSeconds: { min: 35, max: 55 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },
  {
    id: "7min-high",
    label: "7 min · Dynamique",
    durationMinutes: 7,
    energyTier: "high",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 25, max: 40 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 50, max: 70 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 70, max: 110 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 5 },
      { phase: "dynamic", budgetSeconds: { min: 100, max: 150 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 5 },
      { phase: "finish", budgetSeconds: { min: 30, max: 50 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },

  // ── 10 minutes ────────────────────────────────────────────────────────

  {
    id: "10min-verylow",
    label: "10 min · Très doux",
    durationMinutes: 10,
    energyTier: "very_low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 1 },
      { phase: "mobility", budgetSeconds: { min: 180, max: 260 }, exerciseCount: { min: 3, max: 4 }, maxIntensity: 2 },
      { phase: "activation", budgetSeconds: { min: 70, max: 100 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 2, optional: true },
      { phase: "finish", budgetSeconds: { min: 70, max: 100 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 1 },
    ],
  },
  {
    id: "10min-low",
    label: "10 min · Doux",
    durationMinutes: 10,
    energyTier: "low",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 40, max: 65 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 130, max: 180 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 100, max: 150 }, exerciseCount: { min: 2, max: 2 }, maxIntensity: 3 },
      { phase: "dynamic", budgetSeconds: { min: 60, max: 90 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 3, optional: true },
      { phase: "finish", budgetSeconds: { min: 50, max: 80 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 2 },
    ],
  },
  {
    id: "10min-medium",
    label: "10 min · Équilibré",
    durationMinutes: 10,
    energyTier: "medium",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 35, max: 55 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 90, max: 130 }, exerciseCount: { min: 2, max: 2 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 120, max: 170 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 4 },
      { phase: "dynamic", budgetSeconds: { min: 100, max: 150 }, exerciseCount: { min: 2, max: 2 }, maxIntensity: 4 },
      { phase: "finish", budgetSeconds: { min: 45, max: 70 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 2 },
    ],
  },
  {
    id: "10min-high",
    label: "10 min · Dynamique",
    durationMinutes: 10,
    energyTier: "high",
    phases: [
      { phase: "wakeup", budgetSeconds: { min: 30, max: 45 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
      { phase: "mobility", budgetSeconds: { min: 60, max: 90 }, exerciseCount: { min: 1, max: 2 }, maxIntensity: 3 },
      { phase: "activation", budgetSeconds: { min: 120, max: 160 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 5 },
      { phase: "dynamic", budgetSeconds: { min: 140, max: 200 }, exerciseCount: { min: 2, max: 3 }, maxIntensity: 5 },
      { phase: "finish", budgetSeconds: { min: 40, max: 60 }, exerciseCount: { min: 1, max: 1 }, maxIntensity: 2 },
    ],
  },
];

// ── Template selection ──────────────────────────────────────────────────────

/** Map 0-10 energy score to energy tier */
export function energyScoreToTier(energyScore: number): EnergyTier {
  const score = Math.max(0, Math.min(10, Math.round(energyScore)));
  if (score <= 2) return "very_low";
  if (score <= 4) return "low";
  if (score <= 7) return "medium";
  return "high";
}

/** Select the right template for a given duration and energy */
export function selectTemplate(
  durationMinutes: number,
  energyScore: number
): SessionTemplate {
  const tier = energyScoreToTier(energyScore);
  const dur = ([5, 7, 10].includes(durationMinutes) ? durationMinutes : 7) as 5 | 7 | 10;

  const template = SESSION_TEMPLATES.find(
    (t) => t.durationMinutes === dur && t.energyTier === tier
  );

  if (!template) {
    // Fallback: 7min-medium
    return SESSION_TEMPLATES.find((t) => t.id === "7min-medium")!;
  }

  return template;
}

/** Get the ordered list of phases (non-optional) for a template */
export function getTemplatePhaseOrder(template: SessionTemplate): SessionPhase[] {
  return template.phases.map((p) => p.phase);
}

/** Check if a template includes a specific phase */
export function templateHasPhase(template: SessionTemplate, phase: SessionPhase): boolean {
  return template.phases.some((p) => p.phase === phase);
}
