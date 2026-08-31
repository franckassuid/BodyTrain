import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPositionTransitionInfo,
  getExercisePositionDetails,
} from "../src/utils/positionTransition.ts";
import { EXERCISES, EXERCISES_MAP } from "../src/data/exercisesData.ts";

describe("Position Transition & Preparation Detector", () => {
  it("should accurately classify all 87 exercises into valid position groups", () => {
    assert.equal(EXERCISES.length, 87);
    for (const ex of EXERCISES) {
      const details = getExercisePositionDetails(ex);
      assert.ok(details.group, `Exercise ${ex.id} missing group`);
      assert.ok(details.categoryName, `Exercise ${ex.id} missing categoryName`);
      assert.ok(details.setupInstruction, `Exercise ${ex.id} missing setupInstruction`);
      assert.equal(typeof details.isFloor, "boolean");
    }
  });

  it("should detect floor to standing transition", () => {
    const floorEx = EXERCISES_MAP["chat-vache"];
    const standingEx = EXERCISES_MAP["squat-au-poids-du-corps"];

    const transition = getPositionTransitionInfo(floorEx, standingEx);
    assert.equal(transition.type, "floor_to_standing");
    assert.ok(transition.badgeLabel.includes("Relevez-vous"));
    assert.ok(transition.speechPrompt.includes("Relevez-vous"));
  });

  it("should detect standing to floor transition", () => {
    const standingEx = EXERCISES_MAP["squat-au-poids-du-corps"];
    const floorEx = EXERCISES_MAP["gainage-avant-bras"];

    const transition = getPositionTransitionInfo(standingEx, floorEx);
    assert.equal(transition.type, "standing_to_floor");
    assert.ok(transition.badgeLabel.includes("sol"));
    assert.ok(transition.speechPrompt.includes("sol"));
  });

  it("should detect wall standing requirements", () => {
    const standingEx = EXERCISES_MAP["squat-au-poids-du-corps"];
    const wallEx = EXERCISES_MAP["pompes-contre-un-mur"];

    const transition = getPositionTransitionInfo(standingEx, wallEx);
    assert.equal(transition.type, "wall_standing");
    assert.ok(transition.badgeLabel.includes("mur"));
    assert.ok(transition.instruction.includes("mur"));
  });

  it("should detect stay on floor when both exercises are floor based", () => {
    const floor1 = EXERCISES_MAP["chat-vache"];
    const floor2 = EXERCISES_MAP["pont-fessier"];

    const transition = getPositionTransitionInfo(floor1, floor2);
    assert.equal(transition.type, "stay_floor");
    assert.ok(transition.badgeLabel.includes("sol"));
    assert.ok(transition.instruction.includes("dos"));
  });

  it("should detect stay standing when both exercises are standing", () => {
    const stand1 = EXERCISES_MAP["squat-au-poids-du-corps"];
    const stand2 = EXERCISES_MAP["fente-statique"];

    const transition = getPositionTransitionInfo(stand1, stand2);
    assert.equal(transition.type, "stay_standing");
    assert.ok(transition.badgeLabel.includes("debout"));
  });

  it("should detect transition to seated exercise", () => {
    const stand = EXERCISES_MAP["squat-au-poids-du-corps"];
    const seated = EXERCISES_MAP["chat-vache-assis"];

    const transition = getPositionTransitionInfo(stand, seated);
    assert.equal(transition.type, "seated");
    assert.ok(transition.badgeLabel.includes("assise"));
  });
});
