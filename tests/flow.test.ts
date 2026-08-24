import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSession, replaceExerciseInSession } from "../src/engine/generator.ts";
import { WorkoutEngine } from "../src/engine/workoutTimer.ts";
import type { SessionHistoryRecord } from "../src/types/history.ts";

describe("End-to-End Morning Workout Flow", () => {
  it("completes full lifecycle: check-in -> generate -> start -> work -> rest -> replace -> finish -> history record", () => {
    // 1. Check-in answers
    const userEnergyScore = 6;
    const userDiscomfortZone = "none" as const;
    const selectedDurationMinutes = 7;

    // 2. Generate session
    const session = generateSession({
      energyScore: userEnergyScore,
      discomfortZone: userDiscomfortZone,
      targetDurationMinutes: selectedDurationMinutes,
      seed: 555,
    });

    assert.ok(session.exercises.length >= 4);
    assert.equal(session.energyScore, 6);
    assert.equal(session.discomfortZone, "none");

    // 3. Start workout engine
    const engine = new WorkoutEngine();
    engine.start(session);

    let snap = engine.getSnapshot();
    assert.equal(snap.phase, "preparation");
    assert.equal(snap.currentExerciseIndex, 0);

    // 4. Progress to work phase
    (engine as unknown as { onPhaseCompleted: () => void }).onPhaseCompleted();
    snap = engine.getSnapshot();
    assert.equal(snap.phase, "work");

    // 5. Progress to rest phase
    (engine as unknown as { onPhaseCompleted: () => void }).onPhaseCompleted();
    snap = engine.getSnapshot();
    assert.equal(snap.phase, "rest");
    assert.ok(snap.completedExerciseIds.length === 1);

    // 6. Replace upcoming exercise
    const updatedSession = replaceExerciseInSession(session, 1, { seed: 999 });
    engine.updateSession(updatedSession);
    assert.notEqual(
      updatedSession.exercises[1].exercise.id,
      session.exercises[1].exercise.id
    );

    // 7. Complete all exercises
    while (snap.phase !== "finished") {
      (engine as unknown as { onPhaseCompleted: () => void }).onPhaseCompleted();
      snap = engine.getSnapshot();
    }

    assert.equal(snap.state, "completed");
    assert.equal(snap.phase, "finished");

    // 8. Generate History Record
    const historyRecord: SessionHistoryRecord = {
      id: session.id,
      date: new Date().toISOString(),
      energyScore: userEnergyScore,
      discomfortZone: userDiscomfortZone,
      plannedDurationSeconds: session.estimatedTotalSeconds,
      actualDurationSeconds: snap.totalElapsedSeconds || session.estimatedTotalSeconds,
      status: "completed",
      proposedExerciseIds: session.exercises.map((e) => e.exercise.id),
      completedExerciseIds: snap.completedExerciseIds,
    };

    assert.equal(historyRecord.status, "completed");
    assert.ok(historyRecord.completedExerciseIds.length > 0);
    assert.ok(historyRecord.proposedExerciseIds.length > 0);

    engine.destroy();
  });
});
