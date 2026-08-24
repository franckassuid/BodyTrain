# BodyTrain — bibliothèque et API d'exercices

Backend et bibliothèque d'exercices pour une PWA mobile de séances physiques matinales
adaptatives. Ce dépôt contient les **données**, les **médias**, le **stockage** et l'**API
de consultation**. Le générateur de séances, le minuteur et le frontend sont hors périmètre.

- **131 exercices actifs**, réalisables seul, à la maison, dans un petit espace, avec un
  tapis pour seul matériel
- 19 catégories normalisées, des métadonnées adaptatives, des règles de sécurité testées
- Un pipeline d'import reproductible et idempotent depuis
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense)
- Une base SQLite, des exports JSON prêts pour un usage hors ligne, une API REST

## Prérequis

- Node.js 22 ou plus récent
- Une copie locale du dépôt source (voir plus bas)

## Installation

```bash
npm install
```

## Récupérer la source épinglée

Le fichier `source.lock.json` fige le dépôt, le commit et l'empreinte SHA-256 du fichier
de licence :

```bash
git clone https://github.com/yuhonas/free-exercise-db vendor/free-exercise-db
git -C vendor/free-exercise-db checkout b0eed061e1c832b3ed815fbaa4b45b3cdc14df49
```

L'import **refuse de démarrer** si la licence ne correspond plus à l'empreinte enregistrée.

## Reconstruire toute la base

```bash
npm run rebuild
```

Cette commande enchaîne l'import, la base, les exports, les rapports et les tests. Les
étapes peuvent aussi être lancées séparément :

```bash
npm run exercises:import    # filtre, fusionne, convertit les images, écrit dist/
npm run db:reset            # recrée data/bodytrain.db et la remplit
npm run exercises:export    # dist/exercises.json + dist/exercise-metadata.json
npm run exercises:report    # les trois rapports Markdown
npm run exercises:validate  # la suite de tests (alias de npm test)
```

L'import est **idempotent** : deux exécutions sur la même source ne réécrivent aucune image
et produisent des exports identiques.

## Lancer l'API

```bash
npm run dev     # rechargement à chaud
npm start       # exécution simple
```

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | État du service et nombre d'exercices |
| `GET` | `/exercises` | Liste filtrable |
| `GET` | `/exercises/:idOrSlug` | Un exercice, par identifiant ou par slug |
| `GET` | `/exercise-metadata` | Toutes les valeurs normalisées et leurs libellés |
| `GET` | `/exercise-stats` | Répartitions et couverture des contraintes |

Filtres de `/exercises`, tous cumulables, valeurs multiples séparées par des virgules :

```
category, difficulty, energy, position, impact, bodyArea, joint, primaryOnly,
minIntensity, maxIntensity, jumping, requiresArmSupport, requiresWristSupport,
requiresWall, requiresFloorTransition, balanceRequired,
compatibleWithUpperBodyDiscomfort, compatibleWithLowerBodyDiscomfort,
suitableForGentleSession, suitableForWarmup, suitableForMainPhase, suitableForCooldown,
qualityStatus, provider, hasMedia, tag, includeDisabled, limit, offset
```

```bash
curl "localhost:3000/exercises?energy=very_low&jumping=false"
curl "localhost:3000/exercises?position=standing&requiresFloorTransition=false"
curl "localhost:3000/exercises?compatibleWithUpperBodyDiscomfort=true&maxIntensity=3"
curl "localhost:3000/exercises/pompes-larges"
```

`energy` retient les exercices dont la fenêtre d'énergie contient le niveau demandé. Une
valeur inconnue renvoie `400` plutôt qu'un filtre silencieusement ignoré.

## Structure des exports

| Fichier | Contenu |
| --- | --- |
| `dist/exercises.json` | Les 131 exercices complets, triés par identifiant, directement intégrable dans une PWA hors ligne |
| `dist/exercise-metadata.json` | Les valeurs normalisées, leurs libellés français et la provenance |
| `dist/rejected-exercises.json` | Les 807 exercices écartés, avec leur motif |
| `dist/media-manifest.json` | Dimensions réelles des images et paires identiques détectées |
| `public/exercises/{slug}/start.webp` | Position de départ |
| `public/exercises/{slug}/end.webp` | Position d'arrivée |

Les deux photos sont enregistrées comme `start_position` et `end_position`. Elles ne sont
**jamais** présentées comme une animation. Les animations sont des schémas filaires SVG
produits pour ce projet, portés par le type de média `animation`.

## Structure du dépôt

```
src/
  domain/      modèle v2, enums normalisés, calcul des compatibilités
  import/      source épinglée, curation, filtres, fusion, médias, pipeline
  custom/      adaptation des 84 exercices BodyTrain vers le modèle v2
  data/        les exercices BodyTrain d'origine (source de vérité)
  animations/  moteur de rendu SVG et poses
  db/          migrations, client SQLite, seed, accès aux données
  api/         serveur Fastify et routes
  scripts/     import, export, rapports, génération des animations
tests/         suite Vitest
legacy/        ancienne base v1, conservée jusqu'à validation
vendor/        copie épinglée du dépôt source
```

## Mettre à jour la source

1. Récupérer le nouveau commit et le placer dans `vendor/free-exercise-db`.
2. Mettre à jour `commit` dans `source.lock.json`.
3. Relire le fichier de licence, puis mettre à jour `licenseSha256`. **Cette étape est
   volontairement manuelle** : elle force une relecture des conditions d'utilisation.
4. Lancer `npm run rebuild`. Tout candidat sans décision de curation fait échouer les tests
   et apparaît dans `IMPORT_REPORT.md`.
5. Contrôler visuellement les nouvelles paires d'images avant publication.

## Points nécessitant encore une validation humaine

Les drapeaux `quality.translationReviewed`, `quality.classificationReviewed` et
`quality.mediaReviewed` sont à **`false` sur les 131 exercices**. Ils ne deviendront `true`
qu'après une relecture humaine réelle. Concrètement, restent à valider :

1. **Les traductions françaises** : rédigées à partir des consignes anglaises et des photos,
   contrôlées automatiquement, jamais relues par une personne.
2. **La classification adaptative** : intensité, énergie et difficulté sont des estimations
   cohérentes entre elles, mais non validées sur le terrain.
3. **Les 8 exercices marqués `review_required`**, listés dans `EXERCISE_LIBRARY_REPORT.md`.
4. **Les correspondances image/consigne** : une inspection visuelle a été faite pendant
   l'import et a permis d'écarter 15 exercices dont les photos contredisaient les
   consignes, mais elle mérite une seconde paire d'yeux.

## Avertissement

Les précautions et signaux d'arrêt s'appuient sur des pratiques d'entraînement courantes et
sont classés de façon volontairement prudente. **Ils n'ont pas été relus par un
professionnel de santé et ne constituent pas un avis médical.** Les champs de compatibilité
avec une gêne servent à *exclure* des mouvements, jamais à affirmer qu'un exercice est sûr.
