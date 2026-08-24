import fs from 'node:fs';
import path from 'node:path';

const jsonPath = path.resolve('files/exercises.json');
if (!fs.existsSync(jsonPath)) {
  console.error('exercises.json not found at', jsonPath);
  process.exit(1);
}

const rawExercises = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Normalize exercises for both v2 and UI convenience
const exercises = rawExercises.map((e) => ({
  ...e,
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
console.log(`Successfully exported ${exercises.length} exercises to src/data/exercisesData.ts and src/data/exercises.json`);
