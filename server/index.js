import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

const fastify = Fastify({ logger: true });

// Enable CORS for all local and network requests
await fastify.register(fastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// VAPID Keys configuration for Web Push Protocol (Apple APNs & Google FCM)
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BMAA1nSAHdlaE3pOrNvVOMK6qys9akFfaJwoK5qiJFpd0lpK_nFfZZNLkKiHeArjRKD5IB2E8mvr1KckFgpwBbk";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "-z90C-6PLqVbu0U-INkC1UNOE40WpEhE1lavEAwWhfQ";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@bodytrain.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Open database
const dbPath = path.resolve("files/bodytrain.db");
let db;
try {
  db = new DatabaseSync(dbPath);
  // Ensure persistent push subscriptions table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      subscription_json TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      active_days TEXT NOT NULL,
      timezone TEXT NOT NULL,
      last_notified_date TEXT,
      created_at TEXT NOT NULL
    );
  `);
} catch (e) {
  console.error("Could not open SQLite database at", dbPath, e);
}

// 1. Health check
fastify.get("/health", async () => {
  const count = db ? db.prepare("SELECT count(*) as count FROM exercises WHERE enabled = 1").get().count : 0;
  const subs = db ? db.prepare("SELECT count(*) as count FROM push_subscriptions").get().count : 0;
  return { status: "ok", activeExercises: count, activeSubscriptions: subs, service: "BodyTrain API v2" };
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

// 6. Web Push VAPID Public Key
fastify.get("/api/push/vapid-public-key", async () => {
  return { publicKey: VAPID_PUBLIC_KEY };
});

// 7. Web Push Subscription endpoint (save or update schedule)
fastify.post("/api/push/subscribe", async (request, reply) => {
  const { subscription, reminderTime, activeDays, timezone } = request.body || {};
  if (!subscription || !subscription.endpoint) {
    return reply.code(400).send({ error: "Missing subscription data" });
  }

  const timeFormatted = String(reminderTime || "07:30").trim();
  const daysFormatted = JSON.stringify(activeDays || [1, 2, 3, 4, 5, 6]);
  const tzFormatted = timezone || "Europe/Paris";

  if (db) {
    const stmt = db.prepare(`
      INSERT INTO push_subscriptions (endpoint, subscription_json, reminder_time, active_days, timezone, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        subscription_json = excluded.subscription_json,
        reminder_time = excluded.reminder_time,
        active_days = excluded.active_days,
        timezone = excluded.timezone
    `);

    stmt.run(
      subscription.endpoint,
      JSON.stringify(subscription),
      timeFormatted,
      daysFormatted,
      tzFormatted,
      new Date().toISOString()
    );
    console.log(`[PushService] Registered/Updated subscription for ${subscription.endpoint.slice(0, 35)}... at ${timeFormatted} (${tzFormatted})`);
  }

  return { success: true };
});

// 8. Web Push Unsubscribe endpoint
fastify.post("/api/push/unsubscribe", async (request, reply) => {
  const { endpoint } = request.body || {};
  if (!endpoint) return reply.code(400).send({ error: "Missing endpoint" });
  if (db) {
    db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
    console.log(`[PushService] Removed subscription for ${endpoint.slice(0, 35)}...`);
  }
  return { success: true };
});

// 9. Real Remote Server Push Test (sends an actual Web Push via Apple/Google servers)
fastify.post("/api/push/test", async (request, reply) => {
  const { subscription } = request.body || {};
  if (!subscription || !subscription.endpoint) {
    return reply.code(400).send({ error: "Missing subscription" });
  }

  try {
    const payload = JSON.stringify({
      title: "BodyTrain • Notification de test",
      body: "Bravo ! Les notifications programmées fonctionnent parfaitement sur votre appareil.",
      url: "/",
    });

    const pushOptions = {
      TTL: 3600,
      urgency: "high",
    };

    await webpush.sendNotification(subscription, payload, pushOptions);
    console.log(`[PushService] Test notification successfully sent to ${subscription.endpoint.slice(0, 35)}...`);
    return { success: true, message: "Notification Web Push envoyée avec succès !" };
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ error: "Échec de l'envoi Web Push", details: err.message });
  }
});

// 10. Background Cron Job for Scheduled Morning Push Notifications
function startPushScheduler() {
  if (!db) return;

  setInterval(async () => {
    try {
      const now = new Date();
      const rows = db.prepare("SELECT * FROM push_subscriptions").all();

      for (const row of rows) {
        try {
          const tz = row.timezone || "Europe/Paris";

          // Strict 24h format HH:MM in user's timezone
          const timeFormatter = new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const userLocalTime = timeFormatter.format(now); // e.g. "07:30"

          // Strict YYYY-MM-DD in user's timezone
          const dateFormatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const userLocalDate = dateFormatter.format(now); // e.g. "2026-08-26"

          // Day of week in user's timezone (0=Sunday, 1=Monday... 6=Saturday)
          const dayFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            weekday: "short",
          });
          const dayShort = dayFormatter.format(now);
          const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const userDay = dayMap[dayShort] ?? now.getDay();

          const activeDays = JSON.parse(row.active_days || "[1,2,3,4,5,6]");

          // Check if current day and minute match
          if (activeDays.includes(userDay) && userLocalTime === row.reminder_time) {
            // Ensure not already sent today
            if (row.last_notified_date !== userLocalDate) {
              const subscription = JSON.parse(row.subscription_json);
              const payload = JSON.stringify({
                title: "BodyTrain • C'est l'heure de bouger !",
                body: "Bonjour ! Prenez 7 minutes pour réveiller votre corps en douceur.",
                url: "/",
              });

              const pushOptions = {
                TTL: 3600,
                urgency: "high",
              };

              console.log(`[PushScheduler] Sending scheduled morning reminder (${userLocalTime} / ${userLocalDate}) to ${row.endpoint.slice(0, 35)}...`);
              await webpush.sendNotification(subscription, payload, pushOptions);

              db.prepare("UPDATE push_subscriptions SET last_notified_date = ? WHERE endpoint = ?").run(
                userLocalDate,
                row.endpoint
              );
            }
          }
        } catch (pushErr) {
          // If subscription expired / 410 Gone / 404, clean it up
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(row.endpoint);
            console.log(`[PushScheduler] Removed expired subscription ${row.endpoint.slice(0, 30)}...`);
          } else {
            console.error("[PushScheduler] Error sending push:", pushErr.message);
          }
        }
      }
    } catch (e) {
      console.error("[PushScheduler] Global scheduler error:", e);
    }
  }, 10000); // check every 10 seconds
}

startPushScheduler();

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
