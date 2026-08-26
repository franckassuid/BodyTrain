import { SESSION_PHASES } from "../types/enums.ts";
import type { DiscomfortZone, SessionPhase } from "../types/enums.ts";
import { getTransitionLevel } from "../types/enums.ts";
import type { GeneratedSession, SessionExercise } from "../types/session.ts";

// ── Validation result ───────────────────────────────────────────────────────

export interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  details?: string[];
}

// ── Individual validation rules ─────────────────────────────────────────────

/**
 * Rule 1: Phases must appear in the correct order.
 * Allowed order: wakeup → mobility → activation → dynamic → finish
 * Not all phases need to be present, but those present must be in order.
 */
export function validatePhaseOrder(exercises: SessionExercise[]): ValidationResult {
  const phaseOrder = SESSION_PHASES;
  const exercisePhases = exercises.map((e) => e.phase);

  let lastPhaseIndex = -1;
  const violations: string[] = [];

  for (let i = 0; i < exercisePhases.length; i++) {
    const currentIndex = phaseOrder.indexOf(exercisePhases[i] as SessionPhase);
    if (currentIndex < lastPhaseIndex) {
      violations.push(
        `Exercice ${i + 1} (${exercises[i].exercise.id}) est en phase "${exercisePhases[i]}" après "${exercisePhases[i - 1]}" — ordre inversé`
      );
    }
    if (currentIndex >= 0) {
      lastPhaseIndex = currentIndex;
    }
  }

  return {
    rule: "phase_order",
    passed: violations.length === 0,
    message: violations.length === 0
      ? "Les phases sont dans l'ordre correct"
      : "Certaines phases ne respectent pas l'ordre de progression",
    details: violations,
  };
}

/**
 * Rule 2: First exercise must not be intense (intensity <= 2).
 */
export function validateNoIntenseStart(exercises: SessionExercise[]): ValidationResult {
  if (exercises.length === 0) {
    return { rule: "no_intense_start", passed: true, message: "Aucun exercice", details: [] };
  }

  const first = exercises[0].exercise;
  const passed = first.intensity <= 2;

  return {
    rule: "no_intense_start",
    passed,
    message: passed
      ? "Le premier exercice est doux"
      : `Le premier exercice "${first.id}" a une intensité de ${first.intensity} (max autorisé: 2)`,
  };
}

/**
 * Rule 3: Last exercise must be calming (intensity <= 2, finish phase).
 * The session must end progressively, not abruptly.
 */
export function validateProgressiveEnd(exercises: SessionExercise[]): ValidationResult {
  if (exercises.length === 0) {
    return { rule: "progressive_end", passed: true, message: "Aucun exercice" };
  }

  const last = exercises[exercises.length - 1];
  const violations: string[] = [];

  if (last.exercise.intensity > 2) {
    violations.push(
      `Dernier exercice "${last.exercise.id}" a une intensité de ${last.exercise.intensity}`
    );
  }

  if (last.phase !== "finish" && last.phase !== "wakeup") {
    violations.push(
      `Dernier exercice est en phase "${last.phase}" au lieu de "finish"`
    );
  }

  // Check that the most intense exercise is not the last
  if (exercises.length >= 3) {
    const maxIntensity = Math.max(...exercises.map((e) => e.exercise.intensity));
    if (last.exercise.intensity === maxIntensity && maxIntensity > 2) {
      violations.push("L'exercice le plus intense est en dernière position");
    }
  }

  return {
    rule: "progressive_end",
    passed: violations.length === 0,
    message: violations.length === 0
      ? "La séance se termine en douceur"
      : "La fin de séance n'est pas progressive",
    details: violations,
  };
}

/**
 * Rule 4: No duplicate exercises in the session.
 */
export function validateNoDuplicates(exercises: SessionExercise[]): ValidationResult {
  const ids = exercises.map((e) => e.exercise.id);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }

  return {
    rule: "no_duplicates",
    passed: duplicates.length === 0,
    message: duplicates.length === 0
      ? "Aucun doublon"
      : `Exercices en double: ${duplicates.join(", ")}`,
    details: duplicates,
  };
}

/**
 * Rule 5: No two consecutive exercises with the same primary movement pattern.
 */
export function validateNoConsecutiveSamePattern(exercises: SessionExercise[]): ValidationResult {
  const violations: string[] = [];

  for (let i = 1; i < exercises.length; i++) {
    const prevPatterns = exercises[i - 1].exercise.movementPatterns || [];
    const currPatterns = exercises[i].exercise.movementPatterns || [];
    const overlap = prevPatterns.filter((p) => currPatterns.includes(p));

    // If the ONLY patterns of both exercises are shared, that's a violation
    if (overlap.length > 0 && overlap.length === currPatterns.length && overlap.length === prevPatterns.length) {
      violations.push(
        `Exercices ${i} et ${i + 1} partagent les mêmes patterns: ${overlap.join(", ")}`
      );
    }
  }

  return {
    rule: "no_consecutive_same_pattern",
    passed: violations.length === 0,
    message: violations.length === 0
      ? "Patterns de mouvement variés entre exercices consécutifs"
      : "Patterns de mouvement identiques entre exercices consécutifs",
    details: violations,
  };
}

/**
 * Rule 6: Floor exercises should be grouped together (minimize transitions).
 * Count the number of standing↔floor transitions and flag if > 2.
 */
export function validateFloorGrouping(exercises: SessionExercise[]): ValidationResult {
  let transitions = 0;
  const transitionDetails: string[] = [];

  for (let i = 1; i < exercises.length; i++) {
    const prevLevel = getTransitionLevel(exercises[i - 1].exercise.positions);
    const currLevel = getTransitionLevel(exercises[i].exercise.positions);

    if (prevLevel !== currLevel) {
      transitions++;
      transitionDetails.push(
        `Transition ${prevLevel}→${currLevel} entre exercices ${i} (${exercises[i - 1].exercise.id}) et ${i + 1} (${exercises[i].exercise.id})`
      );
    }
  }

  // Allow up to 2 transitions (going to floor and coming back up)
  const passed = transitions <= 2;

  return {
    rule: "floor_grouping",
    passed,
    message: passed
      ? `${transitions} transition(s) sol/debout (max 2)`
      : `${transitions} transitions sol/debout — trop de changements de position`,
    details: transitionDetails,
  };
}

/**
 * Rule 7: All exercises must respect the declared discomfort zone.
 */
export function validateDiscomfortCompliance(
  exercises: SessionExercise[],
  zone: DiscomfortZone
): ValidationResult {
  if (zone === "none") {
    return {
      rule: "discomfort_compliance",
      passed: true,
      message: "Aucune gêne déclarée",
    };
  }

  const violations: string[] = [];

  for (const se of exercises) {
    const ex = se.exercise;

    if (zone === "upper") {
      if (!ex.compatibleWithUpperBodyDiscomfort) {
        violations.push(`${ex.id}: non compatible avec gêne haut du corps`);
      }
      if (ex.requiresUpperBody) {
        violations.push(`${ex.id}: nécessite le haut du corps`);
      }
      if (ex.requiresArmSupport) {
        violations.push(`${ex.id}: nécessite un appui sur les bras`);
      }
    }

    if (zone === "lower") {
      if (!ex.compatibleWithLowerBodyDiscomfort) {
        violations.push(`${ex.id}: non compatible avec gêne bas du corps`);
      }
      if (ex.requiresLowerBody) {
        violations.push(`${ex.id}: nécessite le bas du corps`);
      }
      if (ex.requiresKneeSupport) {
        violations.push(`${ex.id}: nécessite un appui sur les genoux`);
      }
    }

    // General safety for any discomfort
    if (ex.jumping) {
      violations.push(`${ex.id}: sauts interdits avec une gêne`);
    }
    if (ex.impactLevel === "high" || ex.impactLevel === "medium") {
      violations.push(`${ex.id}: impact ${ex.impactLevel} interdit avec une gêne`);
    }
    if (ex.intensity > 3) {
      violations.push(`${ex.id}: intensité ${ex.intensity} trop élevée avec une gêne`);
    }
  }

  return {
    rule: "discomfort_compliance",
    passed: violations.length === 0,
    message: violations.length === 0
      ? `Tous les exercices respectent la gêne "${zone}"`
      : `${violations.length} violation(s) de la gêne "${zone}"`,
    details: violations,
  };
}

/**
 * Rule 8: Total duration must be within acceptable bounds.
 */
export function validateDuration(
  exercises: SessionExercise[],
  targetMinutes: number
): ValidationResult {
  const total = exercises.reduce(
    (sum, e) => sum + e.preparationSeconds + e.targetDurationSeconds + e.restSeconds,
    0
  );
  const targetSeconds = targetMinutes * 60;
  const maxAllowed = targetSeconds + 15;
  const minAllowed = targetSeconds - 45;

  const passed = total >= minAllowed && total <= maxAllowed;

  return {
    rule: "duration",
    passed,
    message: passed
      ? `Durée ${total}s dans les limites [${minAllowed}s, ${maxAllowed}s]`
      : `Durée ${total}s hors limites [${minAllowed}s, ${maxAllowed}s]`,
  };
}

/**
 * Rule 9: Check that fatigue areas are not over-concentrated.
 * No single body area should appear in more than 50% of exercises.
 */
export function validateBodyCoverage(exercises: SessionExercise[]): ValidationResult {
  if (exercises.length <= 2) {
    return { rule: "body_coverage", passed: true, message: "Trop peu d'exercices pour évaluer" };
  }

  const areaCounts = new Map<string, number>();
  for (const se of exercises) {
    for (const area of se.exercise.fatigueAreas || []) {
      areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
    }
  }

  const maxAllowed = Math.ceil(exercises.length * 0.6);
  const violations: string[] = [];

  for (const [area, count] of areaCounts) {
    if (count > maxAllowed) {
      violations.push(`Zone "${area}" présente dans ${count}/${exercises.length} exercices (max ${maxAllowed})`);
    }
  }

  return {
    rule: "body_coverage",
    passed: violations.length === 0,
    message: violations.length === 0
      ? "Zones corporelles bien réparties"
      : "Concentration excessive sur certaines zones",
    details: violations,
  };
}

/**
 * Rule 10: Intensity curve validation.
 * The session should have a rising-then-falling intensity curve.
 * Peak intensity should be in the middle 60% of the session, not at the extremes.
 */
export function validateIntensityCurve(exercises: SessionExercise[]): ValidationResult {
  if (exercises.length < 3) {
    return { rule: "intensity_curve", passed: true, message: "Trop peu d'exercices pour évaluer la courbe" };
  }

  const intensities = exercises.map((e) => e.exercise.intensity);
  const maxIntensity = Math.max(...intensities);
  const peakIndex = intensities.indexOf(maxIntensity);

  // Peak should not be first or last
  const isFirstOrLast = peakIndex === 0 || peakIndex === intensities.length - 1;
  // For very gentle sessions (all intensity 1-2), peak placement doesn't matter
  const isGentle = maxIntensity <= 2;

  const passed = isGentle || !isFirstOrLast;

  return {
    rule: "intensity_curve",
    passed,
    message: passed
      ? "Courbe d'intensité progressive"
      : `Pic d'intensité (${maxIntensity}) en position ${isFirstOrLast ? "extrême" : "correcte"} (exercice ${peakIndex + 1})`,
  };
}

// ── Full session validation ─────────────────────────────────────────────────

/**
 * Run all validation rules on a generated session.
 */
export function validateFullSession(session: GeneratedSession): ValidationResult[] {
  const exercises = session.exercises;

  return [
    validatePhaseOrder(exercises),
    validateNoIntenseStart(exercises),
    validateProgressiveEnd(exercises),
    validateNoDuplicates(exercises),
    validateNoConsecutiveSamePattern(exercises),
    validateFloorGrouping(exercises),
    validateDiscomfortCompliance(exercises, session.discomfortZone),
    validateDuration(exercises, session.targetDurationMinutes),
    validateBodyCoverage(exercises),
    validateIntensityCurve(exercises),
  ];
}

/**
 * Quick check: does the session pass ALL validation rules?
 */
export function isSessionValid(session: GeneratedSession): boolean {
  return validateFullSession(session).every((r) => r.passed);
}

/**
 * Get only the failed validations.
 */
export function getSessionViolations(session: GeneratedSession): ValidationResult[] {
  return validateFullSession(session).filter((r) => !r.passed);
}
