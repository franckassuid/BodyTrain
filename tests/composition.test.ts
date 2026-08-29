import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/data/exercisesData.ts";
import {
  generateSession,
  filterCandidates,
  getEnergyProfile,
} from "../src/engine/generator.ts";
import {
  SESSION_TEMPLATES,
  selectTemplate,
} from "../src/engine/sessionTemplates.ts";
import {
  validateFullSession,
  validatePhaseOrder,
  validateNoIntenseStart,
  validateProgressiveEnd,
  validateNoDuplicates,
  validateNoConsecutiveSamePattern,
  validateFloorGrouping,
  validateDiscomfortCompliance,
  validateDuration,
  validateIntensityCurve,
} from "../src/engine/sessionValidation.ts";
import { SESSION_PHASES, getTransitionLevel } from "../src/types/enums.ts";

describe("Workout Composition Engine (5-Phase Normalization)", () => {
  // 1. Library phase coverage
  it("should have active exercises available for all 5 normalized phases", () => {
    const active = EXERCISES.filter((e) => e.enabled);
    for (const phase of SESSION_PHASES) {
      const count = active.filter((e) => e.suitablePhases.includes(phase)).length;
      assert.ok(
        count >= 10,
        `Phase "${phase}" should have at least 10 exercises, found ${count}`
      );
    }
  });

  // 2. Templates constructibility
  it("should successfully construct sessions for all 12 templates across all 3 discomfort conditions", () => {
    const discomforts = ["none", "upper", "lower"] as const;
    const durations = [5, 7, 10] as const;
    const energyScores = [1, 3, 6, 9];

    for (const duration of durations) {
      for (const energy of energyScores) {
        for (const discomfort of discomforts) {
          const session = generateSession({
            energyScore: energy,
            discomfortZone: discomfort,
            targetDurationMinutes: duration,
            seed: 42 + duration * 100 + energy * 10,
          });

          assert.ok(
            session.exercises.length >= 3,
            `Template ${duration}min, energy ${energy}, discomfort ${discomfort} produced too few exercises`
          );
          assert.equal(session.discomfortZone, discomfort);
          assert.equal(session.targetDurationMinutes, duration);
        }
      }
    }
  });

  // 3. Strict phase progression order
  it("should strictly respect the phase order (wakeup -> mobility -> activation -> dynamic -> finish)", () => {
    const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 909];
    for (const seed of seeds) {
      for (const discomfort of ["none", "upper", "lower"] as const) {
        const session = generateSession({
          energyScore: 7,
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed,
        });

        const result = validatePhaseOrder(session.exercises);
        assert.equal(
          result.passed,
          true,
          `Phase order violation with seed ${seed}, discomfort ${discomfort}: ${result.details?.join("; ")}`
        );
      }
    }
  });

  // 4. No intense start (intensity <= 2)
  it("should never start with an intense exercise (intensity <= 2 on position 1)", () => {
    for (let energy = 0; energy <= 10; energy += 2) {
      for (const discomfort of ["none", "upper", "lower"] as const) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed: 1000 + energy,
        });

        const result = validateNoIntenseStart(session.exercises);
        assert.equal(
          result.passed,
          true,
          `First exercise too intense for energy ${energy}, discomfort ${discomfort}: ${result.message}`
        );
      }
    }
  });

  // 5. Calming progressive end (intensity <= 2, finish phase)
  it("should always end with a calming exercise in finish phase (intensity <= 2)", () => {
    for (let energy = 0; energy <= 10; energy += 2) {
      for (const discomfort of ["none", "upper", "lower"] as const) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed: 2000 + energy,
        });

        const result = validateProgressiveEnd(session.exercises);
        assert.equal(
          result.passed,
          true,
          `Session end not progressive for energy ${energy}, discomfort ${discomfort}: ${result.details?.join("; ")}`
        );
      }
    }
  });

  // 6. No duplicate exercises
  it("should never contain duplicate exercises in the same session", () => {
    for (let energy = 0; energy <= 10; energy += 1) {
      for (const duration of [5, 7, 10] as const) {
        for (const discomfort of ["none", "upper", "lower"] as const) {
          const session = generateSession({
            energyScore: energy,
            discomfortZone: discomfort,
            targetDurationMinutes: duration,
            seed: 3000 + energy * 10 + duration,
          });

          const result = validateNoDuplicates(session.exercises);
          assert.equal(
            result.passed,
            true,
            `Duplicates found: ${result.details?.join(", ")}`
          );
        }
      }
    }
  });

  // 7. No consecutive identical movement patterns
  it("should not place exercises with identical movement patterns consecutively", () => {
    for (let energy = 1; energy <= 9; energy += 2) {
      for (const discomfort of ["none", "upper", "lower"] as const) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed: 4000 + energy,
        });

        const result = validateNoConsecutiveSamePattern(session.exercises);
        assert.equal(
          result.passed,
          true,
          `Consecutive pattern violation for energy ${energy}, discomfort ${discomfort}: ${result.details?.join("; ")}`
        );
      }
    }
  });

  // 8. Strict discomfort compliance
  it("should strictly respect upper body discomfort constraints", () => {
    for (let energy = 0; energy <= 10; energy += 2) {
      const session = generateSession({
        energyScore: energy,
        discomfortZone: "upper",
        targetDurationMinutes: 7,
        seed: 5000 + energy,
      });

      const result = validateDiscomfortCompliance(session.exercises, "upper");
      assert.equal(
        result.passed,
        true,
        `Upper discomfort violation: ${result.details?.join("; ")}`
      );
    }
  });

  it("should strictly respect lower body discomfort constraints", () => {
    for (let energy = 0; energy <= 10; energy += 2) {
      const session = generateSession({
        energyScore: energy,
        discomfortZone: "lower",
        targetDurationMinutes: 7,
        seed: 6000 + energy,
      });

      const result = validateDiscomfortCompliance(session.exercises, "lower");
      assert.equal(
        result.passed,
        true,
        `Lower discomfort violation: ${result.details?.join("; ")}`
      );
    }
  });

  // 9. No jumping / high impact with discomfort
  it("should never contain jumping or high impact exercises when discomfort is present", () => {
    for (const discomfort of ["upper", "lower"] as const) {
      for (let s = 1; s <= 10; s++) {
        const session = generateSession({
          energyScore: 9, // high energy
          discomfortZone: discomfort,
          targetDurationMinutes: 7,
          seed: 7000 + s,
        });

        for (const se of session.exercises) {
          assert.equal(se.exercise.jumping, false);
          assert.notEqual(se.exercise.impactLevel, "high");
          assert.notEqual(se.exercise.impactLevel, "medium");
          assert.ok(se.exercise.intensity <= 3);
        }
      }
    }
  });

  // 10. Floor grouping: max 2 transitions
  it("should limit floor/standing transitions to at most 2 per session", () => {
    for (let energy = 1; energy <= 9; energy += 2) {
      for (const duration of [5, 7, 10] as const) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: "none",
          targetDurationMinutes: duration,
          seed: 8000 + energy * 10 + duration,
        });

        const result = validateFloorGrouping(session.exercises);
        assert.equal(
          result.passed,
          true,
          `Floor transitions exceeded for ${duration}min, energy ${energy}: ${result.details?.join("; ")}`
        );
      }
    }
  });

  // 11. Duration bounds [-45s, +15s]
  it("should adhere to target duration bounds (-45s to +15s)", () => {
    for (const duration of [5, 7, 10] as const) {
      for (let energy = 1; energy <= 10; energy += 3) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: "none",
          targetDurationMinutes: duration,
          seed: 9000 + duration * 10 + energy,
        });

        const result = validateDuration(session.exercises, duration);
        assert.equal(
          result.passed,
          true,
          `Duration out of bounds for ${duration}min (energy ${energy}): ${result.message}`
        );
      }
    }
  });

  // 12. Full session validation across random seeds
  it("should pass full session validation suite across standard daily check-in scenarios", () => {
    const scenarios = [
      { energy: 1, discomfort: "none" as const, duration: 5 },
      { energy: 2, discomfort: "lower" as const, duration: 5 },
      { energy: 3, discomfort: "upper" as const, duration: 7 },
      { energy: 5, discomfort: "none" as const, duration: 7 },
      { energy: 6, discomfort: "none" as const, duration: 7 },
      { energy: 7, discomfort: "upper" as const, duration: 7 },
      { energy: 8, discomfort: "none" as const, duration: 10 },
      { energy: 9, discomfort: "lower" as const, duration: 10 },
      { energy: 10, discomfort: "none" as const, duration: 10 },
    ];

    for (const sc of scenarios) {
      const session = generateSession({
        energyScore: sc.energy,
        discomfortZone: sc.discomfort,
        targetDurationMinutes: sc.duration,
        seed: 123456 + sc.energy * 100,
      });

      const validationResults = validateFullSession(session);
      const failures = validationResults.filter((r) => !r.passed);

      assert.equal(
        failures.length,
        0,
        `Session failed rules for scenario ${JSON.stringify(sc)}: ${failures.map((f) => f.rule + ": " + f.message).join(", ")}`
      );
    }
  });

  // 13. Determinism
  it("should be 100% deterministic given the same seed", () => {
    const session1 = generateSession({
      energyScore: 6,
      discomfortZone: "none",
      targetDurationMinutes: 7,
      seed: 888888,
    });
    const session2 = generateSession({
      energyScore: 6,
      discomfortZone: "none",
      targetDurationMinutes: 7,
      seed: 888888,
    });

    assert.deepEqual(
      session1.exercises.map((e) => ({ id: e.exercise.id, phase: e.phase, sec: e.targetDurationSeconds })),
      session2.exercises.map((e) => ({ id: e.exercise.id, phase: e.phase, sec: e.targetDurationSeconds }))
    );
    assert.equal(session1.estimatedTotalSeconds, session2.estimatedTotalSeconds);
  });
});
