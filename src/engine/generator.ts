import { EXERCISES, EXERCISES_MAP } from "../data/exercisesData.ts";
import type { DiscomfortZone, SessionPhase, Position } from "../types/enums.ts";
import { getTransitionLevel } from "../types/enums.ts";
import type { Exercise } from "../types/exercise.ts";
import type { GeneratedSession, SessionExercise } from "../types/session.ts";
import { selectTemplate } from "./sessionTemplates.ts";
import type { SessionTemplate, PhaseSlot } from "./sessionTemplates.ts";
import { calculateRecoverySeconds } from "./recoveryCalculator.ts";

// ── Public API ──────────────────────────────────────────────────────────────

export interface GeneratorOptions {
  energyScore: number; // 0 to 10
  discomfortZone: DiscomfortZone;
  targetDurationMinutes?: number; // 5, 7 (default), or 10
  recentSessionExerciseIds?: string[][]; // Last sessions arrays of exercise IDs
  seed?: number;
}

// ── PRNG ────────────────────────────────────────────────────────────────────

/** Pure deterministic pseudo-random number generator (Mulberry32) */
export function createRng(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Energy profile ──────────────────────────────────────────────────────────

export function getEnergyProfile(energyScore: number) {
  const score = Math.max(0, Math.min(10, Math.round(energyScore)));
  if (score <= 2) {
    return {
      tier: "very_low" as const,
      intensityLabel: "Très doux",
      description: "Réveil très doux axé sur le souffle, la mobilité articulaire et la détente.",
      maxIntensity: 2,
      allowedImpacts: ["none", "low"],
      preferGentle: true,
    };
  }
  if (score <= 4) {
    return {
      tier: "low" as const,
      intensityLabel: "Doux",
      description: "Séance douce pour réveiller le corps en douceur et fluidité sans forcer.",
      maxIntensity: 3,
      allowedImpacts: ["none", "low"],
      preferGentle: true,
    };
  }
  if (score <= 7) {
    return {
      tier: "medium" as const,
      intensityLabel: "Équilibré",
      description: "Séance équilibrée pour mobiliser les articulations et stimuler l'énergie matinale.",
      maxIntensity: 4,
      allowedImpacts: ["none", "low", "medium"],
      preferGentle: false,
    };
  }
  return {
    tier: "high" as const,
    intensityLabel: "Dynamique",
    description: "Séance tonique et rythmée pour un réveil actif et énergisant.",
    maxIntensity: 5,
    allowedImpacts: ["none", "low", "medium", "high"],
    preferGentle: false,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

export function isFloorPosition(positions: string[]): boolean {
  return positions.some(
    (p) => p.startsWith("lying_") || p === "all_fours" || p === "kneeling" || p === "plank"
  );
}

// ── Candidate filtering ─────────────────────────────────────────────────────

/**
 * Filter exercises compatible with energy and discomfort constraints.
 */
export function filterCandidates(
  exercises: Exercise[],
  energyScore: number,
  discomfortZone: DiscomfortZone
): Exercise[] {
  const profile = getEnergyProfile(energyScore);

  return exercises.filter((ex) => {
    if (!ex.enabled) return false;

    // Discomfort filtering
    if (discomfortZone === "upper") {
      if (!ex.compatibleWithUpperBodyDiscomfort) return false;
      if (ex.requiresUpperBody || ex.requiresArmSupport || ex.requiresWristSupport) return false;
    }
    if (discomfortZone === "lower") {
      if (!ex.compatibleWithLowerBodyDiscomfort) return false;
      if (ex.requiresLowerBody || ex.requiresKneeSupport) return false;
    }

    // Jumping & High Impact rules
    if (discomfortZone !== "none") {
      if (ex.jumping) return false;
      if (ex.impactLevel === "high" || ex.impactLevel === "medium") return false;
      if (ex.intensity > 3) return false;
    } else {
      if (!profile.allowedImpacts.includes(ex.impactLevel)) return false;
      if (ex.intensity > profile.maxIntensity) return false;
    }

    // Energy window filtering
    if (profile.tier === "very_low") {
      if (ex.minimumEnergy !== "very_low") return false;
      if (ex.intensity > 2) return false;
    } else if (profile.tier === "low") {
      if (ex.minimumEnergy === "medium" || ex.minimumEnergy === "high") return false;
    }

    return true;
  });
}

/**
 * Filter candidates for a specific phase within a phase slot.
 */
function filterPhasePool(
  candidates: Exercise[],
  phase: SessionPhase,
  slot: PhaseSlot
): Exercise[] {
  return candidates.filter((ex) => {
    // Must be suitable for this phase
    if (!ex.suitablePhases || !ex.suitablePhases.includes(phase)) return false;
    // Must not exceed the phase's max intensity
    if (ex.intensity > slot.maxIntensity) return false;
    return true;
  });
}

// ── Fallback pool ───────────────────────────────────────────────────────────

function getSafeFallbackPool(discomfortZone: DiscomfortZone): Exercise[] {
  return EXERCISES.filter((ex) => {
    if (!ex.enabled) return false;
    if (ex.intensity > 2) return false;
    if (ex.jumping) return false;
    if (ex.impactLevel !== "none" && ex.impactLevel !== "low") return false;
    if (discomfortZone === "upper" && !ex.compatibleWithUpperBodyDiscomfort) return false;
    if (discomfortZone === "lower" && !ex.compatibleWithLowerBodyDiscomfort) return false;
    return (
      ex.suitableForGentleSession ||
      ex.category === "breathing" ||
      ex.category === "gentle_wakeup" ||
      ex.category === "spine_mobility" ||
      ex.category === "light_stretching"
    );
  });
}

// ── Session generation ──────────────────────────────────────────────────────

/**
 * Generate a complete, balanced morning session.
 * Uses template-driven phase composition with scoring-based exercise selection.
 */
export function generateSession(options: GeneratorOptions): GeneratedSession {
  const {
    energyScore,
    discomfortZone,
    targetDurationMinutes = 7,
    recentSessionExerciseIds = [],
    seed = Date.now(),
  } = options;

  const rng = createRng(seed);
  const targetTotalSeconds = targetDurationMinutes * 60;
  const profile = getEnergyProfile(energyScore);
  const template = selectTemplate(targetDurationMinutes, energyScore);

  // Build the global candidate pool
  let candidates = filterCandidates(EXERCISES, energyScore, discomfortZone);

  // If too few candidates, augment with safe fallbacks
  if (candidates.length < 5) {
    const fallbacks = getSafeFallbackPool(discomfortZone);
    const existingIds = new Set(candidates.map((c) => c.id));
    for (const fb of fallbacks) {
      if (!existingIds.has(fb.id)) {
        candidates.push(fb);
        existingIds.add(fb.id);
      }
    }
  }

  // Recency penalty
  const recencyPenalty = new Map<string, number>();
  const recentWeight = [60, 40, 20];
  recentSessionExerciseIds.slice(0, 3).forEach((sessionIds, idx) => {
    const penalty = recentWeight[idx] || 15;
    for (const id of sessionIds) {
      recencyPenalty.set(id, (recencyPenalty.get(id) || 0) + penalty);
    }
  });

  const chosenExercises: { exercise: Exercise; phase: SessionPhase }[] = [];
  const chosenIds = new Set<string>();

  // ── Pick exercises per phase ──────────────────────────────────────────

  for (const slot of template.phases) {
    const phasePool = filterPhasePool(candidates, slot.phase, slot);
    const availablePool = phasePool.filter((e) => !chosenIds.has(e.id));

    if (availablePool.length === 0 && slot.optional) {
      continue; // Skip optional phase if no candidates
    }

    // Determine how many exercises to pick for this phase
    const targetCount = Math.min(
      slot.exerciseCount.max,
      Math.max(slot.exerciseCount.min, availablePool.length)
    );

    for (let i = 0; i < targetCount; i++) {
      const prev = chosenExercises.length > 0
        ? chosenExercises[chosenExercises.length - 1].exercise
        : undefined;

      const picked = pickBestCandidate(
        availablePool.filter((e) => !chosenIds.has(e.id)),
        slot.phase,
        prev,
        chosenExercises,
        profile,
        recencyPenalty,
        rng
      );

      if (picked) {
        chosenExercises.push({ exercise: picked, phase: slot.phase });
        chosenIds.add(picked.id);
      }
    }
  }

  // ── Ensure minimum exercise count ─────────────────────────────────────

  const minExercises = targetDurationMinutes === 5 ? 3 : targetDurationMinutes === 10 ? 5 : 4;
  if (chosenExercises.length < minExercises) {
    const remaining = candidates.filter((e) => !chosenIds.has(e.id));
    while (chosenExercises.length < minExercises && remaining.length > 0) {
      const idx = Math.floor(rng() * remaining.length);
      const ex = remaining.splice(idx, 1)[0];
      const phase = (ex.suitablePhases && ex.suitablePhases[0]) || "activation";
      chosenExercises.push({ exercise: ex, phase: phase as SessionPhase });
      chosenIds.add(ex.id);
    }
  }

  // ── Allocate timings ──────────────────────────────────────────────────

  const sessionExercises = allocateTimings(
    chosenExercises,
    targetTotalSeconds,
    energyScore,
    template
  );

  const estimatedTotalSeconds = sessionExercises.reduce(
    (sum, se) => sum + se.preparationSeconds + se.targetDurationSeconds + se.restSeconds,
    0
  );

  return {
    id: `session_${Date.now()}_${Math.floor(rng() * 10000)}`,
    createdAt: new Date().toISOString(),
    energyScore,
    discomfortZone,
    targetDurationMinutes,
    estimatedTotalSeconds,
    intensityLevel: profile.intensityLabel,
    description: profile.description,
    templateId: template.id,
    exercises: sessionExercises,
    seed,
  };
}

// ── Candidate scoring ───────────────────────────────────────────────────────

function pickBestCandidate(
  pool: Exercise[],
  phase: SessionPhase,
  prevEx: Exercise | undefined,
  chosenSoFar: { exercise: Exercise; phase: SessionPhase }[],
  profile: ReturnType<typeof getEnergyProfile>,
  recencyPenalty: Map<string, number>,
  rng: () => number
): Exercise | null {
  if (pool.length === 0) return null;

  // Calculate current transitions so far
  let currentTransitions = 0;
  for (let i = 1; i < chosenSoFar.length; i++) {
    const pLevel = getTransitionLevel(chosenSoFar[i - 1].exercise.positions as Position[]);
    const cLevel = getTransitionLevel(chosenSoFar[i].exercise.positions as Position[]);
    if (pLevel !== cLevel) currentTransitions++;
  }

  // Calculate fatigue area frequency
  const areaCounts = new Map<string, number>();
  for (const item of chosenSoFar) {
    for (const area of item.exercise.fatigueAreas || item.exercise.primaryBodyAreas || []) {
      areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
    }
  }

  // Check if eligible standing candidates exist in pool
  const hasStandingCandidates = pool.some(
    (e) =>
      getTransitionLevel(e.positions as Position[]) === "standing" &&
      (phase !== "wakeup" && phase !== "finish" ? true : e.intensity <= 2)
  );

  // Determine if we must avoid transitions (already at 2 transitions)
  const prevLevel = prevEx ? getTransitionLevel(prevEx.positions as Position[]) : undefined;
  const hasSameLevelCandidates = prevLevel
    ? pool.some(
        (e) =>
          getTransitionLevel(e.positions as Position[]) === prevLevel &&
          (phase !== "wakeup" && phase !== "finish" ? true : e.intensity <= 2)
      )
    : true;

  // Check if non-identical pattern candidates exist
  const hasDifferentPatternCandidates = prevEx
    ? pool.some((e) => {
        const pP = prevEx.movementPatterns || [];
        const cP = e.movementPatterns || [];
        const ov = pP.filter((p) => cP.includes(p));
        return !(ov.length > 0 && ov.length === cP.length && ov.length === pP.length);
      })
    : true;

  const scored = pool.map((ex) => {
    let score = 100;
    const currLevel = getTransitionLevel(ex.positions as Position[]);

    // Recency penalty
    const penalty = recencyPenalty.get(ex.id) || 0;
    score -= penalty;

    // Phase suitability bonus
    if (phase === "wakeup" && ex.suitableForWarmup) score += 20;
    if (phase === "finish" && ex.suitableForCooldown) score += 20;
    if (profile.preferGentle && ex.suitableForGentleSession) score += 25;

    // Wakeup: must be gentle and strictly standing when available
    if (phase === "wakeup") {
      if (ex.intensity > 2) return { ex, weight: 0 };
      if (currLevel === "floor" && hasStandingCandidates) return { ex, weight: 0 };
      if (ex.intensity <= 1) score += 20;
    }

    // Finish: must be gentle, calming, and strictly standing when available
    if (phase === "finish") {
      if (ex.intensity > 2) return { ex, weight: 0 };
      if (currLevel === "floor" && hasStandingCandidates) return { ex, weight: 0 };
      if (ex.intensity <= 1) score += 20;
    }

    // Dynamic: strictly standing when available
    if (phase === "dynamic") {
      if (currLevel === "floor" && hasStandingCandidates) return { ex, weight: 0 };
      if (ex.intensity >= 3) score += 15;
    }

    // Category diversity: penalize same category as previous
    if (prevEx && ex.category === prevEx.category) score -= 40;

    // Pattern diversity: strictly eliminate identical movement patterns if alternatives exist
    if (prevEx) {
      const prevPatterns = prevEx.movementPatterns || [];
      const currPatterns = ex.movementPatterns || [];
      const overlap = prevPatterns.filter((p) => currPatterns.includes(p));
      const isIdentical =
        overlap.length > 0 &&
        overlap.length === currPatterns.length &&
        overlap.length === prevPatterns.length;

      if (isIdentical) {
        if (hasDifferentPatternCandidates) return { ex, weight: 0 };
        score -= 100;
      } else if (overlap.length > 0) {
        score -= 25;
      }
    }

    // Position transition management: STRICT limit of 2 transitions
    if (prevEx && prevLevel) {
      if (prevLevel !== currLevel) {
        if (currentTransitions >= 2) {
          // If we already had 2 transitions, FORBID a 3rd transition if same-level options exist
          if (hasSameLevelCandidates) return { ex, weight: 0 };
          score -= 100;
        } else if (prevLevel === "floor" && currLevel === "standing") {
          // If on the floor during mobility/activation, finish the floor block before standing
          if (phase === "mobility" || phase === "activation") {
            const hasFloorOptions = pool.some(
              (e) => getTransitionLevel(e.positions as Position[]) === "floor"
            );
            if (hasFloorOptions) return { ex, weight: 0 };
          }
          score -= 25;
        } else {
          score -= 20;
        }
      } else {
        score += 35; // reward staying in the same transition level
      }
    }

    // Body area / fatigue balance
    const exAreas = ex.fatigueAreas || ex.primaryBodyAreas || [];
    for (const area of exAreas) {
      const count = areaCounts.get(area) || 0;
      if (count >= 2) {
        score -= count * 40;
      }
    }

    return { ex, weight: Math.max(1, score) };
  });

  const validCandidates = scored.filter((s) => s.weight > 0);
  if (validCandidates.length === 0) {
    // If all weights were 0, fallback to uniform random across pool
    return pool[Math.floor(rng() * pool.length)];
  }

  // Weighted random selection
  const totalWeight = validCandidates.reduce((sum, item) => sum + item.weight, 0);
  let rand = rng() * totalWeight;
  for (const item of validCandidates) {
    if (rand < item.weight) return item.ex;
    rand -= item.weight;
  }
  return validCandidates[validCandidates.length - 1].ex;
}

// ── Timing allocation ───────────────────────────────────────────────────────

function allocateTimings(
  exercises: { exercise: Exercise; phase: SessionPhase }[],
  targetTotalSeconds: number,
  energyScore: number,
  _template: SessionTemplate
): SessionExercise[] {
  const n = exercises.length;
  if (n === 0) return [];

  const totalPrep = 5; // Only 5s initial prep before workout starts

  // 1. Calculate adaptive recovery times between consecutive exercises
  const restTimes = exercises.map(({ exercise: ex, phase }, index) => {
    const next = index + 1 < n ? exercises[index + 1].exercise : null;
    return calculateRecoverySeconds({
      currentExercise: ex,
      nextExercise: next,
      phase,
      energyScore,
      isLastExercise: index === n - 1,
    });
  });

  const totalRest = restTimes.reduce((sum, r) => sum + r, 0);
  const availableForWork = Math.max(n * 20, targetTotalSeconds - totalPrep - totalRest);
  const rawWorkSlot = Math.floor(availableForWork / n);

  let assigned: SessionExercise[] = exercises.map(({ exercise: ex, phase }, index) => {
    let workSec = rawWorkSlot;

    // Small phase adjustments (dynamic gets slightly more, wakeup/finish slightly less if space)
    if (phase === "dynamic") workSec += 2;
    if (phase === "activation") workSec += 1;
    if (phase === "wakeup") workSec -= 1;
    if (phase === "finish") workSec -= 2;

    workSec = Math.max(20, Math.min(workSec, 60));

    return {
      exercise: ex,
      phase,
      targetDurationSeconds: workSec,
      preparationSeconds: index === 0 ? 5 : 0,
      restSeconds: restTimes[index],
    };
  });

  // 2. Fine-tune work times to match exact targetTotalSeconds
  let total = assigned.reduce(
    (sum, se) => sum + se.preparationSeconds + se.targetDurationSeconds + se.restSeconds,
    0
  );
  let diff = targetTotalSeconds - total;
  let idx = 0;
  while (diff !== 0 && Math.abs(diff) > 0) {
    const step = diff > 0 ? 1 : -1;
    const target = assigned[idx % n];
    if (diff > 0 && target.targetDurationSeconds < 65) {
      target.targetDurationSeconds += step;
      diff -= step;
    } else if (diff < 0 && target.targetDurationSeconds > 20) {
      target.targetDurationSeconds += step;
      diff -= step;
    }
    idx++;
    if (idx > n * 15) break;
  }

  // Final trim safeguard
  total = assigned.reduce(
    (sum, se) => sum + se.preparationSeconds + se.targetDurationSeconds + se.restSeconds,
    0
  );
  if (total > targetTotalSeconds + 15) {
    const excess = total - (targetTotalSeconds + 15);
    for (let i = 0; i < n && excess > 0; i++) {
      const reduce = Math.min(excess, Math.max(0, assigned[i].targetDurationSeconds - 20));
      assigned[i].targetDurationSeconds -= reduce;
    }
  }

  return assigned;
}

// ── Exercise replacement ────────────────────────────────────────────────────

export function replaceExerciseInSession(
  session: GeneratedSession,
  exerciseIndex: number,
  options?: { seed?: number; historyExerciseIds?: string[] }
): GeneratedSession {
  if (exerciseIndex < 0 || exerciseIndex >= session.exercises.length) {
    return session;
  }

  const currentSlot = session.exercises[exerciseIndex];
  const currentEx = currentSlot.exercise;
  const currentPhase = currentSlot.phase;
  const currentSessionIds = new Set(session.exercises.map((e) => e.exercise.id));
  const historyIds = new Set(options?.historyExerciseIds || []);
  const rng = createRng(options?.seed || (session.seed + exerciseIndex + 42));

  // Find direct alternatives
  const directAltIds = currentEx.alternativeExerciseIds || [];
  const easierId = currentEx.easierVariantId;
  const harderId = currentEx.harderVariantId;

  const directCandidates: Exercise[] = [];
  for (const id of [...directAltIds, easierId, harderId]) {
    if (!id || currentSessionIds.has(id)) continue;
    const ex = EXERCISES_MAP.get(id);
    if (ex && ex.enabled) {
      if (session.discomfortZone === "upper" && !ex.compatibleWithUpperBodyDiscomfort) continue;
      if (session.discomfortZone === "lower" && !ex.compatibleWithLowerBodyDiscomfort) continue;
      if (session.discomfortZone !== "none" && (ex.jumping || ex.impactLevel === "high")) continue;
      // Must be suitable for the same phase
      if (ex.suitablePhases && ex.suitablePhases.includes(currentPhase)) {
        directCandidates.push(ex);
      }
    }
  }

  // Fallback: all candidates for this phase
  let fallbackCandidates = filterCandidates(EXERCISES, session.energyScore, session.discomfortZone)
    .filter((ex) => !currentSessionIds.has(ex.id))
    .filter((ex) => ex.suitablePhases && ex.suitablePhases.includes(currentPhase));

  const allCandidates = [...directCandidates, ...fallbackCandidates];
  const uniqueMap = new Map<string, Exercise>();
  allCandidates.forEach((c) => uniqueMap.set(c.id, c));
  const uniqueCandidates = Array.from(uniqueMap.values());

  if (uniqueCandidates.length === 0) {
    // Broaden: drop phase requirement
    const broadened = filterCandidates(EXERCISES, session.energyScore, session.discomfortZone)
      .filter((ex) => !currentSessionIds.has(ex.id));
    if (broadened.length === 0) return session;

    const idx = Math.floor(rng() * broadened.length);
    const chosen = broadened[idx];
    const newExercises = [...session.exercises];
    newExercises[exerciseIndex] = {
      ...currentSlot,
      exercise: chosen,
    };
    return { ...session, exercises: newExercises };
  }

  const scored = uniqueCandidates.map((candidate) => {
    let score = 100;
    if (directCandidates.some((d) => d.id === candidate.id)) score += 50;
    if (candidate.category === currentEx.category) score += 30;
    if (Math.abs(candidate.intensity - currentEx.intensity) <= 1) score += 20;
    if (historyIds.has(candidate.id)) score -= 30;
    return { ex: candidate, weight: Math.max(10, score) };
  });

  const totalWeight = scored.reduce((sum, item) => sum + item.weight, 0);
  let rand = rng() * totalWeight;
  let chosenEx = scored[0].ex;
  for (const item of scored) {
    if (rand < item.weight) {
      chosenEx = item.ex;
      break;
    }
    rand -= item.weight;
  }

  const newExercises = [...session.exercises];
  newExercises[exerciseIndex] = {
    ...currentSlot,
    exercise: chosenEx,
  };

  return {
    ...session,
    exercises: newExercises,
  };
}
