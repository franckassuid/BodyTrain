import fs from 'node:fs';
import path from 'node:path';

const jsonPath = path.resolve('files/exercises.json');
if (!fs.existsSync(jsonPath)) {
  console.error('exercises.json not found at', jsonPath);
  process.exit(1);
}

const rawExercises = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// ── Phase derivation ────────────────────────────────────────────────────────

const MOBILITY_CATEGORIES = [
  'neck_mobility', 'shoulder_mobility', 'spine_mobility',
  'hip_mobility', 'knee_mobility', 'ankle_mobility',
];
const STRENGTH_CATEGORIES = [
  'legs_strength', 'glutes_strength', 'core_strength',
  'back_strength', 'upper_body_strength',
];
const DYNAMIC_CATEGORIES = [
  'gentle_cardio', 'dynamic_cardio', 'coordination', 'balance',
];

function deriveSuitablePhases(e) {
  const phases = new Set();

  // Primary phase from category
  if (e.category === 'breathing' || e.category === 'gentle_wakeup') {
    if (e.intensity <= 2) phases.add('wakeup');
    if (e.intensity <= 2) phases.add('finish');
  }
  if (MOBILITY_CATEGORIES.includes(e.category)) {
    phases.add('mobility');
    if (e.intensity <= 1 && e.suitableForGentleSession) phases.add('wakeup');
    if (e.intensity <= 2 && e.suitableForCooldown) phases.add('finish');
  }
  if (STRENGTH_CATEGORIES.includes(e.category)) {
    phases.add('activation');
  }
  if (DYNAMIC_CATEGORIES.includes(e.category)) {
    phases.add('dynamic');
    // Gentle cardio and balance can also serve as wakeup/finish
    if ((e.category === 'gentle_cardio' || e.category === 'balance') && e.intensity <= 2) {
      phases.add('finish');
    }
  }
  if (e.category === 'light_stretching') {
    phases.add('finish');
    // Light stretching of mobility areas can also be mobility
    if (e.intensity <= 2) phases.add('mobility');
  }
  if (e.category === 'cooldown') {
    phases.add('finish');
  }

  // Additional from suitability flags
  if (e.suitableForWarmup && e.intensity <= 2 && phases.size === 0) {
    phases.add('wakeup');
  }
  if (e.suitableForWarmup && e.intensity <= 3 && !phases.has('wakeup') && !phases.has('activation')) {
    phases.add('mobility');
  }
  if (e.suitableForCooldown && e.intensity <= 2) {
    phases.add('finish');
  }

  // Safety: never put high-intensity or jumping in wakeup
  if (e.intensity >= 4 || e.jumping) {
    phases.delete('wakeup');
  }
  // Never put intense cardio in finish
  if (e.intensity >= 4) {
    phases.delete('finish');
  }

  return Array.from(phases);
}

// ── Movement pattern derivation ─────────────────────────────────────────────

function deriveMovementPatterns(e) {
  const patterns = new Set();
  const name = (e.id || '').toLowerCase();
  const tags = (e.tags || []).map(t => t.toLowerCase());
  const allText = [name, ...tags].join(' ');

  // Breathing
  if (e.mode === 'breathing' || e.category === 'breathing') {
    patterns.add('breathing');
  }

  // Posture
  if (e.category === 'gentle_wakeup' && e.intensity <= 2) {
    patterns.add('posture');
  }

  // Rotation
  if (allText.includes('rotation') || allText.includes('essorage') ||
      allText.includes('torsion') || allText.includes('cercle') ||
      allText.includes('moulinet')) {
    patterns.add('rotation');
  }
  // Spine/neck/shoulder mobility often involves rotation
  if (['neck_mobility', 'shoulder_mobility', 'spine_mobility'].includes(e.category) &&
      (e.jointsUsed || []).some(j => ['thoracic_spine', 'lumbar_spine', 'neck'].includes(j))) {
    // Check if name suggests rotation
    if (allText.includes('lateral') || allText.includes('inclinaison')) {
      patterns.add('lateral_movement');
    } else if (!patterns.has('rotation') && !allText.includes('flexion') && !allText.includes('extension')) {
      patterns.add('rotation'); // default for spine/neck mobility
    }
  }

  // Flexion/Extension
  if (allText.includes('flexion') || allText.includes('extension') ||
      allText.includes('deroule') || allText.includes('chat-vache') ||
      allText.includes('genou-poitrine') || allText.includes('bascule')) {
    patterns.add('flexion_extension');
  }
  // Hip and ankle mobility is often flexion/extension
  if (['hip_mobility', 'knee_mobility', 'ankle_mobility'].includes(e.category) &&
      !patterns.has('rotation') && !patterns.has('lateral_movement')) {
    patterns.add('flexion_extension');
  }

  // Lateral movement
  if (allText.includes('lateral') || allText.includes('abduction') ||
      allText.includes('adduct') || allText.includes('balancement-lateral') ||
      allText.includes('inclinaison')) {
    patterns.add('lateral_movement');
  }

  // Squat
  if (allText.includes('squat')) {
    patterns.add('squat');
  }

  // Lunge
  if (allText.includes('fente')) {
    patterns.add('lunge');
  }

  // Hinge
  if (allText.includes('bon-matin') || allText.includes('hinge') ||
      allText.includes('good-morning')) {
    patterns.add('hinge');
  }

  // Push
  if (allText.includes('pompe') || allText.includes('push') ||
      allText.includes('pression')) {
    patterns.add('push');
  }

  // Core stability
  if (e.category === 'core_strength' || allText.includes('gainage') ||
      allText.includes('plank') || allText.includes('dead-bug') ||
      allText.includes('crunch') || allText.includes('abdomin')) {
    patterns.add('core_stability');
  }

  // Balance
  if (e.balanceRequired || e.category === 'balance' ||
      allText.includes('equilibre') || allText.includes('tandem')) {
    patterns.add('balance');
  }

  // Locomotion
  if (allText.includes('marche') || allText.includes('pas-') ||
      allText.includes('talon') && allText.includes('pointe') ||
      allText.includes('montee') || allText.includes('course') ||
      e.category === 'gentle_cardio' || e.category === 'dynamic_cardio') {
    // Only add locomotion for actual movement, not all cardio
    if (allText.includes('marche') || allText.includes('pas-') ||
        allText.includes('montee-de-genoux') || allText.includes('talon-pointe')) {
      patterns.add('locomotion');
    }
  }

  // Jump
  if (e.jumping) {
    patterns.add('jump');
  }

  // Stretch
  if (e.category === 'light_stretching' || e.category === 'cooldown' ||
      allText.includes('etirement') || allText.includes('stretch')) {
    patterns.add('stretch');
  }

  // Back strength
  if (e.category === 'back_strength' && !patterns.has('hinge')) {
    if (allText.includes('extension') || allText.includes('superman') || allText.includes('nage')) {
      patterns.add('flexion_extension');
    }
  }

  // Upper body strength (not push)
  if (e.category === 'upper_body_strength' && !patterns.has('push')) {
    if (allText.includes('bras') || allText.includes('epaule')) {
      patterns.add('flexion_extension');
    }
  }

  // Fallback: if no pattern assigned, use the most relevant
  if (patterns.size === 0) {
    if (e.category === 'coordination') patterns.add('balance');
    else if (e.category === 'gentle_wakeup') patterns.add('posture');
    else patterns.add('flexion_extension');
  }

  return Array.from(patterns);
}

// ── Fatigue areas derivation ────────────────────────────────────────────────

function deriveFatigueAreas(e) {
  // Fatigue areas = primary body areas (the muscles that do the work)
  return [...(e.primaryBodyAreas || [])];
}

// ── Normalize exercises ─────────────────────────────────────────────────────

const exercises = rawExercises.map((e) => ({
  ...e,
  // Derived composition metadata
  suitablePhases: deriveSuitablePhases(e),
  movementPatterns: deriveMovementPatterns(e),
  fatigueAreas: deriveFatigueAreas(e),
  // Compatibility aliases for UI
  name: e.nameFr,
  shortDescription: e.shortDescriptionFr,
  instructions: e.instructionsFr,
  generalPrecautions: e.generalPrecautionsFr || [],
  stopSignals: e.stopSignalsFr || [],
}));

fs.mkdirSync('src/data', { recursive: true });

// Write JSON
fs.writeFileSync('src/data/exercises.json', JSON.stringify(exercises, null, 2), 'utf-8');

// Write TypeScript
const tsContent = `// Auto-generated from files/exercises.json (v2 backend). Do not edit manually.
import type { Exercise } from '../types/exercise.ts';

export const EXERCISES: Exercise[] = ${JSON.stringify(exercises, null, 2)};

export const EXERCISES_MAP: Map<string, Exercise> = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES_MAP.get(id);
}
`;

fs.writeFileSync('src/data/exercisesData.ts', tsContent, 'utf-8');

// ── Report ──────────────────────────────────────────────────────────────────

const phases = { wakeup: 0, mobility: 0, activation: 0, dynamic: 0, finish: 0 };
exercises.forEach(e => {
  for (const p of e.suitablePhases) {
    phases[p] = (phases[p] || 0) + 1;
  }
});

console.log(`Successfully exported ${exercises.length} exercises`);
console.log('Phase coverage:', JSON.stringify(phases));

const patternCounts = {};
exercises.forEach(e => {
  for (const p of e.movementPatterns) {
    patternCounts[p] = (patternCounts[p] || 0) + 1;
  }
});
console.log('Movement patterns:', JSON.stringify(patternCounts));
