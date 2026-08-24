import { EXERCISES, EXERCISES_MAP } from "../data/exercisesData.ts";
import type { DiscomfortZone } from "../types/enums.ts";
import type { Exercise } from "../types/exercise.ts";
import type { GeneratedSession, SessionExercise, SessionPhase } from "../types/session.ts";

export interface GeneratorOptions {
  energyScore: number; // 0 to 10
  discomfortZone: DiscomfortZone;
  targetDurationMinutes?: number; // 5, 7 (default), or 10
  recentSessionExerciseIds?: string[][]; // Last sessions arrays of exercise IDs
  seed?: number;
}

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

/** Maps 0-10 user energy score to energy categories and descriptions */
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

/** Check if position is on the floor */
export function isFloorPosition(positions: string[]): boolean {
  return positions.some(
    (p) => p.startsWith("lying_") || p === "all_fours" || p === "kneeling" || p === "plank"
  );
}

/**
 * Filter exercises strictly matching the constraints.
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

/** Fallback safe library for extreme edge cases */
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

/**
 * Generate a complete, balanced morning session.
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

  let candidates = filterCandidates(EXERCISES, energyScore, discomfortZone);

  // If too few candidates exist under strict constraints, augment with safe fallbacks
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

  // Penalty set for recently practiced exercises
  const recencyPenalty = new Map<string, number>();
  const recentWeight = [60, 40, 20];
  recentSessionExerciseIds.slice(0, 3).forEach((sessionIds, idx) => {
    const penalty = recentWeight[idx] || 15;
    for (const id of sessionIds) {
      recencyPenalty.set(id, (recencyPenalty.get(id) || 0) + penalty);
    }
  });

  // Target exercise count based on duration
  let targetCount = targetDurationMinutes === 5 ? 4 : targetDurationMinutes === 10 ? 8 : 6;
  if (candidates.length < targetCount) {
    targetCount = Math.max(3, candidates.length);
  }

  // Categorize for phases in v2 taxonomy
  const isWarmupCategory = (c: string) =>
    c === "breathing" ||
    c === "gentle_wakeup" ||
    c === "neck_mobility" ||
    c === "shoulder_mobility" ||
    c === "spine_mobility" ||
    c === "hip_mobility" ||
    c === "knee_mobility" ||
    c === "ankle_mobility" ||
    c === "gentle_cardio";

  const isCooldownCategory = (c: string) =>
    c === "cooldown" || c === "light_stretching" || c === "breathing";

  const warmupCandidates = candidates.filter((e) => e.suitableForWarmup || isWarmupCategory(e.category));
  const cooldownCandidates = candidates.filter((e) => e.suitableForCooldown || isCooldownCategory(e.category));
  const mainCandidates = candidates;

  const chosenExercises: Exercise[] = [];
  const chosenIds = new Set<string>();

  function pickCandidate(pool: Exercise[], phase: SessionPhase, prevEx?: Exercise): Exercise | null {
    const available = pool.filter((e) => !chosenIds.has(e.id));
    if (available.length === 0) return null;

    const scored = available.map((ex) => {
      let score = 100;
      const penalty = recencyPenalty.get(ex.id) || 0;
      score -= penalty;

      if (phase === "warmup" && ex.suitableForWarmup) score += 30;
      if (phase === "cooldown" && ex.suitableForCooldown) score += 30;
      if (profile.preferGentle && ex.suitableForGentleSession) score += 25;

      if (prevEx && ex.category === prevEx.category) score -= 40;

      if (prevEx) {
        const prevIsFloor = isFloorPosition(prevEx.positions);
        const currIsFloor = isFloorPosition(ex.positions);
        if (prevIsFloor !== currIsFloor) {
          score -= 10;
        }
      }

      return { ex, weight: Math.max(5, score) };
    });

    const totalWeight = scored.reduce((sum, item) => sum + item.weight, 0);
    let rand = rng() * totalWeight;
    for (const item of scored) {
      if (rand < item.weight) return item.ex;
      rand -= item.weight;
    }
    return scored[scored.length - 1].ex;
  }

  // 1. Warmup
  const warmup = pickCandidate(warmupCandidates.length > 0 ? warmupCandidates : candidates, "warmup");
  if (warmup) {
    chosenExercises.push(warmup);
    chosenIds.add(warmup.id);
  }

  // 2. Main exercises
  const numMain = Math.max(1, targetCount - 2);
  for (let i = 0; i < numMain; i++) {
    const prev = chosenExercises[chosenExercises.length - 1];
    const next = pickCandidate(mainCandidates, "main", prev);
    if (next) {
      chosenExercises.push(next);
      chosenIds.add(next.id);
    }
  }

  // 3. Cooldown
  const prevBeforeCooldown = chosenExercises[chosenExercises.length - 1];
  const cooldown = pickCandidate(
    cooldownCandidates.length > 0 ? cooldownCandidates : candidates,
    "cooldown",
    prevBeforeCooldown
  );
  if (cooldown && !chosenIds.has(cooldown.id)) {
    chosenExercises.push(cooldown);
    chosenIds.add(cooldown.id);
  } else if (chosenExercises.length < 3 && candidates.length > chosenExercises.length) {
    const extra = pickCandidate(candidates, "cooldown", prevBeforeCooldown);
    if (extra) {
      chosenExercises.push(extra);
      chosenIds.add(extra.id);
    }
  }

  optimizePositionFlow(chosenExercises);

  const sessionExercises = allocateTimings(chosenExercises, targetTotalSeconds, energyScore);

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
    exercises: sessionExercises,
    seed,
  };
}

function optimizePositionFlow(exercises: Exercise[]) {
  if (exercises.length <= 2) return;

  const middle = exercises.slice(1, exercises.length - 1);
  middle.sort((a, b) => {
    const aFloor = isFloorPosition(a.positions) ? 1 : 0;
    const bFloor = isFloorPosition(b.positions) ? 1 : 0;
    return aFloor - bFloor;
  });

  exercises.splice(1, exercises.length - 2, ...middle);
}

function allocateTimings(
  exercises: Exercise[],
  targetTotalSeconds: number,
  energyScore: number
): SessionExercise[] {
  const n = exercises.length;
  if (n === 0) return [];

  const prepPerExercise = 5;
  const totalPrep = n * prepPerExercise;
  const availableForWorkAndRest = Math.max(60, targetTotalSeconds - totalPrep);

  const rawSlot = availableForWorkAndRest / n;
  const restRatio = energyScore <= 3 ? 0.25 : energyScore <= 6 ? 0.2 : 0.15;

  let assigned: SessionExercise[] = exercises.map((ex, index) => {
    const phase: SessionPhase = index === 0 ? "warmup" : index === n - 1 ? "cooldown" : "main";

    let workSec = Math.round(rawSlot * (1 - restRatio));
    let restSec = Math.round(rawSlot * restRatio);

    workSec = Math.max(25, Math.min(workSec, 60));
    restSec = Math.max(5, Math.min(restSec, 20));

    const targetReps = ex.mode === "repetitions" ? ex.defaultRepetitions || 10 : undefined;

    return {
      exercise: ex,
      phase,
      targetDurationSeconds: workSec,
      targetRepetitions: targetReps,
      preparationSeconds: prepPerExercise,
      restSeconds: index === n - 1 ? 0 : restSec,
    };
  });

  let total = assigned.reduce((sum, se) => sum + se.preparationSeconds + se.targetDurationSeconds + se.restSeconds, 0);
  let diff = targetTotalSeconds - total;
  let idx = 0;
  while (diff !== 0 && Math.abs(diff) > 0) {
    const step = diff > 0 ? 1 : -1;
    const target = assigned[idx % n];
    if (diff > 0 && target.targetDurationSeconds < 65) {
      target.targetDurationSeconds += step;
      diff -= step;
    } else if (diff < 0 && target.targetDurationSeconds > 25) {
      target.targetDurationSeconds += step;
      diff -= step;
    }
    idx++;
    if (idx > n * 10) break;
  }

  total = assigned.reduce((sum, se) => sum + se.preparationSeconds + se.targetDurationSeconds + se.restSeconds, 0);
  if (total > targetTotalSeconds + 15) {
    const excess = total - (targetTotalSeconds + 15);
    for (let i = 0; i < n && excess > 0; i++) {
      const reduce = Math.min(excess, Math.max(0, assigned[i].targetDurationSeconds - 25));
      assigned[i].targetDurationSeconds -= reduce;
    }
  }

  return assigned;
}

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
  const currentSessionIds = new Set(session.exercises.map((e) => e.exercise.id));
  const historyIds = new Set(options?.historyExerciseIds || []);
  const rng = createRng(options?.seed || (session.seed + exerciseIndex + 42));

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
      directCandidates.push(ex);
    }
  }

  let fallbackCandidates = filterCandidates(EXERCISES, session.energyScore, session.discomfortZone).filter(
    (ex) => !currentSessionIds.has(ex.id)
  );

  const allCandidates = [...directCandidates, ...fallbackCandidates];
  const uniqueMap = new Map<string, Exercise>();
  allCandidates.forEach((c) => uniqueMap.set(c.id, c));
  const uniqueCandidates = Array.from(uniqueMap.values());

  if (uniqueCandidates.length === 0) {
    return session;
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
    targetRepetitions: chosenEx.mode === "repetitions" ? chosenEx.defaultRepetitions || 10 : undefined,
  };

  return {
    ...session,
    exercises: newExercises,
  };
}
