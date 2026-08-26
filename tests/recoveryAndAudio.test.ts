import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRecoverySeconds } from "../src/engine/recoveryCalculator.ts";
import { generateSession } from "../src/engine/generator.ts";
import { EXERCISES } from "../src/data/exercisesData.ts";
import { voiceCoach } from "../src/services/voiceCoach.ts";

describe("Adaptive Recovery Calculator & Audio Coach", () => {
  const standingGentle = EXERCISES.find((e) => e.positions.includes("standing") && e.intensity === 1)!;
  const standingIntense = EXERCISES.find((e) => e.positions.includes("standing") && e.intensity === 5)!;
  const floorModerate = EXERCISES.find((e) => e.positions.includes("lying_back") && e.intensity === 3)!;

  it("should always return 0 seconds recovery for the last exercise of a workout", () => {
    const rest = calculateRecoverySeconds({
      currentExercise: standingIntense,
      nextExercise: null,
      phase: "finish",
      energyScore: 8,
      isLastExercise: true,
    });
    assert.equal(rest, 0);
  });

  it("should strictly enforce a minimum recovery of 10 seconds for all intermediate exercises", () => {
    const rest = calculateRecoverySeconds({
      currentExercise: standingGentle,
      nextExercise: standingGentle,
      phase: "finish",
      energyScore: 10,
      isLastExercise: false,
    });
    assert.ok(rest >= 10, `Expected rest >= 10s, got ${rest}s`);
  });

  it("should allocate more recovery for low energy than high energy", () => {
    const restLowEnergy = calculateRecoverySeconds({
      currentExercise: floorModerate,
      nextExercise: floorModerate,
      phase: "activation",
      energyScore: 2,
      isLastExercise: false,
    });

    const restHighEnergy = calculateRecoverySeconds({
      currentExercise: floorModerate,
      nextExercise: floorModerate,
      phase: "activation",
      energyScore: 9,
      isLastExercise: false,
    });

    assert.ok(
      restLowEnergy > restHighEnergy,
      `Expected low energy rest (${restLowEnergy}s) > high energy rest (${restHighEnergy}s)`
    );
  });

  it("should allocate more recovery for intense exercises than gentle exercises", () => {
    const restIntense = calculateRecoverySeconds({
      currentExercise: standingIntense,
      nextExercise: standingGentle,
      phase: "dynamic",
      energyScore: 7,
      isLastExercise: false,
    });

    const restGentle = calculateRecoverySeconds({
      currentExercise: standingGentle,
      nextExercise: standingGentle,
      phase: "dynamic",
      energyScore: 7,
      isLastExercise: false,
    });

    assert.ok(
      restIntense > restGentle,
      `Expected intense rest (${restIntense}s) > gentle rest (${restGentle}s)`
    );
  });

  it("should add transition bonus (+4s) when changing between Floor and Standing", () => {
    const restWithTransition = calculateRecoverySeconds({
      currentExercise: standingGentle,
      nextExercise: floorModerate, // standing -> floor
      phase: "mobility",
      energyScore: 5,
      isLastExercise: false,
    });

    const restWithoutTransition = calculateRecoverySeconds({
      currentExercise: standingGentle,
      nextExercise: standingGentle, // standing -> standing
      phase: "mobility",
      energyScore: 5,
      isLastExercise: false,
    });

    assert.ok(
      restWithTransition >= restWithoutTransition + 3,
      `Expected transition bonus in rest time: with=${restWithTransition}s, without=${restWithoutTransition}s`
    );
  });

  it("should generate 100% timed sessions where all intermediate rest times are >= 10s and final rest is 0s", () => {
    for (let energy = 0; energy <= 10; energy += 2) {
      for (const duration of [5, 7, 10] as const) {
        for (const discomfort of ["none", "upper", "lower"] as const) {
          const session = generateSession({
            energyScore: energy,
            discomfortZone: discomfort,
            targetDurationMinutes: duration,
            seed: 55000 + energy * 10 + duration,
          });

          const n = session.exercises.length;
          assert.ok(n >= 3);

          session.exercises.forEach((ex, idx) => {
            // All exercises are timed (duration >= 20s)
            assert.ok(
              ex.targetDurationSeconds >= 20,
              `Exercise ${idx + 1} duration ${ex.targetDurationSeconds}s should be >= 20s`
            );

            // Rest times
            if (idx === n - 1) {
              assert.equal(
                ex.restSeconds,
                0,
                `Final exercise should have 0s rest, got ${ex.restSeconds}s`
              );
            } else {
              assert.ok(
                ex.restSeconds >= 10,
                `Intermediate exercise ${idx + 1} should have >= 10s rest, got ${ex.restSeconds}s`
              );
            }
          });
        }
      }
    }
  });

  it("should support voice coach settings customization and persistence", () => {
    const initial = voiceCoach.getSettings();
    assert.ok(typeof initial.voiceCoachEnabled === "boolean");

    voiceCoach.saveSettings({ announceCountdown5s: false });
    assert.equal(voiceCoach.getSettings().announceCountdown5s, false);

    voiceCoach.saveSettings({ announceCountdown5s: true });
    assert.equal(voiceCoach.getSettings().announceCountdown5s, true);
  });
});
