import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterCandidates,
  generateSession,
  getEnergyProfile,
  replaceExerciseInSession,
} from "../src/engine/generator.ts";
import { EXERCISES } from "../src/data/exercisesData.ts";

describe("Workout Generator Engine", () => {
  it("should map energy scores accurately to tiers and descriptions", () => {
    assert.equal(getEnergyProfile(1).tier, "very_low");
    assert.equal(getEnergyProfile(1).intensityLabel, "Très doux");
    assert.equal(getEnergyProfile(3).tier, "low");
    assert.equal(getEnergyProfile(6).tier, "medium");
    assert.equal(getEnergyProfile(9).tier, "high");
    assert.equal(getEnergyProfile(9).intensityLabel, "Dynamique");
  });

  it("should strictly exclude upper body incompatible exercises when upper body discomfort is declared", () => {
    const candidates = filterCandidates(EXERCISES, 7, "upper");
    assert.ok(candidates.length > 0, "Candidates should not be empty");
    for (const ex of candidates) {
      assert.equal(ex.compatibleWithUpperBodyDiscomfort, true);
      assert.equal(ex.requiresUpperBody, false);
      assert.equal(ex.requiresArmSupport, false);
      assert.equal(ex.jumping, false);
      assert.notEqual(ex.impactLevel, "high");
      assert.ok(ex.intensity <= 3, `Expected intensity <= 3, got ${ex.intensity}`);
    }
  });

  it("should strictly exclude lower body incompatible exercises when lower body discomfort is declared", () => {
    const candidates = filterCandidates(EXERCISES, 7, "lower");
    assert.ok(candidates.length > 0, "Candidates should not be empty");
    for (const ex of candidates) {
      assert.equal(ex.compatibleWithLowerBodyDiscomfort, true);
      assert.equal(ex.requiresLowerBody, false);
      assert.equal(ex.requiresKneeSupport, false);
      assert.equal(ex.jumping, false);
      assert.notEqual(ex.impactLevel, "high");
      assert.ok(ex.intensity <= 3, `Expected intensity <= 3, got ${ex.intensity}`);
    }
  });

  it("should never contain jumping or high impact exercises when discomfort is present", () => {
    const upperSession = generateSession({ energyScore: 8, discomfortZone: "upper", seed: 1234 });
    assert.ok(upperSession.exercises.length >= 3);
    for (const item of upperSession.exercises) {
      assert.equal(item.exercise.jumping, false);
      assert.notEqual(item.exercise.impactLevel, "high");
      assert.equal(item.exercise.compatibleWithUpperBodyDiscomfort, true);
    }

    const lowerSession = generateSession({ energyScore: 8, discomfortZone: "lower", seed: 5678 });
    assert.ok(lowerSession.exercises.length >= 3);
    for (const item of lowerSession.exercises) {
      assert.equal(item.exercise.jumping, false);
      assert.notEqual(item.exercise.impactLevel, "high");
      assert.equal(item.exercise.compatibleWithLowerBodyDiscomfort, true);
    }
  });

  it("should never contain duplicate exercises in the same session", () => {
    for (let score = 0; score <= 10; score += 2) {
      for (const discomfort of ["none", "upper", "lower"] as const) {
        const session = generateSession({
          energyScore: score,
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed: 42 + score,
        });

        const ids = session.exercises.map((e) => e.exercise.id);
        const uniqueIds = new Set(ids);
        assert.equal(uniqueIds.size, ids.length, `Duplicates found in session with energy ${score}, discomfort ${discomfort}`);
      }
    }
  });

  it("should respect target durations (5, 7, 10 min) within +15 seconds limit", () => {
    const durations = [5, 7, 10] as const;
    for (const duration of durations) {
      const maxAllowed = duration * 60 + 15;
      const minAllowed = duration * 60 - 45;

      const session = generateSession({
        energyScore: 6,
        discomfortZone: "none",
        targetDurationMinutes: duration,
        seed: 999 + duration,
      });

      const totalTime = session.exercises.reduce(
        (sum, e) => sum + e.preparationSeconds + e.targetDurationSeconds + e.restSeconds,
        0
      );

      assert.ok(
        totalTime <= maxAllowed,
        `Total duration ${totalTime}s exceeded max allowed ${maxAllowed}s for ${duration}min`
      );
      assert.ok(
        totalTime >= minAllowed,
        `Total duration ${totalTime}s below min allowed ${minAllowed}s for ${duration}min`
      );
    }
  });

  it("should be 100% deterministic given the same seed", () => {
    const session1 = generateSession({ energyScore: 5, discomfortZone: "none", seed: 424242 });
    const session2 = generateSession({ energyScore: 5, discomfortZone: "none", seed: 424242 });

    assert.deepEqual(
      session1.exercises.map((e) => e.exercise.id),
      session2.exercises.map((e) => e.exercise.id)
    );
    assert.equal(session1.estimatedTotalSeconds, session2.estimatedTotalSeconds);
  });

  it("should avoid exercises from the last 3 sessions when alternatives exist", () => {
    const session1 = generateSession({ energyScore: 6, discomfortZone: "none", seed: 100 });
    const recentIds = [session1.exercises.map((e) => e.exercise.id)];

    const session2 = generateSession({
      energyScore: 6,
      discomfortZone: "none",
      recentSessionExerciseIds: recentIds,
      seed: 100,
    });

    const ids1 = new Set(session1.exercises.map((e) => e.exercise.id));
    const overlapCount = session2.exercises.filter((e) => ids1.has(e.exercise.id)).length;
    assert.ok(overlapCount < session1.exercises.length, "Expected recency penalties to reduce overlap");
  });

  it("should replace an exercise with a valid, non-duplicate compatible alternative", () => {
    const session = generateSession({ energyScore: 6, discomfortZone: "upper", seed: 777 });
    const originalEx = session.exercises[1].exercise;

    const modified = replaceExerciseInSession(session, 1, { seed: 888 });
    const newEx = modified.exercises[1].exercise;

    assert.notEqual(newEx.id, originalEx.id);
    assert.equal(newEx.compatibleWithUpperBodyDiscomfort, true);
    assert.equal(newEx.jumping, false);

    const ids = modified.exercises.map((e) => e.exercise.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("should safely generate sessions for very low energy (0-2)", () => {
    const session = generateSession({ energyScore: 0, discomfortZone: "none", seed: 12 });
    assert.equal(session.intensityLevel, "Très doux");
    for (const item of session.exercises) {
      assert.ok(item.exercise.intensity <= 2);
      assert.equal(item.exercise.minimumEnergy, "very_low");
    }
  });
});
