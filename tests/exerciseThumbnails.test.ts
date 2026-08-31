import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EXERCISES } from "../src/data/exercisesData.ts";

describe("87 Exercises GIF & Thumbnail Verification", () => {
  it("should have exactly 87 curated exercises in EXERCISES", () => {
    assert.equal(EXERCISES.length, 87, `Expected 87 exercises, found ${EXERCISES.length}`);
  });

  it("every exercise must have a valid non-empty nameFr, category and instructionsFr", () => {
    for (const ex of EXERCISES) {
      assert.ok(ex.id && ex.id.length > 0, `Exercise missing id: ${JSON.stringify(ex)}`);
      assert.ok(ex.nameFr && ex.nameFr.length > 0, `Exercise ${ex.id} missing nameFr`);
      assert.ok(ex.category && ex.category.length > 0, `Exercise ${ex.id} missing category`);
      assert.ok(ex.instructionsFr && ex.instructionsFr.length > 0, `Exercise ${ex.id} missing instructionsFr`);
    }
  });

  it("every exercise must have a matching GIF file existing on disk in public/animations/", () => {
    const animationsDir = path.resolve("public/animations");
    const missingFiles: string[] = [];

    for (const ex of EXERCISES) {
      const slug = ex.slug || ex.id;
      const expectedFileName = `${slug}.gif`;
      const filePath = path.join(animationsDir, expectedFileName);

      if (!fs.existsSync(filePath)) {
        missingFiles.push(expectedFileName);
      } else {
        const stats = fs.statSync(filePath);
        assert.ok(stats.size > 100, `File ${expectedFileName} is too small (${stats.size} bytes)`);
      }
    }

    assert.equal(
      missingFiles.length,
      0,
      `Missing GIF animation files in public/animations: ${missingFiles.join(", ")}`
    );
  });

  it("every exercise media array must point to /animations/${slug}.gif", () => {
    for (const ex of EXERCISES) {
      const slug = ex.slug || ex.id;
      const expectedPath = `/animations/${slug}.gif`;
      assert.ok(ex.media && ex.media.length > 0, `Exercise ${ex.id} has no media`);
      const animMedia = ex.media.find((m) => m.type === "animation" || m.format === "gif");
      assert.ok(animMedia, `Exercise ${ex.id} has no animation/gif media item`);
      assert.equal(
        animMedia?.localPath,
        expectedPath,
        `Exercise ${ex.id} media localPath mismatch: expected ${expectedPath}, got ${animMedia?.localPath}`
      );
    }
  });
});
