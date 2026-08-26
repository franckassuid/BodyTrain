import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSession } from "../src/engine/generator.ts";
import { WorkoutEngine } from "../src/engine/workoutTimer.ts";

describe("Workout Engine & Timer", () => {
  it("should initialize and transition through preparation to work", () => {
    const session = generateSession({ energyScore: 5, discomfortZone: "none", seed: 101 });
    const engine = new WorkoutEngine();

    engine.start(session);
    let snap = engine.getSnapshot();

    assert.equal(snap.state, "preparation");
    assert.equal(snap.phase, "preparation");
    assert.equal(snap.currentExerciseIndex, 0);
    assert.ok(snap.phaseTimeRemainingSeconds > 0);

    // Pause and resume
    engine.pause();
    snap = engine.getSnapshot();
    assert.equal(snap.state, "paused");
    assert.equal(snap.isPaused, true);

    engine.resume();
    snap = engine.getSnapshot();
    assert.equal(snap.state, "preparation");
    assert.equal(snap.isPaused, false);

    // Skip initial preparation to start work immediately
    engine.skip();
    snap = engine.getSnapshot();
    assert.equal(snap.phase, "work");
    assert.equal(snap.currentExerciseIndex, 0);

    // Skip exercise 0 to advance to exercise 1
    engine.skip();
    snap = engine.getSnapshot();
    assert.equal(snap.currentExerciseIndex, 1);
    assert.equal(snap.phase, "work");

    engine.destroy();
  });

  it("should record completed exercise IDs when exercise work phase completes", () => {
    const session = generateSession({ energyScore: 5, discomfortZone: "none", seed: 202 });
    const engine = new WorkoutEngine();

    engine.start(session);
    // Move to work phase
    (engine as unknown as { onPhaseCompleted: () => void }).onPhaseCompleted();

    let snap = engine.getSnapshot();
    assert.equal(snap.phase, "work");

    const firstId = session.exercises[0].exercise.id;
    // Complete work phase
    (engine as unknown as { onPhaseCompleted: () => void }).onPhaseCompleted();

    snap = engine.getSnapshot();
    assert.ok(snap.completedExerciseIds.includes(firstId));

    engine.destroy();
  });
});
