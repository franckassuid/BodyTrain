# Rapport d'import

Généré par `npm run exercises:report`. Ne pas modifier à la main.

## Source utilisée

| Champ | Valeur |
| --- | --- |
| Dépôt | https://github.com/yuhonas/free-exercise-db |
| Commit | `b0eed061e1c832b3ed815fbaa4b45b3cdc14df49` |
| Licence | Unlicense |
| Empreinte SHA-256 du fichier de licence | `6b0382b16279f26ff69014300541967a356a666eb0b91b422f6862f6b7dad17e` |

L'import refuse de démarrer si l'empreinte de la licence ne correspond plus.

## Volumes

| Étape | Nombre |
| --- | ---: |
| Exercices analysés dans la source | 873 |
| Candidats sans matériel | 188 |
| Importés dans BodyTrain | 47 |
| Fusionnés dans un exercice existant | 19 |
| Rejetés | 807 |
| Exercices BodyTrain d'origine | 84 |
| **Total actif** | **131** |

Chacun des 188 candidats sans matériel a reçu une
décision explicite : import, fusion ou rejet motivé. Aucun n'est resté sans arbitrage.

## Motifs de rejet

| Motif | Règle | Exercices |
| --- | --- | ---: |
| Matériel requis | `equipment` | 685 |
| Redondant avec un exercice déjà retenu | `redundant` | 34 |
| Mobilier ou support surélevé requis | `furniture` | 24 |
| Photos incompatibles avec les consignes | `media_mismatch` | 15 |
| Espace ou distance insuffisants | `space` | 13 |
| Risque jugé trop élevé pour une séance non supervisée | `risk` | 11 |
| Consignes ambiguës ou illisibles en deux images | `clarity` | 11 |
| Barre de traction requise | `pull_up_bar` | 8 |
| Partenaire ou ancrage des pieds requis | `partner` | 5 |
| Niveau expert | `difficulty` | 1 |

Les rejets pour matériel sont automatiques et déduits du champ `equipment` de la source.
Tous les autres sont des décisions individuelles, détaillées ci-dessous.

### Consignes ambiguës ou illisibles en deux images (11)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Body_Tricep_Press` | Body Tricep Press | Consignes ambiguës sur le placement des mains |
| `Clock_Push-Up` | Clock Push-Up | Déplacement circulaire complexe, peu lisible en deux images |
| `Dynamic_Back_Stretch` | Dynamic Back Stretch | Consignes ambiguës |
| `Hip_Circles_prone` | Hip Circles (prone) | Consignes ambiguës, position instable |
| `Isometric_Wipers` | Isometric Wipers | Mouvement avancé, exécution difficile à comprendre en deux images |
| `Leg_Lift` | Leg Lift | Consignes ambiguës, mouvement non identifiable avec certitude |
| `Looking_At_Ceiling` | Looking At Ceiling | Consignes ambiguës, bénéfice du mouvement peu clair |
| `Side_Wrist_Pull` | Side Wrist Pull | Consignes ambiguës |
| `Side-Lying_Floor_Stretch` | Side-Lying Floor Stretch | Consignes ambiguës sur le placement |
| `Upper_Back-Leg_Grab` | Upper Back-Leg Grab | Consignes ambiguës |
| `Windmills` | Windmills | Consignes ambiguës, plusieurs mouvements portent ce nom |

### Niveau expert (1)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Single-Arm_Push-Up` | Single-Arm Push-Up | Niveau expert |

### Mobilier ou support surélevé requis (24)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Bench_Dips` | Bench Dips | Nécessite un banc ou une chaise |
| `Bench_Jump` | Bench Jump | Nécessite un banc |
| `Chair_Lower_Back_Stretch` | Chair Lower Back Stretch | Nécessite une chaise |
| `Close-Grip_Push-Up_off_of_a_Dumbbell` | Close-Grip Push-Up off of a Dumbbell | Nécessite un haltère |
| `Crunch_-_Legs_On_Exercise_Ball` | Crunch - Legs On Exercise Ball | Nécessite un ballon de gym |
| `Decline_Crunch` | Decline Crunch | Nécessite un banc incliné |
| `Decline_Oblique_Crunch` | Decline Oblique Crunch | Nécessite un banc incliné |
| `Decline_Push-Up` | Decline Push-Up | Nécessite un support surélevé pour les pieds |
| `Decline_Reverse_Crunch` | Decline Reverse Crunch | Nécessite un banc incliné |
| `Dips_-_Triceps_Version` | Dips - Triceps Version | Nécessite des barres parallèles |
| `Flat_Bench_Leg_Pull-In` | Flat Bench Leg Pull-In | Nécessite un banc |
| `Flat_Bench_Lying_Leg_Raise` | Flat Bench Lying Leg Raise | Nécessite un banc |
| `Incline_Push-Up` | Incline Push-Up | Nécessite un support surélevé pour les mains |
| `Incline_Push-Up_Close-Grip` | Incline Push-Up Close-Grip | Nécessite un support surélevé pour les mains |
| `Incline_Push-Up_Medium` | Incline Push-Up Medium | Nécessite un support surélevé pour les mains |
| `Incline_Push-Up_Reverse_Grip` | Incline Push-Up Reverse Grip | Nécessite un support surélevé pour les mains |
| `Incline_Push-Up_Wide` | Incline Push-Up Wide | Nécessite un support surélevé pour les mains |
| `Inverted_Row` | Inverted Row | Nécessite une barre basse ou une table solide |
| `Leg-Up_Hamstring_Stretch` | Leg-Up Hamstring Stretch | Nécessite un support surélevé pour la jambe |
| `Push-Ups_With_Feet_Elevated` | Push-Ups With Feet Elevated | Nécessite un support surélevé pour les pieds |
| `Seated_Flat_Bench_Leg_Pull-In` | Seated Flat Bench Leg Pull-In | Nécessite un banc |
| `Seated_Leg_Tucks` | Seated Leg Tucks | Nécessite un banc |
| `Standing_Towel_Triceps_Extension` | Standing Towel Triceps Extension | Nécessite une serviette tendue en résistance |
| `Step-up_with_Knee_Raise` | Step-up with Knee Raise | Nécessite une marche ou un banc |

### Photos incompatibles avec les consignes (15)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Adductor_Groin` | Adductor/Groin | Photos montrant un étirement assisté par un partenaire, allongé sur le dos |
| `Ankle_Circles` | Ankle Circles | Photos debout alors que notre exercice est assis sans mise en charge |
| `Double_Leg_Butt_Kick` | Double Leg Butt Kick | Photos montrant un saut à deux pieds, différent de nos talons-fesses en course sur place |
| `Flutter_Kicks` | Flutter Kicks | Photos réalisées à plat ventre sur un banc, sans rapport avec des battements allongé sur le dos |
| `Front_Leg_Raises` | Front Leg Raises | Photos réalisées avec appui sur une chaise, incompatible avec notre consigne sans matériel |
| `Hyperextensions_With_No_Hyperextension_Bench` | Hyperextensions With No Hyperextension Bench | Photos réalisées sur un banc avec un partenaire |
| `Lying_Crossover` | Lying Crossover | Photos montrant un étirement assisté par un partenaire |
| `Lying_Prone_Quadriceps` | Lying Prone Quadriceps | Photos montrant un étirement assisté par un partenaire |
| `Middle_Back_Stretch` | Middle Back Stretch | Photos ne correspondant pas à un étirement du milieu du dos |
| `Rear_Leg_Raises` | Rear Leg Raises | Photos réalisées à quatre pattes, redondant avec le coup de pied arrière |
| `Runners_Stretch` | Runner's Stretch | Photos montrant une flexion debout vers les orteils, pas une fente |
| `Side_Leg_Raises` | Side Leg Raises | Photos réalisées avec appui sur une chaise, incompatible avec notre consigne sans matériel |
| `Side_Neck_Stretch` | Side Neck Stretch | Photos debout alors que notre exercice est assis |
| `Standing_Gastrocnemius_Calf_Stretch` | Standing Gastrocnemius Calf Stretch | Photos réalisées avec un pied sur une marche, matériel non disponible |
| `Wrist_Circles` | Wrist Circles | Photos debout alors que notre exercice est assis |

### Partenaire ou ancrage des pieds requis (5)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `3_4_Sit-Up` | 3/4 Sit-Up | Nécessite un ancrage des pieds |
| `Floor_Glute-Ham_Raise` | Floor Glute-Ham Raise | Nécessite un ancrage solide des pieds |
| `Janda_Sit-Up` | Janda Sit-Up | Nécessite un partenaire ou un ancrage des pieds |
| `Natural_Glute_Ham_Raise` | Natural Glute Ham Raise | Nécessite un ancrage solide des pieds |
| `Prone_Manual_Hamstring` | Prone Manual Hamstring | Nécessite un partenaire |

### Barre de traction requise (8)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Chin-Up` | Chin-Up | Nécessite une barre de traction |
| `Gorilla_Chin_Crunch` | Gorilla Chin/Crunch | Nécessite une barre de traction |
| `Hanging_Leg_Raise` | Hanging Leg Raise | Nécessite une barre de traction |
| `Hanging_Pike` | Hanging Pike | Nécessite une barre de traction |
| `Pullups` | Pullups | Nécessite une barre de traction |
| `Scapular_Pull-Up` | Scapular Pull-Up | Nécessite une barre de traction |
| `V-Bar_Pullup` | V-Bar Pullup | Nécessite une barre de traction |
| `Wide-Grip_Rear_Pull-Up` | Wide-Grip Rear Pull-Up | Nécessite une barre de traction |

### Redondant avec un exercice déjà retenu (34)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Bent-Knee_Hip_Raise` | Bent-Knee Hip Raise | Redondant avec le crunch inversé |
| `Calf_Stretch_Elbows_Against_Wall` | Calf Stretch Elbows Against Wall | Redondant avec l'étirement des mollets au mur |
| `Crunch_-_Hands_Overhead` | Crunch - Hands Overhead | Redondant avec le crunch court |
| `Elbow_Circles` | Elbow Circles | Redondant avec les cercles de bras |
| `Elbow_to_Knee` | Elbow to Knee | Redondant avec le crunch croisé |
| `Elbows_Back` | Elbows Back | Redondant avec l'ouverture dynamique de la poitrine |
| `Frog_Sit-Ups` | Frog Sit-Ups | Redondant avec le crunch court |
| `Groin_and_Back_Stretch` | Groin and Back Stretch | Redondant avec l'étirement des adducteurs |
| `Hamstring_Stretch` | Hamstring Stretch | Redondant avec l'étirement des ischio-jambiers assis |
| `Iron_Crosses_stretch` | Iron Crosses (stretch) | Redondant avec la torsion allongée |
| `Knee_Across_The_Body` | Knee Across The Body | Redondant avec l'étirement fessier allongé |
| `Lower_Back_Curl` | Lower Back Curl | Redondant avec les genoux ramenés à la poitrine |
| `Lying_Glute` | Lying Glute | Redondant avec l'étirement fessier allongé |
| `Oblique_Crunches` | Oblique Crunches | Redondant avec le crunch croisé |
| `Oblique_Crunches_-_On_The_Floor` | Oblique Crunches - On The Floor | Redondant avec le crunch croisé |
| `On_Your_Side_Quad_Stretch` | On Your Side Quad Stretch | Redondant avec l'étirement du quadriceps sur le ventre |
| `Overhead_Stretch` | Overhead Stretch | Redondant avec l'étirement vers le haut |
| `Overhead_Triceps` | Overhead Triceps | Redondant avec l'étirement des triceps |
| `Pelvic_Tilt_Into_Bridge` | Pelvic Tilt Into Bridge | Redondant avec la bascule du bassin et le pont fessier |
| `Pushups_Close_and_Wide_Hand_Positions` | Pushups (Close and Wide Hand Positions) | Redondant avec les pompes larges et serrées déjà retenues |
| `Rocket_Jump` | Rocket Jump | Redondant avec le squat sauté |
| `Scissor_Kick` | Scissor Kick | Redondant avec les battements de jambes |
| `Seated_Glute` | Seated Glute | Redondant avec l'étirement fessier assis |
| `Seated_Hamstring` | Seated Hamstring | Redondant avec l'étirement des ischio-jambiers assis |
| `Seated_Overhead_Stretch` | Seated Overhead Stretch | Redondant avec l'étirement vers le haut |
| `Side_Lying_Groin_Stretch` | Side Lying Groin Stretch | Redondant avec l'étirement des adducteurs |
| `Single_Leg_Butt_Kick` | Single Leg Butt Kick | Redondant avec les talons-fesses |
| `Sit-Up` | Sit-Up | Redondant avec le crunch court, et souvent réalisé pieds bloqués |
| `Spinal_Stretch` | Spinal Stretch | Redondant avec l'étirement du milieu du dos |
| `Split_Jump` | Split Jump | Redondant avec le saut en fente alterné |
| `Star_Jump` | Star Jump | Redondant avec le squat sauté |
| `Tricep_Side_Stretch` | Tricep Side Stretch | Redondant avec l'étirement des triceps |
| `Tuck_Crunch` | Tuck Crunch | Redondant avec le crunch inversé |
| `Upper_Back_Stretch` | Upper Back Stretch | Redondant avec l'étirement du milieu du dos |

### Risque jugé trop élevé pour une séance non supervisée (11)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `All_Fours_Quad_Stretch` | All Fours Quad Stretch | Position instable, contrainte sur le genou d'appui |
| `Bottoms_Up` | Bottoms Up | Élévation du bassin jambes tendues, charge sur le bas du dos |
| `Cocoons` | Cocoons | Mouvement dynamique complet, charge sur le bas du dos |
| `Handstand_Push-Ups` | Handstand Push-Ups | Niveau expert, charge importante sur le cou et les épaules |
| `Jackknife_Sit-Up` | Jackknife Sit-Up | Mouvement avancé, charge sur le bas du dos |
| `One_Half_Locust` | One Half Locust | Extension dorsale poussée, peu adaptée au réveil |
| `Plyo_Push-up` | Plyo Push-up | Impact important sur les poignets et les épaules |
| `Seated_Biceps` | Seated Biceps | Appui arrière des mains, contrainte sur les épaules, niveau expert |
| `Seated_Front_Deltoid` | Seated Front Deltoid | Appui arrière des mains, contrainte sur les épaules, niveau expert |
| `Standing_Toe_Touches` | Standing Toe Touches | Flexion balistique vers les orteils, contrainte lombaire |
| `Toe_Touchers` | Toe Touchers | Flexion balistique vers les orteils, contrainte lombaire |

### Espace ou distance insuffisants (13)

| Identifiant source | Nom | Motif |
| --- | --- | --- |
| `Alternate_Leg_Diagonal_Bound` | Alternate Leg Diagonal Bound | Bonds en diagonale, demande une grande longueur |
| `Bodyweight_Walking_Lunge` | Bodyweight Walking Lunge | Fentes marchées, demande une grande longueur |
| `Carioca_Quick_Step` | Carioca Quick Step | Déplacement latéral rapide sur plusieurs mètres |
| `Frog_Hops` | Frog Hops | Sauts groupés vers l'avant, demande une grande longueur |
| `Lateral_Bound` | Lateral Bound | Bond latéral ample, demande une grande largeur |
| `Linear_3-Part_Start_Technique` | Linear 3-Part Start Technique | Technique de départ sprinté, demande une piste |
| `Linear_Acceleration_Wall_Drill` | Linear Acceleration Wall Drill | Éducatif d'accélération, technique et encombrant |
| `Moving_Claw_Series` | Moving Claw Series | Éducatif de course en déplacement |
| `Side_Standing_Long_Jump` | Side Standing Long Jump | Saut en longueur latéral, demande une grande largeur |
| `Spider_Crawl` | Spider Crawl | Déplacement au sol sur plusieurs mètres |
| `Standing_Long_Jump` | Standing Long Jump | Saut en longueur, demande une grande longueur |
| `Trail_Running_Walking` | Trail Running/Walking | Course ou marche sur longue distance, en extérieur |
| `Wind_Sprints` | Wind Sprints | Sprints répétés, demande une grande distance |

## Doublons détectés et fusionnés

19 exercices de la source décrivaient un mouvement déjà présent dans
BodyTrain. Ils n'ont pas créé de nouvel exercice : le contenu français et les métadonnées
adaptatives ont été conservés, la source apporte ses photos, son nom anglais, ses consignes
originales et sa catégorie.

| Exercice BodyTrain | Identifiant source fusionné |
| --- | --- |
| `cercles-de-hanche-debout` | `Standing_Hip_Circles` |
| `cercles-des-epaules` | `Shoulder_Circles` |
| `chat-vache` | `Cat_Stretch` |
| `coup-de-pied-arriere-quadrupedie` | `Glute_Kickback` |
| `crunch-court` | `Crunches` |
| `dead-bug` | `Dead_Bug` |
| `etirement-des-ischio-jambiers-assis` | `Seated_Floor_Hamstring_Stretch` |
| `etirement-du-psoas-en-fente` | `Kneeling_Hip_Flexor` |
| `gainage-avant-bras` | `Plank` |
| `genou-poitrine-allonge` | `One_Knee_To_Chest` |
| `haussements-d-epaules` | `Shoulder_Raise` |
| `inclinaison-laterale-debout` | `Standing_Lateral_Stretch` |
| `mobilite-cervicale-avant-arriere` | `Chin_To_Chest_Stretch` |
| `montagnards` | `Mountain_Climbers` |
| `pompes-classiques` | `Pushups` |
| `pont-fessier` | `Butt_Lift_Bridge` |
| `pont-fessier-une-jambe` | `Single_Leg_Glute_Bridge` |
| `posture-de-l-enfant` | `Childs_Pose` |
| `squat-au-poids-du-corps` | `Bodyweight_Squat` |

## Médias

| Indicateur | Valeur |
| --- | ---: |
| Exercices avec deux photos distinctes | 63 |
| Exercices avec une seule photo utile | 3 |
| Fichiers WebP servis localement | 129 |

### Paires d'images identiques

Ces exercices n'ont qu'une seule position illustrée : la seconde photo de la source était
strictement identique à la première. Le doublon n'est pas enregistré.

- `etirement-des-ischio-jambiers-assis`
- `etirement-du-grand-dorsal-au-mur`
- `ouverture-assise-jambes-ecartees`

### Consignes originales absentes

Ces exercices n'ont aucune consigne dans la source. Leur texte français s'appuie uniquement sur les deux photos, et ils sont marqués `review_required` :

- `elevation-laterale-du-buste` (source `Side_Jackknife`)
- `gainage-lateral-complet` (source `Side_Bridge`)

## Erreurs rencontrées

Aucune anomalie bloquante. Le pipeline est idempotent : une seconde exécution sur la même source ne réécrit aucune image et produit des exports identiques.
