import type {
  BodyArea,
  Category,
  Difficulty,
  EnergyLevel,
  ExerciseMode,
  ImpactLevel,
  Joint,
  MovementPattern,
  Position,
  SessionPhase,
} from "./enums.ts";

export type MediaType = "animation" | "start_position" | "end_position";

export interface ExerciseMediaItem {
  id: string;
  type: MediaType;
  format?: string;
  localPath?: string;
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
  identicalPairDetected?: boolean;
}

export interface ExerciseQuality {
  status: string; // "verified" | "review_required" | ...
  translationReviewed?: boolean;
  classificationReviewed?: boolean;
  mediaReviewed?: boolean;
  notes?: string | string[];
}

export interface ExerciseSource {
  provider: string;
  license: string;
  sourceId?: string;
  repositoryUrl?: string;
  commit?: string;
  sourceCommit?: string;
  originalImagePaths?: string[];
}

export interface Exercise {
  id: string;
  slug: string;
  nameFr: string;
  nameEn?: string;
  shortDescriptionFr: string;
  instructionsFr: string[];
  originalInstructions?: string[];
  breathingGuidanceFr?: string;

  category: Category;
  sourceCategory?: string;
  tags: string[];
  mode: ExerciseMode;

  defaultDurationSeconds?: number;
  defaultRepetitions?: number;
  defaultSets?: number;
  restAfterSeconds: number;

  difficulty: Difficulty;
  minimumEnergy: EnergyLevel;
  maximumEnergy: EnergyLevel;
  minimumEnergyRank?: number;
  maximumEnergyRank?: number;
  intensity: number; // 1 - 5
  impactLevel: ImpactLevel;

  positions: Position[];
  primaryBodyAreas: BodyArea[];
  secondaryBodyAreas: BodyArea[];
  jointsUsed: Joint[];

  requiresUpperBody: boolean;
  requiresLowerBody: boolean;
  requiresArmSupport: boolean;
  requiresWristSupport?: boolean;
  requiresKneeSupport: boolean;
  requiresWall?: boolean;
  requiresFloorTransition: boolean;
  unilateral: boolean;
  jumping: boolean;
  balanceRequired?: boolean;

  compatibleWithUpperBodyDiscomfort: boolean;
  compatibleWithLowerBodyDiscomfort: boolean;
  suitableForGentleSession: boolean;
  suitableForWarmup: boolean;
  suitableForMainPhase?: boolean;
  suitableForCooldown: boolean;

  // ── New composition metadata ──────────────────────────────────────────
  suitablePhases: SessionPhase[];
  movementPatterns: MovementPattern[];
  fatigueAreas: BodyArea[];

  generalPrecautionsFr: string[];
  stopSignalsFr: string[];

  easierVariantId?: string;
  harderVariantId?: string;
  alternativeExerciseIds: string[];

  media: ExerciseMediaItem[];
  source?: ExerciseSource;
  quality?: ExerciseQuality;
  enabled: boolean;

  // Compatibility aliases (from export script)
  name?: string;
  shortDescription?: string;
  instructions?: string[];
  generalPrecautions?: string[];
  stopSignals?: string[];
}
