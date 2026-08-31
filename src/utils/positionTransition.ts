import type { Exercise } from "../types/exercise.ts";

export type ExercisePositionGroup =
  | "standing"
  | "wall_standing"
  | "floor_back"
  | "floor_front"
  | "floor_side"
  | "floor_all_fours"
  | "floor_plank"
  | "floor_kneeling"
  | "seated";

export interface ExercisePositionDetails {
  group: ExercisePositionGroup;
  categoryName: string;
  setupInstruction: string;
  isFloor: boolean;
}

export interface PositionTransitionInfo {
  type: string;
  badgeLabel: string;
  badgeEmoji: string;
  badgeBg: string;
  badgeColor: string;
  instruction: string;
  speechPrompt: string;
}

/**
 * Explicit posture details mapping for all exercises.
 */
export function getExercisePositionDetails(ex: Exercise | null | undefined): ExercisePositionDetails {
  if (!ex) {
    return {
      group: "standing",
      categoryName: "Debout",
      setupInstruction: "Debout, pieds largeur d'épaules",
      isFloor: false,
    };
  }

  const slug = ex.slug || ex.id;

  // 1. Specific Wall Exercises
  if (
    slug === "pompes-contre-un-mur" ||
    slug === "glissement-bras-contre-mur" ||
    slug === "squat-maintenu" ||
    slug === "etirement-des-mollets-au-mur" ||
    slug === "etirement-du-grand-dorsal-au-mur" ||
    slug === "ouverture-de-hanche-en-appui" ||
    slug === "flexion-extension-genou-debout"
  ) {
    let setup = "Debout avec appui mur ou chaise";
    if (slug === "pompes-contre-un-mur") setup = "Debout face au mur, mains à hauteur d'épaules";
    else if (slug === "glissement-bras-contre-mur") setup = "Debout dos au mur, bras en chandelier";
    else if (slug === "squat-maintenu") setup = "Dos en appui contre le mur, cuisses parallèles au sol";
    else if (slug === "etirement-des-mollets-au-mur") setup = "Debout face au mur, une jambe tendue en arrière";
    else if (slug === "etirement-du-grand-dorsal-au-mur") setup = "Debout face au mur, mains en appui et buste penché";
    else if (slug === "ouverture-de-hanche-en-appui") setup = "Debout, une main en appui sur un mur ou une chaise";
    else if (slug === "flexion-extension-genou-debout") setup = "Debout, une main en appui d'équilibre";

    return {
      group: "wall_standing",
      categoryName: "Debout au mur",
      setupInstruction: setup,
      isFloor: false,
    };
  }

  // 2. Seated Exercises
  if (
    slug === "respiration-diaphragmatique-assise" ||
    slug === "chat-vache-assis" ||
    slug === "cercles-de-cheville-assis" ||
    slug === "flexion-extension-de-cheville-assis" ||
    slug === "position-90-90-assis" ||
    slug === "etirement-des-trapezes-assis" ||
    (ex.positions?.length === 1 && ex.positions[0] === "seated")
  ) {
    let setup = "Assis sur une chaise ou au sol le dos droit";
    if (slug === "position-90-90-assis") setup = "Assis au sol, jambes pliées à 90 degrés";
    else if (slug === "chat-vache-assis") setup = "Assis sur une chaise, mains sur les genoux";
    else if (slug === "etirement-des-trapezes-assis") setup = "Assis le dos droit, incline délicatement la tête";

    return {
      group: "seated",
      categoryName: "Position assise",
      setupInstruction: setup,
      isFloor: false,
    };
  }

  // 3. Floor - On Back (Lying Back)
  if (
    slug === "respiration-diaphragmatique-allongee" ||
    slug === "bascule-du-bassin-allongee" ||
    slug === "rotation-thoracique-allongee" ||
    slug === "glissement-de-talon-allonge" ||
    slug === "dead-bug" ||
    slug === "crunch-court" ||
    slug === "ramene-de-genoux-allonge" ||
    slug === "pont-fessier" ||
    slug === "ischio-jambiers-allonge" ||
    ex.positions?.includes("lying_back")
  ) {
    let setup = "Allongé sur le dos sur le tapis";
    if (slug === "dead-bug") setup = "Allongé sur le dos, bras vers le ciel et genoux pliés à 90°";
    else if (slug === "pont-fessier") setup = "Allongé sur le dos, genoux pliés et pieds à plat";
    else if (slug === "crunch-court") setup = "Allongé sur le dos, mains derrière la tête";
    else if (slug === "ramene-de-genoux-allonge") setup = "Allongé sur le dos, ramène les genoux vers la poitrine";
    else if (slug === "rotation-thoracique-allongee") setup = "Allongé sur le dos, bras en croix";

    return {
      group: "floor_back",
      categoryName: "Au sol sur le dos",
      setupInstruction: setup,
      isFloor: true,
    };
  }

  // 4. Floor - On Front (Lying Front)
  if (
    slug === "extension-dorsale-au-sol" ||
    slug === "superman-au-sol" ||
    slug === "retractions-scapulaires-au-sol" ||
    ex.positions?.includes("lying_front")
  ) {
    let setup = "Allongé à plat ventre sur le tapis";
    if (slug === "superman-au-sol") setup = "Allongé sur le ventre, bras et jambes tendus";
    else if (slug === "extension-dorsale-au-sol") setup = "Allongé sur le ventre, mains sous le front";
    else if (slug === "retractions-scapulaires-au-sol") setup = "Allongé sur le ventre, bras en chandelier";

    return {
      group: "floor_front",
      categoryName: "Au sol sur le ventre",
      setupInstruction: setup,
      isFloor: true,
    };
  }

  // 5. Floor - On Side (Lying Side)
  if (
    slug === "coquillage-sur-le-cote" ||
    slug === "abduction-de-hanche-sur-le-cote" ||
    slug === "gainage-lateral-genoux-flechis" ||
    ex.positions?.includes("lying_side")
  ) {
    let setup = "Allongé sur le côté sur le tapis";
    if (slug === "coquillage-sur-le-cote") setup = "Allongé sur le côté, genoux fléchis l'un sur l'autre";
    else if (slug === "abduction-de-hanche-sur-le-cote") setup = "Allongé sur le côté, jambe supérieure tendue";
    else if (slug === "gainage-lateral-genoux-flechis") setup = "En appui latéral sur le coude et genoux au sol";

    return {
      group: "floor_side",
      categoryName: "Au sol sur le côté",
      setupInstruction: setup,
      isFloor: true,
    };
  }

  // 6. Floor - All Fours (Quadrupédie)
  if (
    slug === "chat-vache" ||
    slug === "coup-de-pied-arriere-quadrupedie" ||
    slug === "bras-jambe-opposes-quadrupedie" ||
    slug === "pompes-scapulaires-genoux-au-sol" ||
    slug === "pompes-genoux-au-sol" ||
    ex.positions?.includes("all_fours")
  ) {
    let setup = "À quatre pattes, mains sous les épaules et genoux sous les hanches";
    if (slug === "pompes-genoux-au-sol") setup = "En appui sur les mains et les genoux au sol";
    else if (slug === "bras-jambe-opposes-quadrupedie") setup = "À quatre pattes, préparez-vous à tendre bras et jambe opposés";

    return {
      group: "floor_all_fours",
      categoryName: "Au sol à 4 pattes",
      setupInstruction: setup,
      isFloor: true,
    };
  }

  // 7. Floor - Plank & Pushups
  if (
    slug === "gainage-avant-bras" ||
    slug === "gainage-genoux-au-sol" ||
    slug === "gainage-monte-descente" ||
    slug === "tape-epaules-en-gainage" ||
    slug === "pompes-classiques" ||
    slug === "montagnards" ||
    slug === "chenille" ||
    ex.positions?.includes("plank")
  ) {
    let setup = "En position de gainage au sol";
    if (slug === "gainage-avant-bras") setup = "En appui sur les avant-bras et la pointe des pieds";
    else if (slug === "gainage-genoux-au-sol") setup = "En appui sur les avant-bras et les genoux";
    else if (slug === "pompes-classiques" || slug === "tape-epaules-en-gainage" || slug === "montagnards") {
      setup = "En appui planche bras tendus sur les mains";
    }

    return {
      group: "floor_plank",
      categoryName: "Au sol en gainage",
      setupInstruction: setup,
      isFloor: true,
    };
  }

  // 8. Floor - Kneeling
  if (slug === "posture-de-l-enfant" || ex.positions?.includes("kneeling")) {
    return {
      group: "floor_kneeling",
      categoryName: "Au sol à genoux",
      setupInstruction: "À genoux, fesses sur les talons et bras allongés devant",
      isFloor: true,
    };
  }

  // 9. Standard Standing (Default)
  return {
    group: "standing",
    categoryName: "Debout",
    setupInstruction: "Debout, pieds écartés de la largeur des épaules",
    isFloor: false,
  };
}

/**
 * Calculates transition instruction between current and next exercise.
 */
export function getPositionTransitionInfo(
  current: Exercise | null | undefined,
  next: Exercise | null | undefined
): PositionTransitionInfo {
  if (!next) {
    return {
      type: "finish",
      badgeLabel: "Dernier mouvement",
      badgeEmoji: "🏁",
      badgeBg: "var(--bg-surface-elevated)",
      badgeColor: "var(--text-main)",
      instruction: "Respirez et profitez de la fin de séance",
      speechPrompt: "",
    };
  }

  const curPos = getExercisePositionDetails(current);
  const nextPos = getExercisePositionDetails(next);

  // 1. Next is Wall Standing
  if (nextPos.group === "wall_standing") {
    return {
      type: "wall_standing",
      badgeLabel: "🧱 Debout avec appui mur",
      badgeEmoji: "🧱",
      badgeBg: "rgba(244, 162, 97, 0.2)",
      badgeColor: "#D97706",
      instruction: nextPos.setupInstruction,
      speechPrompt: "Placez-vous debout près d'un mur.",
    };
  }

  // 2. Next is Floor
  if (nextPos.isFloor) {
    if (!curPos.isFloor) {
      return {
        type: "standing_to_floor",
        badgeLabel: `🧘 Passage au sol (${nextPos.categoryName.replace("Au sol ", "")})`,
        badgeEmoji: "🧘",
        badgeBg: "rgba(45, 106, 79, 0.16)",
        badgeColor: "#2D6A4F",
        instruction: nextPos.setupInstruction,
        speechPrompt: `Passage au sol. ${nextPos.setupInstruction.split(",")[0]}.`,
      };
    }

    // Already on floor
    return {
      type: "stay_floor",
      badgeLabel: `🧘 ${nextPos.categoryName}`,
      badgeEmoji: "🧘",
      badgeBg: "rgba(45, 106, 79, 0.12)",
      badgeColor: "#2D6A4F",
      instruction: nextPos.setupInstruction,
      speechPrompt: "Restez au sol.",
    };
  }

  // 3. Next is Standing
  if (nextPos.group === "standing") {
    if (curPos.isFloor || curPos.group === "seated") {
      return {
        type: "floor_to_standing",
        badgeLabel: "⬆️ Relevez-vous (Debout)",
        badgeEmoji: "⬆️",
        badgeBg: "rgba(2, 132, 199, 0.16)",
        badgeColor: "#0284C7",
        instruction: "Prenez appui et relevez-vous calmement",
        speechPrompt: "Relevez-vous en position debout.",
      };
    }

    return {
      type: "stay_standing",
      badgeLabel: "🚶 Position debout",
      badgeEmoji: "🚶",
      badgeBg: "rgba(2, 132, 199, 0.12)",
      badgeColor: "#0284C7",
      instruction: nextPos.setupInstruction,
      speechPrompt: "Restez debout.",
    };
  }

  // 4. Next is Seated
  return {
    type: "seated",
    badgeLabel: "🪑 Position assise",
    badgeEmoji: "🪑",
    badgeBg: "rgba(100, 116, 139, 0.16)",
    badgeColor: "#475569",
    instruction: nextPos.setupInstruction,
    speechPrompt: "Installez-vous en position assise.",
  };
}
