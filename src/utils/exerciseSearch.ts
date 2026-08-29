import type { Exercise } from "../types/exercise.ts";
import { CATEGORY_LABELS, type Category } from "../types/enums.ts";

/**
 * French anatomical mappings and search synonyms for each BodyArea.
 */
export const BODY_AREA_SYNONYMS: Record<string, string[]> = {
  abdominals: [
    "abdo", "abdos", "abdominaux", "abdominale", "abdominal",
    "ventre", "core", "tronc", "taille", "crunch", "gainage", "tablette"
  ],
  obliques: [
    "oblique", "obliques", "taille", "flanc", "flancs", "abdos", "abdo", "cote", "rotation"
  ],
  deep_core: [
    "gainage", "centre", "core", "transverse", "plank", "tronc", "ventre", "profond", "abdos", "abdo"
  ],
  glutes: [
    "fessier", "fessiers", "fesse", "fesses", "glute", "glutes", "bassin", "hanche", "hanches"
  ],
  quadriceps: [
    "cuisse", "cuisses", "quadriceps", "quadri", "quadris", "jambe", "jambes", "squat", "fente"
  ],
  hamstrings: [
    "ischio", "ischios", "ischio-jambier", "ischio-jambiers", "ischios-jambiers",
    "arriere-cuisse", "cuisse", "cuisses", "jambe", "jambes"
  ],
  calves: [
    "mollet", "mollets", "soleaire", "gastrocnemien", "bas de jambe", "jambe", "pointe", "talon"
  ],
  ankles: [
    "cheville", "chevilles", "pied", "pieds", "tarse", "talon"
  ],
  feet: [
    "pied", "pieds", "plante", "voute", "orteil", "orteils", "talon"
  ],
  neck: [
    "cou", "nuque", "cervicale", "cervicales", "tete", "cervical", "haut"
  ],
  shoulders: [
    "epaule", "epaules", "deltoide", "deltoides", "coiffe", "scapula",
    "omoplate", "omoplates", "bras", "haut du corps"
  ],
  upper_back: [
    "haut du dos", "dos", "dorsal", "dorsaux", "omoplate", "omoplates",
    "trapeze", "trapezes", "rhomboides", "posture"
  ],
  mid_back: [
    "milieu du dos", "dos", "dorsal", "dorsaux", "thoracique", "colonne"
  ],
  lower_back: [
    "bas du dos", "lombaire", "lombaires", "dos", "reins", "rachis"
  ],
  lats: [
    "grand dorsal", "dorsal", "dorsaux", "dos", "lats", "tirage"
  ],
  chest: [
    "poitrine", "pectoral", "pectoraux", "pecs", "pec", "buste", "thorax", "pompe", "pompes"
  ],
  biceps: [
    "biceps", "bras", "avant-bras", "flexion"
  ],
  triceps: [
    "triceps", "bras", "arriere-bras", "pompe", "pompes", "poussee"
  ],
  forearms: [
    "avant-bras", "bras", "poignet", "poignets", "prehension"
  ],
  wrists: [
    "poignet", "poignets", "main", "mains", "carpe"
  ],
  hip_flexors: [
    "flechisseur", "flechisseurs", "psoas", "iliaque", "hanche", "hanches", "aine", "bassin"
  ],
  abductors: [
    "abducteur", "abducteurs", "moyen fessier", "exterieur cuisse", "hanche", "hanches"
  ],
  adductors: [
    "adducteur", "adducteurs", "interieur cuisse", "aine", "entrejambe"
  ],
  diaphragm: [
    "diaphragme", "respiration", "souffle", "poumons", "thorax", "inspire", "expire"
  ],
};

/**
 * French anatomical mappings and search synonyms for each Joint.
 */
export const JOINT_SYNONYMS: Record<string, string[]> = {
  neck: ["cou", "nuque", "cervicale", "cervicales"],
  shoulder: ["epaule", "epaules", "omoplate", "omoplates"],
  thoracic_spine: ["colonne", "dorsale", "dos", "thorax", "milieu du dos"],
  lumbar_spine: ["lombaire", "lombaires", "bas du dos", "dos"],
  hip: ["hanche", "hanches", "bassin", "fessier", "fessiers"],
  knee: ["genou", "genoux", "rotule"],
  ankle: ["cheville", "chevilles", "pied", "pieds"],
  wrist: ["poignet", "poignets", "main", "mains"],
  elbow: ["coude", "coudes", "bras"],
};

/**
 * Direct category target synonyms for quick matching.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  core_strength: ["abdos", "abdo", "gainage", "abdominaux", "ventre", "core", "tronc"],
  glutes_strength: ["fessiers", "fessier", "fesses", "fesse", "glutes"],
  legs_strength: ["cuisses", "cuisse", "quadriceps", "ischios", "jambes", "jambe", "squat", "fente"],
  back_strength: ["dos", "lombaires", "lombaire", "dorsaux", "dorsal", "haut du dos"],
  upper_body_strength: ["haut du corps", "bras", "pompes", "pompe", "pectoraux", "poitrine", "triceps", "biceps", "epaules"],
  neck_mobility: ["cou", "nuque", "cervicales", "cervicale", "tete"],
  shoulder_mobility: ["epaules", "epaule", "omoplates", "omoplate", "bras", "poignets", "poignet"],
  spine_mobility: ["dos", "colonne", "rachis", "lombaires", "dorsale", "tronc"],
  hip_mobility: ["hanches", "hanche", "bassin", "psoas", "flechisseurs"],
  knee_mobility: ["genoux", "genou", "rotule"],
  ankle_mobility: ["chevilles", "cheville", "pieds", "pied", "mollets", "mollet"],
  breathing: ["respiration", "souffle", "poumons", "diaphragme", "calme", "detente"],
  light_stretching: ["etirement", "etirements", "souplesse", "stretching"],
  gentle_cardio: ["cardio", "marche", "coordination", "endurance"],
  dynamic_cardio: ["cardio", "dynamique", "tonique", "saut", "rythme"],
  balance: ["equilibre", "stabilite", "proprioception"],
};

/**
 * Remove accents and normalize text for fuzzy searching.
 */
export function normalizeSearchString(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics / accents
    .replace(/[-_']/g, " ") // normalize punctuation to spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns a relevance score for an exercise given a search query.
 * Higher score = more relevant match.
 * Returns 0 if no match.
 */
export function scoreExerciseSearch(exercise: Exercise, query: string): number {
  const cleanQuery = normalizeSearchString(query);
  if (!cleanQuery) return 1;

  const tokens = cleanQuery.split(" ").filter((t) => t.length > 0);
  if (tokens.length === 0) return 1;

  const nameNorm = normalizeSearchString(exercise.nameFr || exercise.name || "");
  const slugNorm = normalizeSearchString(exercise.slug || exercise.id || "");
  const descNorm = normalizeSearchString(exercise.shortDescriptionFr || "");
  const tagsNorm = normalizeSearchString((exercise.tags || []).join(" "));
  const instructionsNorm = normalizeSearchString((exercise.instructionsFr || []).join(" "));

  const cat = exercise.category || "";
  const catLabel = CATEGORY_LABELS[cat as Category] || "";
  const catNorm = normalizeSearchString(`${cat} ${catLabel}`);
  const catSyns = normalizeSearchString((CATEGORY_SYNONYMS[cat] || []).join(" "));

  // Primary body areas + synonyms (highest weight)
  const primarySyns = normalizeSearchString(
    (exercise.primaryBodyAreas || []).flatMap((a) => [a, ...(BODY_AREA_SYNONYMS[a] || [])]).join(" ")
  );

  // Secondary body areas + synonyms (medium weight)
  const secondarySyns = normalizeSearchString(
    (exercise.secondaryBodyAreas || []).flatMap((a) => [a, ...(BODY_AREA_SYNONYMS[a] || [])]).join(" ")
  );

  // Joints + synonyms
  const jointSyns = normalizeSearchString(
    (exercise.jointsUsed || []).flatMap((j) => [j, ...(JOINT_SYNONYMS[j] || [])]).join(" ")
  );

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;

    // 1. Direct name/slug match
    if (nameNorm.includes(token) || slugNorm.includes(token)) {
      tokenScore += 150;
      if (nameNorm.startsWith(token)) tokenScore += 50;
    }

    // 2. Category direct synonym match
    if (catSyns.includes(token) || catNorm.includes(token)) {
      tokenScore += 120;
    }

    // 3. Primary body areas match
    if (primarySyns.includes(token)) {
      tokenScore += 100;
    }

    // 4. Tags match
    if (tagsNorm.includes(token)) {
      tokenScore += 60;
    }

    // 5. Joints match
    if (jointSyns.includes(token)) {
      tokenScore += 50;
    }

    // 6. Secondary body areas match
    if (secondarySyns.includes(token)) {
      tokenScore += 30;
    }

    // 7. Short description & instructions match
    if (descNorm.includes(token)) {
      tokenScore += 20;
    } else if (instructionsNorm.includes(token)) {
      tokenScore += 10;
    }

    if (tokenScore === 0) {
      return 0; // All tokens must match something
    }

    totalScore += tokenScore;
  }

  return totalScore;
}

/**
 * Filter and sort exercises by search query relevance.
 */
export function searchAndRankExercises(exercises: Exercise[], query: string): Exercise[] {
  if (!query || !query.trim()) {
    return exercises;
  }

  const scored: { exercise: Exercise; score: number }[] = [];

  for (const ex of exercises) {
    const score = scoreExerciseSearch(ex, query);
    if (score > 0) {
      scored.push({ exercise: ex, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.exercise);
}
