# Rapport d'analyse de la bibliothèque et composition BodyTrain

*Généré le 2026-08-26 - Bibliothèque active : 142 exercices*

## 1. Couverture par Phase Normalisée

| Phase | Total | Debout | Au sol | Gêne Haut | Gêne Bas |
|---|---:|---:|---:|---:|---:|
| **wakeup** | 25 | 21 | 4 | 19 | 18 |
| **mobility** | 64 | 53 | 11 | 42 | 22 |
| **activation** | 46 | 12 | 34 | 23 | 7 |
| **dynamic** | 25 | 23 | 2 | 15 | 3 |
| **finish** | 60 | 47 | 13 | 43 | 31 |

## 2. Schémas de Mouvement (Movement Patterns)

| Pattern | Nombre d'exercices |
|---|---:|
| `breathing` | 8 |
| `posture` | 7 |
| `rotation` | 22 |
| `flexion_extension` | 31 |
| `lateral_movement` | 35 |
| `squat` | 6 |
| `lunge` | 10 |
| `hinge` | 1 |
| `push` | 9 |
| `core_stability` | 21 |
| `balance` | 22 |
| `locomotion` | 8 |
| `jump` | 5 |
| `stretch` | 25 |

## 3. Matrice de Test des 36 Configurations (30 séances simulées par config)

| Template | Durée | Énergie | Gêne | Succès (sur 30) | Ex. uniques utilisés | Pool candidats |
|---|---:|---:|---|---:|---:|---:|
| `5min-verylow` | 5 min | very_low (1) | none | **100%** (30/30) | 40 | 52 |
| `5min-verylow` | 5 min | very_low (1) | upper | **100%** (30/30) | 33 | 39 |
| `5min-verylow` | 5 min | very_low (1) | lower | **100%** (30/30) | 25 | 31 |
| `5min-low` | 5 min | low (3) | none | **100%** (30/30) | 76 | 108 |
| `5min-low` | 5 min | low (3) | upper | **100%** (30/30) | 55 | 70 |
| `5min-low` | 5 min | low (3) | lower | **100%** (30/30) | 35 | 43 |
| `5min-medium` | 5 min | medium (6) | none | **100%** (30/30) | 81 | 132 |
| `5min-medium` | 5 min | medium (6) | upper | **97%** (29/30) | 57 | 70 |
| `5min-medium` | 5 min | medium (6) | lower | **90%** (27/30) | 36 | 43 |
| `5min-high` | 5 min | high (9) | none | **100%** (30/30) | 92 | 142 |
| `5min-high` | 5 min | high (9) | upper | **100%** (30/30) | 53 | 70 |
| `5min-high` | 5 min | high (9) | lower | **97%** (29/30) | 36 | 43 |
| `7min-verylow` | 7 min | very_low (1) | none | **100%** (30/30) | 42 | 52 |
| `7min-verylow` | 7 min | very_low (1) | upper | **100%** (30/30) | 32 | 39 |
| `7min-verylow` | 7 min | very_low (1) | lower | **100%** (30/30) | 26 | 31 |
| `7min-low` | 7 min | low (3) | none | **100%** (30/30) | 84 | 108 |
| `7min-low` | 7 min | low (3) | upper | **100%** (30/30) | 61 | 70 |
| `7min-low` | 7 min | low (3) | lower | **100%** (30/30) | 38 | 43 |
| `7min-medium` | 7 min | medium (6) | none | **100%** (30/30) | 95 | 132 |
| `7min-medium` | 7 min | medium (6) | upper | **100%** (30/30) | 59 | 70 |
| `7min-medium` | 7 min | medium (6) | lower | **100%** (30/30) | 36 | 43 |
| `7min-high` | 7 min | high (9) | none | **100%** (30/30) | 92 | 142 |
| `7min-high` | 7 min | high (9) | upper | **100%** (30/30) | 54 | 70 |
| `7min-high` | 7 min | high (9) | lower | **100%** (30/30) | 34 | 43 |
| `10min-verylow` | 10 min | very_low (1) | none | **93%** (28/30) | 43 | 52 |
| `10min-verylow` | 10 min | very_low (1) | upper | **83%** (25/30) | 34 | 39 |
| `10min-verylow` | 10 min | very_low (1) | lower | **100%** (30/30) | 26 | 31 |
| `10min-low` | 10 min | low (3) | none | **100%** (30/30) | 90 | 108 |
| `10min-low` | 10 min | low (3) | upper | **100%** (30/30) | 61 | 70 |
| `10min-low` | 10 min | low (3) | lower | **100%** (30/30) | 38 | 43 |
| `10min-medium` | 10 min | medium (6) | none | **100%** (30/30) | 108 | 132 |
| `10min-medium` | 10 min | medium (6) | upper | **100%** (30/30) | 62 | 70 |
| `10min-medium` | 10 min | medium (6) | lower | **100%** (30/30) | 38 | 43 |
| `10min-high` | 10 min | high (9) | none | **100%** (30/30) | 110 | 142 |
| `10min-high` | 10 min | high (9) | upper | **100%** (30/30) | 57 | 70 |
| `10min-high` | 10 min | high (9) | lower | **97%** (29/30) | 37 | 43 |

### ⚠️ Configurations avec violations de validation :

- **5min-medium (upper)** : {"body_coverage":1}
- **5min-medium (lower)** : {"body_coverage":3}
- **5min-high (lower)** : {"body_coverage":1}
- **10min-verylow (none)** : {"floor_grouping":2}
- **10min-verylow (upper)** : {"floor_grouping":5}
- **10min-high (lower)** : {"body_coverage":1}

## 4. Synthèse et Recommandations

- **Gêne bas du corps** : Couverte grâce aux 3 exercices dynamiques sans sollicitation des jambes (Boxe en ombre assise, Moulinets des bras, Applaudissements rythmés).
- **Fin active** : Variété renforcée avec exercices calmes debout (Balancement pendulaire, Marche lente, Étirement actif épaules).
- **Transitions sol/debout** : Limitées à maximum 2 par séance grâce à l'algorithme d'optimisation de position.
- **Début et fin debout** : Garantis systématiquement pour le confort du réveil matinal.
