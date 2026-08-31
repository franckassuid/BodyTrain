import type { Exercise } from "../types/exercise.ts";

export interface PositionTransitionInfo {
  type:
    | "floor_to_standing"
    | "standing_to_floor"
    | "wall_or_chair"
    | "seated"
    | "stay_floor"
    | "stay_standing";
  badgeLabel: string;
  badgeEmoji: string;
  badgeBg: string;
  badgeColor: string;
  instruction: string;
  speechPrompt: string;
}

/**
 * Determines position transition instructions between current and next exercise.
 */
export function getPositionTransitionInfo(
  current: Exercise | null | undefined,
  next: Exercise | null | undefined
): PositionTransitionInfo {
  if (!next) {
    return {
      type: "stay_standing",
      badgeLabel: "Dernier mouvement",
      badgeEmoji: "🏁",
      badgeBg: "var(--bg-surface-elevated)",
      badgeColor: "var(--text-main)",
      instruction: "Respirez et profitez de la fin de séance",
      speechPrompt: "",
    };
  }

  const floorPositions = [
    "lying_back",
    "lying_front",
    "lying_side",
    "all_fours",
    "plank",
    "kneeling",
  ];

  const isCurrentFloor = Boolean(
    current?.positions?.some((p) => floorPositions.includes(p))
  );
  const isNextFloor = Boolean(
    next?.positions?.some((p) => floorPositions.includes(p))
  );
  const isNextSeated = Boolean(next?.positions?.includes("seated"));

  const isNextWallOrChair = Boolean(
    next.slug?.includes("mur") ||
      next.nameFr?.toLowerCase().includes("mur") ||
      next.tags?.includes("chaise") ||
      next.tags?.includes("mur") ||
      next.tags?.includes("avec-support") ||
      next.slug?.includes("chaise")
  );

  if (isNextWallOrChair) {
    return {
      type: "wall_or_chair",
      badgeLabel: "Appui chaise ou mur",
      badgeEmoji: "🪑",
      badgeBg: "rgba(244, 162, 97, 0.18)",
      badgeColor: "#D97706",
      instruction: "Placez-vous près d'un mur ou d'une chaise d'appui",
      speechPrompt: "Préparez un appui mur ou une chaise.",
    };
  }

  if (!isCurrentFloor && isNextFloor) {
    return {
      type: "standing_to_floor",
      badgeLabel: "Passage au sol",
      badgeEmoji: "🧘",
      badgeBg: "rgba(45, 106, 79, 0.16)",
      badgeColor: "#2D6A4F",
      instruction: "Installez-vous confortablement au sol sur votre tapis",
      speechPrompt: "Installez-vous au sol.",
    };
  }

  if (isCurrentFloor && !isNextFloor && !isNextSeated) {
    return {
      type: "floor_to_standing",
      badgeLabel: "Relevez-vous (Debout)",
      badgeEmoji: "⬆️",
      badgeBg: "rgba(2, 132, 199, 0.16)",
      badgeColor: "#0284C7",
      instruction: "Prenez appui et relevez-vous calmement",
      speechPrompt: "Relevez-vous en position debout.",
    };
  }

  if (isNextSeated) {
    return {
      type: "seated",
      badgeLabel: "Position assise",
      badgeEmoji: "🪑",
      badgeBg: "rgba(100, 116, 139, 0.16)",
      badgeColor: "#475569",
      instruction: "Asseyez-vous sur une chaise ou au sol le dos droit",
      speechPrompt: "Installez-vous en position assise.",
    };
  }

  if (isCurrentFloor && isNextFloor) {
    return {
      type: "stay_floor",
      badgeLabel: "Restez au sol",
      badgeEmoji: "🧘",
      badgeBg: "rgba(45, 106, 79, 0.12)",
      badgeColor: "#2D6A4F",
      instruction: "Maintenez votre position au sol",
      speechPrompt: "Restez au sol.",
    };
  }

  return {
    type: "stay_standing",
    badgeLabel: "Position debout",
    badgeEmoji: "🚶",
    badgeBg: "rgba(2, 132, 199, 0.12)",
    badgeColor: "#0284C7",
    instruction: "Restez en position debout",
    speechPrompt: "Restez debout.",
  };
}
