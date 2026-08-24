# Rapport de la bibliothèque BodyTrain

Généré par `npm run exercises:report`. Ne pas modifier à la main.

## Vue d'ensemble

| Indicateur | Valeur |
| --- | ---: |
| Exercices actifs | 131 |
| Importés de free-exercise-db | 47 |
| Exercices BodyTrain conservés | 84 |
| Dont enrichis par une fusion avec la source | 19 |
| Rejetés de la source | 807 |
| Avec deux photos exploitables | 63 |
| Avec une seule photo | 3 |
| Avec une animation maison | 66 |
| Sans aucun média | 16 |
| À vérifier manuellement | 8 |

## Répartition par catégorie

| Catégorie | Clé | Exercices | Dont doux | Dont avec deux photos |
| --- | --- | ---: | ---: | ---: |
| Respiration | `breathing` | 6 | 6 | 1 |
| Réveil articulaire doux | `gentle_wakeup` | 6 | 5 | 1 |
| Mobilité du cou | `neck_mobility` | 5 | 5 | 3 |
| Mobilité des épaules | `shoulder_mobility` | 5 | 5 | 4 |
| Mobilité de la colonne | `spine_mobility` | 7 | 7 | 3 |
| Mobilité des hanches | `hip_mobility` | 9 | 4 | 5 |
| Mobilité des genoux | `knee_mobility` | 3 | 3 | 1 |
| Mobilité des chevilles | `ankle_mobility` | 4 | 4 | 0 |
| Équilibre | `balance` | 4 | 1 | 0 |
| Coordination | `coordination` | 2 | 0 | 1 |
| Renforcement des jambes | `legs_strength` | 8 | 0 | 3 |
| Renforcement des fessiers | `glutes_strength` | 5 | 1 | 3 |
| Renforcement du tronc | `core_strength` | 15 | 1 | 12 |
| Renforcement du dos | `back_strength` | 6 | 0 | 1 |
| Renforcement du haut du corps | `upper_body_strength` | 11 | 0 | 6 |
| Cardio doux | `gentle_cardio` | 5 | 2 | 0 |
| Cardio dynamique | `dynamic_cardio` | 9 | 0 | 5 |
| Étirements légers | `light_stretching` | 17 | 17 | 11 |
| Retour au calme | `cooldown` | 4 | 4 | 3 |

## Répartition par difficulté

| Difficulté | Exercices |
| --- | ---: |
| very_easy | 43 |
| easy | 39 |
| medium | 32 |
| hard | 17 |

## Répartition par intensité

| Intensité | Exercices |
| ---: | ---: |
| 1 | 27 |
| 2 | 39 |
| 3 | 33 |
| 4 | 22 |
| 5 | 10 |

## Couverture des contraintes d'adaptation

| Critère | Exercices | Part |
| --- | ---: | ---: |
| Séance douce | 65 | 50 % |
| Énergie très basse acceptée | 46 | 35 % |
| Compatible gêne du haut du corps | 81 | 62 % |
| Compatible gêne du bas du corps | 37 | 28 % |
| Sans saut | 126 | 96 % |
| Sans appui sur les mains | 109 | 83 % |
| Sans mise en charge des poignets | 115 | 88 % |
| Sans passage au sol | 72 | 55 % |
| Sans appui sur les genoux | 119 | 91 % |
| Nécessitant un mur | 2 | 2 % |
| Demandant de l'équilibre | 18 | 14 % |
| Utilisables en échauffement | 61 | 47 % |
| Utilisables en phase principale | 104 | 79 % |
| Utilisables en retour au calme | 50 | 38 % |

## Exercices à vérifier manuellement

| Exercice | Nom | Motif |
| --- | --- | --- |
| `aspiration-abdominale` | Aspiration abdominale | La version à quatre pattes met les poignets en charge : la position debout est proposée en premier. |
| `elevation-laterale-du-buste` | Élévation latérale du buste | La source ne fournit aucune consigne originale : le texte français s'appuie uniquement sur les deux photos. |
| `etirement-des-ischio-jambiers-assis` | Étirement des ischio-jambiers assis | Les deux photos de la source sont identiques : une seule position est illustrée. |
| `etirement-du-grand-dorsal-au-mur` | Étirement du grand dorsal au mur | Les deux photos de la source sont identiques : une seule position est illustrée. |
| `gainage-lateral-complet` | Gainage latéral complet | La source ne fournit aucune consigne originale : le texte français s'appuie uniquement sur les deux photos. |
| `ouverture-assise-jambes-ecartees` | Ouverture assise jambes écartées | Les deux photos de la source sont identiques : une seule position est illustrée. |
| `pompe-vers-gainage-lateral` | Pompe vers gainage latéral | La deuxième photo de la source montre la pompe basse, pas l'ouverture en gainage latéral. |
| `superman-au-sol` | Superman au sol | Les photos de la source montrent surtout une élévation des jambes, bras au sol : consignes à confronter aux images avant publication. |

## Ce qui n'a pas été validé humainement

Les trois drapeaux `quality.translationReviewed`, `quality.classificationReviewed` et
`quality.mediaReviewed` sont à **false sur les 131 exercices**, sans exception.

- Les traductions françaises ont été rédigées à partir des consignes anglaises et des
  photos, puis contrôlées automatiquement (longueur, absence de promesse médicale,
  absence de matériel interdit). **Aucun relecteur humain n'est passé dessus.**
- La classification adaptative suit des règles écrites et testées, mais les valeurs
  d'intensité, d'énergie et de difficulté restent des estimations.
- Les paires d'images ont été inspectées visuellement pendant l'import, ce qui a permis
  d'écarter plusieurs exercices dont les photos contredisaient les consignes. Cette
  inspection ne remplace pas une relecture humaine.

Les compatibilités avec une gêne ne sont jamais saisies à la main : elles sont
**calculées** par `computeCompatibility()`. Un `true` ne peut donc résulter que de
l'absence réelle de sollicitation de la zone. Ces drapeaux servent à **exclure** des
mouvements, jamais à affirmer qu'un exercice est sans risque.
