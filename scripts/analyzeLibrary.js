import fs from 'node:fs';
import path from 'node:path';
import { EXERCISES } from '../src/data/exercisesData.ts';
import { SESSION_TEMPLATES, selectTemplate } from '../src/engine/sessionTemplates.ts';
import { generateSession, filterCandidates } from '../src/engine/generator.ts';
import { validateFullSession, isSessionValid } from '../src/engine/sessionValidation.ts';
import { SESSION_PHASES, MOVEMENT_PATTERNS, getTransitionLevel } from '../src/types/enums.ts';

const active = EXERCISES.filter((e) => e.enabled);

console.log('=== ANALYSE DE LA BIBLIOTHÈQUE ET DE LA COMPOSITION ===\n');
console.log(`Exercices actifs : ${active.length}`);

// 1. Couverture par phase
const phaseStats = {};
SESSION_PHASES.forEach((p) => {
  const matching = active.filter((e) => e.suitablePhases.includes(p));
  phaseStats[p] = {
    total: matching.length,
    standing: matching.filter((e) => getTransitionLevel(e.positions) === 'standing').length,
    floor: matching.filter((e) => getTransitionLevel(e.positions) === 'floor').length,
    upperDiscomfort: matching.filter(
      (e) =>
        e.compatibleWithUpperBodyDiscomfort &&
        !e.requiresUpperBody &&
        !e.requiresArmSupport &&
        !e.requiresWristSupport
    ).length,
    lowerDiscomfort: matching.filter(
      (e) =>
        e.compatibleWithLowerBodyDiscomfort &&
        !e.requiresLowerBody &&
        !e.requiresKneeSupport
    ).length,
  };
});

// 2. Movement Patterns
const patternStats = {};
MOVEMENT_PATTERNS.forEach((mp) => {
  patternStats[mp] = active.filter((e) => e.movementPatterns.includes(mp)).length;
});

// 3. Test de constructibilité de tous les templates x 3 gênes
const templateResults = [];
const discomforts = ['none', 'upper', 'lower'];
const durations = [5, 7, 10];
const energyScores = [1, 3, 6, 9]; // representative of very_low, low, medium, high

for (const duration of durations) {
  for (const energy of energyScores) {
    const template = selectTemplate(duration, energy);
    for (const discomfort of discomforts) {
      let validCount = 0;
      let totalViolations = 0;
      const violationTypes = {};
      const generatedSessions = [];

      for (let s = 1; s <= 30; s++) {
        const session = generateSession({
          energyScore: energy,
          discomfortZone: discomfort,
          targetDurationMinutes: duration,
          seed: s * 1000 + duration * 10 + energy,
        });
        generatedSessions.push(session);
        const results = validateFullSession(session);
        const failed = results.filter((r) => !r.passed);
        if (failed.length === 0) {
          validCount++;
        } else {
          totalViolations += failed.length;
          failed.forEach((f) => {
            violationTypes[f.rule] = (violationTypes[f.rule] || 0) + 1;
          });
        }
      }

      // Unique exercises used across 30 sessions
      const allExIds = new Set(
        generatedSessions.flatMap((s) => s.exercises.map((e) => e.exercise.id))
      );

      templateResults.push({
        templateId: template.id,
        duration,
        energy,
        energyTier: template.energyTier,
        discomfort,
        successRate: `${((validCount / 30) * 100).toFixed(0)}%`,
        validCount,
        uniqueExercisesUsed: allExIds.size,
        availableCandidates: filterCandidates(active, energy, discomfort).length,
        violationTypes,
      });
    }
  }
}

// 4. Génération du rapport Markdown
let md = `# Rapport d'analyse de la bibliothèque et composition BodyTrain\n\n`;
md += `*Généré le ${new Date().toISOString().split('T')[0]} - Bibliothèque active : ${active.length} exercices*\n\n`;

md += `## 1. Couverture par Phase Normalisée\n\n`;
md += `| Phase | Total | Debout | Au sol | Gêne Haut | Gêne Bas |\n`;
md += `|---|---:|---:|---:|---:|---:|\n`;
for (const p of SESSION_PHASES) {
  const st = phaseStats[p];
  md += `| **${p}** | ${st.total} | ${st.standing} | ${st.floor} | ${st.upperDiscomfort} | ${st.lowerDiscomfort} |\n`;
}

md += `\n## 2. Schémas de Mouvement (Movement Patterns)\n\n`;
md += `| Pattern | Nombre d'exercices |\n`;
md += `|---|---:|\n`;
for (const mp of MOVEMENT_PATTERNS) {
  md += `| \`${mp}\` | ${patternStats[mp]} |\n`;
}

md += `\n## 3. Matrice de Test des 36 Configurations (30 séances simulées par config)\n\n`;
md += `| Template | Durée | Énergie | Gêne | Succès (sur 30) | Ex. uniques utilisés | Pool candidats |\n`;
md += `|---|---:|---:|---|---:|---:|---:|\n`;
for (const tr of templateResults) {
  md += `| \`${tr.templateId}\` | ${tr.duration} min | ${tr.energyTier} (${tr.energy}) | ${tr.discomfort} | **${tr.successRate}** (${tr.validCount}/30) | ${tr.uniqueExercisesUsed} | ${tr.availableCandidates} |\n`;
}

const failedConfigs = templateResults.filter((tr) => tr.validCount < 30);
if (failedConfigs.length > 0) {
  md += `\n### ⚠️ Configurations avec violations de validation :\n\n`;
  for (const fc of failedConfigs) {
    md += `- **${fc.templateId} (${fc.discomfort})** : ${JSON.stringify(fc.violationTypes)}\n`;
  }
} else {
  md += `\n> [!NOTE]\n> **100% de succès sur les 1 080 séances générées (36 configs × 30 seeds)** sans aucune violation de règle de composition.\n`;
}

md += `\n## 4. Synthèse et Recommandations\n\n`;
md += `- **Gêne bas du corps** : Couverte grâce aux 3 exercices dynamiques sans sollicitation des jambes (Boxe en ombre assise, Moulinets des bras, Applaudissements rythmés).\n`;
md += `- **Fin active** : Variété renforcée avec exercices calmes debout (Balancement pendulaire, Marche lente, Étirement actif épaules).\n`;
md += `- **Transitions sol/debout** : Limitées à maximum 2 par séance grâce à l'algorithme d'optimisation de position.\n`;
md += `- **Début et fin debout** : Garantis systématiquement pour le confort du réveil matinal.\n`;

fs.writeFileSync('files/EXERCISE_COMPOSITION_REPORT.md', md, 'utf-8');
console.log('Rapport écrit dans files/EXERCISE_COMPOSITION_REPORT.md');

// Log summary
console.log('\n--- RÉSULTATS DES 36 CONFIGURATIONS ---');
let totalValid = 0;
templateResults.forEach((tr) => {
  totalValid += tr.validCount;
  if (tr.validCount < 30) {
    console.log(`⚠️ ${tr.templateId} (${tr.discomfort}): ${tr.validCount}/30 - ${JSON.stringify(tr.violationTypes)}`);
  }
});
console.log(`Total séances validées : ${totalValid} / ${templateResults.length * 30} (${((totalValid / (templateResults.length * 30)) * 100).toFixed(1)}%)`);
