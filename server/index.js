import Fastify from "fastify";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const fastify = Fastify({ logger: true });

// Open database
const dbPath = path.resolve("files/bodytrain.db");
let db;
try {
  db = new DatabaseSync(dbPath);
} catch (e) {
  console.error("Could not open SQLite database at", dbPath, e);
}

// In-memory anonymous push subscriptions store
const pushSubscriptions = new Map();

// 1. Health check
fastify.get("/health", async () => {
  const count = db ? db.prepare("SELECT count(*) as count FROM exercises WHERE enabled = 1").get().count : 0;
  return { status: "ok", activeExercises: count, service: "BodyTrain API v2" };
});

// Helper to format exercise from DB
function formatExerciseRow(r) {
  const media = db
    ? db.prepare("SELECT * FROM exercise_media WHERE exercise_id = ?").all(r.id)
    : [];

  return {
    id: r.id,
    slug: r.slug,
    nameFr: r.name_fr,
    nameEn: r.name_en || undefined,
    shortDescriptionFr: r.short_description_fr,
    instructionsFr: JSON.parse(r.instructions_fr || "[]"),
    breathingGuidanceFr: r.breathing_guidance_fr || undefined,
    category: r.category,
    mode: r.mode,
    defaultDurationSeconds: r.default_duration_seconds,
    defaultRepetitions: r.default_repetitions,
    restAfterSeconds: r.rest_after_seconds,
    difficulty: r.difficulty,
    minimumEnergy: r.minimum_energy,
    maximumEnergy: r.maximum_energy,
    intensity: r.intensity,
    impactLevel: r.impact_level,
    requiresUpperBody: Boolean(r.requires_upper_body),
    requiresLowerBody: Boolean(r.requires_lower_body),
    requiresArmSupport: Boolean(r.requires_arm_support),
    requiresWristSupport: Boolean(r.requires_wrist_support),
    requiresKneeSupport: Boolean(r.requires_knee_support),
    requiresWall: Boolean(r.requires_wall),
    requiresFloorTransition: Boolean(r.requires_floor_transition),
    unilateral: Boolean(r.unilateral),
    jumping: Boolean(r.jumping),
    balanceRequired: Boolean(r.balance_required),
    compatibleWithUpperBodyDiscomfort: Boolean(r.compatible_upper_body_discomfort),
    compatibleWithLowerBodyDiscomfort: Boolean(r.compatible_lower_body_discomfort),
    suitableForGentleSession: Boolean(r.suitable_gentle),
    suitableForWarmup: Boolean(r.suitable_warmup),
    suitableForMainPhase: Boolean(r.suitable_main_phase),
    suitableForCooldown: Boolean(r.suitable_cooldown),
    generalPrecautionsFr: JSON.parse(r.general_precautions_fr || "[]"),
    stopSignalsFr: JSON.parse(r.stop_signals_fr || "[]"),
    easierVariantId: r.easier_variant_id || undefined,
    harderVariantId: r.harder_variant_id || undefined,
    media: media.map((m) => ({
      id: m.id,
      type: m.type,
      format: m.format,
      localPath: m.local_path,
      sourceUrl: m.source_url,
      license: m.license,
      attribution: m.attribution,
    })),
    enabled: Boolean(r.enabled),
  };
}

// 2. Metadata / Taxonomy
const getTaxonomyHandler = async () => {
  if (!db) return { error: "Database not available" };
  const categories = db.prepare("SELECT DISTINCT category FROM exercises").all().map((r) => r.category);
  const difficulties = db.prepare("SELECT DISTINCT difficulty FROM exercises").all().map((r) => r.difficulty);
  const impactLevels = db.prepare("SELECT DISTINCT impact_level FROM exercises").all().map((r) => r.impact_level);
  const positions = db.prepare("SELECT DISTINCT position FROM exercise_positions").all().map((r) => r.position);
  const bodyAreas = db.prepare("SELECT DISTINCT body_area FROM exercise_body_areas").all().map((r) => r.body_area);
  const joints = db.prepare("SELECT DISTINCT joint FROM exercise_joints").all().map((r) => r.joint);
  const tags = db.prepare("SELECT DISTINCT tag FROM exercise_tags").all().map((r) => r.tag);

  return {
    categories,
    difficulties,
    impactLevels,
    positions,
    bodyAreas,
    joints,
    tags,
  };
};

fastify.get("/exercise-metadata", getTaxonomyHandler);
fastify.get("/api/taxonomy", getTaxonomyHandler);

// 3. Stats
fastify.get("/exercise-stats", async () => {
  if (!db) return { error: "Database not available" };
  const total = db.prepare("SELECT count(*) as count FROM exercises WHERE enabled = 1").get().count;
  const gentle = db.prepare("SELECT count(*) as count FROM exercises WHERE suitable_gentle = 1").get().count;
  const upperCompat = db.prepare("SELECT count(*) as count FROM exercises WHERE compatible_upper_body_discomfort = 1").get().count;
  const lowerCompat = db.prepare("SELECT count(*) as count FROM exercises WHERE compatible_lower_body_discomfort = 1").get().count;
  return {
    totalExercises: total,
    gentleExercises: gentle,
    compatibleWithUpperBodyDiscomfort: upperCompat,
    compatibleWithLowerBodyDiscomfort: lowerCompat,
  };
});

// 4. Exercises list (handles both /exercises and /api/exercises)
const getExercisesHandler = async (request) => {
  if (!db) return [];
  const query = request.query || {};

  let sql = "SELECT * FROM exercises WHERE enabled = 1";
  const params = [];

  if (query.category) {
    const cats = String(query.category).split(",");
    sql += ` AND category IN (${cats.map(() => "?").join(",")})`;
    params.push(...cats);
  }

  if (query.difficulty) {
    const diffs = String(query.difficulty).split(",");
    sql += ` AND difficulty IN (${diffs.map(() => "?").join(",")})`;
    params.push(...diffs);
  }

  if (query.energy) {
    sql += " AND (minimum_energy = ? OR minimum_energy = 'very_low')";
    params.push(query.energy);
  }

  if (query.jumping !== undefined) {
    sql += " AND jumping = ?";
    params.push(query.jumping === "true" || query.jumping === "1" ? 1 : 0);
  }

  if (query.compatibleWithUpperBodyDiscomfort !== undefined) {
    sql += " AND compatible_upper_body_discomfort = ?";
    params.push(query.compatibleWithUpperBodyDiscomfort === "true" || query.compatibleWithUpperBodyDiscomfort === "1" ? 1 : 0);
  }

  if (query.compatibleWithLowerBodyDiscomfort !== undefined) {
    sql += " AND compatible_lower_body_discomfort = ?";
    params.push(query.compatibleWithLowerBodyDiscomfort === "true" || query.compatibleWithLowerBodyDiscomfort === "1" ? 1 : 0);
  }

  if (query.maxIntensity) {
    sql += " AND intensity <= ?";
    params.push(Number(query.maxIntensity));
  }

  if (query.minIntensity) {
    sql += " AND intensity >= ?";
    params.push(Number(query.minIntensity));
  }

  const limit = Math.min(200, Number(query.limit) || 200);
  const offset = Number(query.offset) || 0;
  sql += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatExerciseRow);
};

fastify.get("/exercises", getExercisesHandler);
fastify.get("/api/exercises", getExercisesHandler);

// 5. Single Exercise by id or slug
const getSingleExerciseHandler = async (request, reply) => {
  if (!db) return reply.code(500).send({ error: "Database not available" });
  const { idOrSlug } = request.params;
  const row = db.prepare("SELECT * FROM exercises WHERE (id = ? OR slug = ?) AND enabled = 1").get(idOrSlug, idOrSlug);
  if (!row) {
    return reply.code(404).send({ error: "Exercise not found" });
  }
  return formatExerciseRow(row);
};

fastify.get("/exercises/:idOrSlug", getSingleExerciseHandler);
fastify.get("/api/exercises/:idOrSlug", getSingleExerciseHandler);

// 6. Web Push Subscription endpoint
fastify.post("/api/push/subscribe", async (request, reply) => {
  const { subscription, reminderTime, activeDays, timezone } = request.body || {};
  if (!subscription || !subscription.endpoint) {
    return reply.code(400).send({ error: "Missing subscription data" });
  }

  pushSubscriptions.set(subscription.endpoint, {
    subscription,
    reminderTime: reminderTime || "07:30",
    activeDays: activeDays || [1, 2, 3, 4, 5, 6],
    timezone: timezone || "UTC",
    registeredAt: new Date().toISOString(),
  });

  return { success: true, count: pushSubscriptions.size };
});

// 7. Web Push Unsubscribe endpoint
fastify.post("/api/push/unsubscribe", async (request, reply) => {
  const { endpoint } = request.body || {};
  if (!endpoint) return reply.code(400).send({ error: "Missing endpoint" });
  pushSubscriptions.delete(endpoint);
  return { success: true };
});

const PORT = Number(process.env.PORT) || 3000;

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`BodyTrain API server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("server/index.js")) {
  startServer();
}
