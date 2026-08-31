import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { convertHistoryRecordToGeneratedSession } from "../src/utils/historyReplay.ts";
import type { SessionHistoryRecord } from "../types/history.ts";

describe("History Session Replayer", () => {
  it("should convert a completed SessionHistoryRecord into a fully playable GeneratedSession", () => {
    const mockRecord: SessionHistoryRecord = {
      id: "hist-123456",
      date: new Date().toISOString(),
      energyScore: 7,
      discomfortZone: "none",
      plannedDurationSeconds: 420,
      actualDurationSeconds: 420,
      status: "completed",
      proposedExerciseIds: [
        "respiration-4-6",
        "chat-vache",
        "squat-au-poids-du-corps",
        "gainage-avant-bras",
        "posture-de-l-enfant",
      ],
      completedExerciseIds: [
        "respiration-4-6",
        "chat-vache",
        "squat-au-poids-du-corps",
        "gainage-avant-bras",
        "posture-de-l-enfant",
      ],
    };

    const session = convertHistoryRecordToGeneratedSession(mockRecord);

    assert.ok(session.id.startsWith("replay-hist-123456"));
    assert.equal(session.energyScore, 7);
    assert.equal(session.discomfortZone, "none");
    assert.equal(session.exercises.length, 5);
    assert.equal(session.exercises[0].exercise.id, "respiration-4-6");
    assert.equal(session.exercises[4].exercise.id, "posture-de-l-enfant");
    assert.equal(session.exercises[4].restSeconds, 0); // Last exercise has 0 rest
    assert.ok(session.estimatedTotalSeconds > 200);
  });

  it("should gracefully handle partial sessions or records with slug differences", () => {
    const mockRecord: SessionHistoryRecord = {
      id: "hist-partial-789",
      date: new Date().toISOString(),
      energyScore: 4,
      discomfortZone: "upper",
      plannedDurationSeconds: 300,
      actualDurationSeconds: 180,
      status: "partial",
      proposedExerciseIds: ["chat-vache", "fente-statique", "pont-fessier"],
      completedExerciseIds: ["chat-vache", "fente-statique"],
    };

    const session = convertHistoryRecordToGeneratedSession(mockRecord);
    assert.equal(session.exercises.length, 3);
    assert.equal(session.discomfortZone, "upper");
  });
});
