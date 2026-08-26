// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "breathing",
  "gentle_wakeup",
  "neck_mobility",
  "shoulder_mobility",
  "spine_mobility",
  "hip_mobility",
  "knee_mobility",
  "ankle_mobility",
  "balance",
  "coordination",
  "legs_strength",
  "glutes_strength",
  "core_strength",
  "back_strength",
  "upper_body_strength",
  "gentle_cardio",
  "dynamic_cardio",
  "light_stretching",
  "cooldown",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  breathing: "Respiration",
  gentle_wakeup: "Réveil articulaire doux",
  neck_mobility: "Mobilité du cou",
  shoulder_mobility: "Mobilité des épaules",
  spine_mobility: "Mobilité de la colonne",
  hip_mobility: "Mobilité des hanches",
  knee_mobility: "Mobilité des genoux",
  ankle_mobility: "Mobilité des chevilles",
  balance: "Équilibre",
  coordination: "Coordination",
  legs_strength: "Renforcement des jambes",
  glutes_strength: "Renforcement des fessiers",
  core_strength: "Renforcement du tronc",
  back_strength: "Renforcement du dos",
  upper_body_strength: "Renforcement haut du corps",
  gentle_cardio: "Cardio doux",
  dynamic_cardio: "Cardio dynamique",
  light_stretching: "Étirements légers",
  cooldown: "Retour au calme",
};

// ── Exercise Modes ──────────────────────────────────────────────────────────

export const EXERCISE_MODES = ["timed", "repetitions", "breathing"] as const;
export type ExerciseMode = (typeof EXERCISE_MODES)[number];

// ── Difficulty ──────────────────────────────────────────────────────────────

export const DIFFICULTIES = ["very_easy", "easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// ── Energy Levels ───────────────────────────────────────────────────────────

export const ENERGY_LEVELS = ["very_low", "low", "medium", "high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

// ── Impact Levels ───────────────────────────────────────────────────────────

export const IMPACT_LEVELS = ["none", "low", "medium", "high"] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

// ── Positions ───────────────────────────────────────────────────────────────

export const POSITIONS = [
  "standing",
  "seated",
  "kneeling",
  "all_fours",
  "lying_back",
  "lying_front",
  "lying_side",
  "plank",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  standing: "Debout",
  seated: "Assis",
  kneeling: "À genoux",
  all_fours: "À quatre pattes",
  lying_back: "Au sol sur le dos",
  lying_front: "Au sol sur le ventre",
  lying_side: "Au sol sur le côté",
  plank: "En gainage",
};

// ── Body Areas ──────────────────────────────────────────────────────────────

export const BODY_AREAS = [
  "neck",
  "shoulders",
  "upper_back",
  "mid_back",
  "lower_back",
  "lats",
  "chest",
  "abdominals",
  "obliques",
  "deep_core",
  "glutes",
  "hip_flexors",
  "quadriceps",
  "hamstrings",
  "calves",
  "ankles",
  "feet",
  "wrists",
  "forearms",
  "biceps",
  "triceps",
  "abductors",
  "adductors",
  "diaphragm",
] as const;

export type BodyArea = (typeof BODY_AREAS)[number];

export const UPPER_BODY_AREAS: BodyArea[] = [
  "neck",
  "shoulders",
  "upper_back",
  "mid_back",
  "lats",
  "chest",
  "wrists",
  "forearms",
  "biceps",
  "triceps",
];

export const LOWER_BODY_AREAS: BodyArea[] = [
  "lower_back",
  "glutes",
  "hip_flexors",
  "quadriceps",
  "hamstrings",
  "calves",
  "ankles",
  "feet",
  "abductors",
  "adductors",
];

// ── Joints ──────────────────────────────────────────────────────────────────

export const JOINTS = [
  "neck",
  "shoulder",
  "thoracic_spine",
  "lumbar_spine",
  "hip",
  "knee",
  "ankle",
  "wrist",
  "elbow",
] as const;

export type Joint = (typeof JOINTS)[number];

// ── Discomfort Zones ────────────────────────────────────────────────────────

export type DiscomfortZone = "none" | "upper" | "lower";

export const DISCOMFORT_LABELS: Record<DiscomfortZone, string> = {
  none: "Aucune",
  upper: "Haut du corps",
  lower: "Bas du corps",
};

// ── Session Phases (5 normalized phases) ────────────────────────────────────

export const SESSION_PHASES = [
  "wakeup",
  "mobility",
  "activation",
  "dynamic",
  "finish",
] as const;

export type SessionPhase = (typeof SESSION_PHASES)[number];

export const SESSION_PHASE_LABELS: Record<SessionPhase, string> = {
  wakeup: "Réveil",
  mobility: "Mobilité",
  activation: "Activation",
  dynamic: "Dynamique",
  finish: "Fin active",
};

// ── Movement Patterns ───────────────────────────────────────────────────────

export const MOVEMENT_PATTERNS = [
  "breathing",
  "posture",
  "rotation",
  "flexion_extension",
  "lateral_movement",
  "squat",
  "lunge",
  "hinge",
  "push",
  "core_stability",
  "balance",
  "locomotion",
  "jump",
  "stretch",
] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

// ── Transition Level (derived from positions, not stored) ───────────────────

export type TransitionLevel = "standing" | "floor";

/** Derive transition level from exercise positions */
export function getTransitionLevel(positions: Position[]): TransitionLevel {
  const floorPositions: Position[] = [
    "lying_back",
    "lying_front",
    "lying_side",
    "all_fours",
    "kneeling",
    "plank",
  ];
  const hasFloor = positions.some((p) => floorPositions.includes(p));
  // If any position is floor-based, the exercise requires floor
  if (hasFloor) return "floor";
  return "standing";
}
