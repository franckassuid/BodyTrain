import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/data/exercisesData.ts";
import { searchAndRankExercises, normalizeSearchString } from "../src/utils/exerciseSearch.ts";

describe("Anatomical & Fuzzy Exercise Search", () => {
  it("should normalize accents, hyphens and whitespace", () => {
    assert.equal(normalizeSearchString("Épaules-Dos  "), "epaules dos");
    assert.equal(normalizeSearchString("Étirement des trapèzes"), "etirement des trapezes");
  });

  it("should find core & abdominal exercises when searching 'abdos' or 'abdo'", () => {
    const results = searchAndRankExercises(EXERCISES, "abdos");
    assert.ok(results.length > 0);
    const topNames = results.slice(0, 5).map((e) => e.slug);
    assert.ok(
      topNames.some((slug) =>
        ["dead-bug", "crunch-court", "gainage-avant-bras", "gainage-genoux-au-sol", "ramene-de-genoux-allonge"].includes(slug)
      ),
      `Expected top ab exercises in top 5, found: ${topNames.join(", ")}`
    );
  });

  it("should find glute exercises when searching 'fessiers' or 'fesses'", () => {
    const results = searchAndRankExercises(EXERCISES, "fessiers");
    assert.ok(results.length > 0);
    assert.equal(results[0].slug, "pont-fessier");
  });

  it("should find thigh/leg exercises when searching 'cuisses' or 'quadriceps'", () => {
    const results = searchAndRankExercises(EXERCISES, "cuisses");
    assert.ok(results.length > 0);
    const topNames = results.slice(0, 5).map((e) => e.slug);
    assert.ok(topNames.includes("squat-au-poids-du-corps") || topNames.includes("squat-partiel"));
  });

  it("should find back & spine exercises when searching 'dos' or 'lombaires'", () => {
    const results = searchAndRankExercises(EXERCISES, "lombaires");
    assert.ok(results.length > 0);
    const topNames = results.slice(0, 5).map((e) => e.slug);
    assert.ok(topNames.includes("chat-vache") || topNames.includes("extension-dorsale-au-sol"));
  });

  it("should find shoulder & arm exercises when searching 'épaules' or 'bras'", () => {
    const results = searchAndRankExercises(EXERCISES, "épaules");
    assert.ok(results.length > 0);
    assert.equal(results[0].slug, "cercles-des-epaules");
  });

  it("should find wrist exercises when searching 'poignets'", () => {
    const results = searchAndRankExercises(EXERCISES, "poignets");
    assert.ok(results.length > 0);
    assert.equal(results[0].slug, "mobilite-complete-des-poignets");
  });

  it("should find neck exercises when searching 'nuque' or 'cou'", () => {
    const results = searchAndRankExercises(EXERCISES, "nuque");
    assert.ok(results.length > 0);
    const topNames = results.slice(0, 3).map((e) => e.slug);
    assert.ok(topNames.includes("inclinaison-laterale-du-cou") || topNames.includes("mobilite-cervicale-avant-arriere"));
  });

  it("should find chest/push exercises when searching 'pectoraux' or 'pompes'", () => {
    const results = searchAndRankExercises(EXERCISES, "pectoraux");
    assert.ok(results.length > 0);
    const topNames = results.slice(0, 5).map((e) => e.slug);
    assert.ok(topNames.some((s) => s.includes("pompes") || s.includes("poitrine") || s.includes("paumes")));
  });

  it("should return empty list when searching completely non-existent terms", () => {
    const results = searchAndRankExercises(EXERCISES, "xyzrandomnonexistentterm1234");
    assert.equal(results.length, 0);
  });
});
