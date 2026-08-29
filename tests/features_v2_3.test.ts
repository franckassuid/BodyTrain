import test from "node:test";
import assert from "node:assert/strict";
import { generateSession } from "../src/engine/generator.ts";
import { convertCustomToGeneratedSession, type CustomWorkout } from "../src/types/customWorkout.ts";
import { EXERCISES } from "../src/data/exercisesData.ts";

test("Generator with extra Warmup & Cooldown stretching add-ons", async (t) => {
  await t.test("should inject extra warmup exercises when warmupExtraMinutes is set", () => {
    const session = generateSession({
      energyScore: 6,
      discomfortZone: "none",
      targetDurationMinutes: 5,
      warmupExtraMinutes: 2,
      cooldownExtraMinutes: 0,
      seed: 12345,
    });

    assert.equal(session.warmupExtraMinutes, 2);
    assert.equal(session.baseDurationMinutes, 5);
    assert.equal(session.targetDurationMinutes, 7);
    assert.ok(session.exercises.length >= 4);
    assert.equal(session.exercises[0].phase, "wakeup");
  });

  await t.test("should inject extra cooldown exercises when cooldownExtraMinutes is set", () => {
    const session = generateSession({
      energyScore: 6,
      discomfortZone: "none",
      targetDurationMinutes: 7,
      warmupExtraMinutes: 0,
      cooldownExtraMinutes: 3,
      seed: 12345,
    });

    assert.equal(session.cooldownExtraMinutes, 3);
    assert.equal(session.baseDurationMinutes, 7);
    assert.equal(session.targetDurationMinutes, 10);
    assert.ok(session.exercises.length >= 5);
    assert.equal(session.exercises[session.exercises.length - 1].phase, "finish");
  });

  await t.test("should support both warmup and cooldown combined", () => {
    const session = generateSession({
      energyScore: 7,
      discomfortZone: "upper",
      targetDurationMinutes: 5,
      warmupExtraMinutes: 2,
      cooldownExtraMinutes: 3,
      seed: 67890,
    });

    assert.equal(session.targetDurationMinutes, 10);
    assert.equal(session.warmupExtraMinutes, 2);
    assert.equal(session.cooldownExtraMinutes, 3);
    assert.ok(session.estimatedTotalSeconds >= 540); // around 9-10 min
  });
});

test("Custom Workout Builder Converter", async (t) => {
  await t.test("should convert CustomWorkout into playable GeneratedSession", () => {
    const ex1 = EXERCISES[0];
    const ex2 = EXERCISES[1];

    const custom: CustomWorkout = {
      id: "cw_123",
      title: "Ma séance test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { exercise: ex1, durationSeconds: 30, restSeconds: 10 },
        { exercise: ex2, durationSeconds: 45, restSeconds: 15 },
      ],
      totalEstimatedSeconds: 90,
    };

    const session = convertCustomToGeneratedSession(custom);
    assert.equal(session.exercises.length, 2);
    assert.equal(session.exercises[0].targetDurationSeconds, 30);
    assert.equal(session.exercises[0].preparationSeconds, 5);
    assert.equal(session.exercises[0].restSeconds, 10);
    assert.equal(session.exercises[1].targetDurationSeconds, 45);
    assert.equal(session.exercises[1].restSeconds, 0); // last rest is 0
    assert.equal(session.intensityLevel, "Sur-mesure");
    assert.equal(session.description, "Ma séance test");
  });
});
