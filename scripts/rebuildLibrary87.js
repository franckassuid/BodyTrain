import fs from 'node:fs';
import path from 'node:path';

// 87 Exercises specified by the user
const USER_87 = [
  { id: "respiration-4-6", slug: "respiration-4-6", nameFr: "Respiration 4-6", gif: "respiration-4-6.gif" },
  { id: "respiration-diaphragmatique-allongee", slug: "respiration-diaphragmatique-allongee", nameFr: "Respiration diaphragmatique allongée", gif: "respiration-diaphragmatique-allongee.gif" },
  { id: "respiration-diaphragmatique-assise", slug: "respiration-diaphragmatique-assise", nameFr: "Respiration diaphragmatique assise", gif: "respiration-diaphragmatique-assise.gif" },
  { id: "soupir-physiologique", slug: "soupir-physiologique", nameFr: "Soupir physiologique", gif: "soupir-physiologique.gif" },
  { id: "inclinaison-laterale-du-cou", slug: "inclinaison-laterale-du-cou", nameFr: "Inclinaison latérale du cou", gif: "inclinaison-laterale-du-cou.gif" },
  { id: "mobilite-cervicale-avant-arriere", slug: "mobilite-cervicale-avant-arriere", nameFr: "Mobilité cervicale avant-arrière", gif: "mobilite-cervicale-avant-arriere.gif" },
  { id: "rotation-du-cou", slug: "rotation-du-cou", nameFr: "Rotation du cou", gif: "rotation-du-cou.gif" },
  { id: "cercles-des-epaules", slug: "cercles-des-epaules", nameFr: "Cercles des épaules", gif: "cercles-des-epaules.gif" },
  { id: "cercles-de-bras", slug: "cercles-de-bras", nameFr: "Cercles de bras", gif: "cercles-de-bras.gif" },
  { id: "mobilite-des-omoplates", slug: "mobilite-des-omoplates", nameFr: "Mobilité des omoplates", gif: "mobilite-des-omoplates.gif" },
  { id: "ouverture-dynamique-de-la-poitrine", slug: "ouverture-dynamique-de-la-poitrine", nameFr: "Ouverture dynamique de la poitrine", gif: "ouverture-dynamique-de-la-poitrine.gif" },
  { id: "chat-vache", slug: "chat-vache", nameFr: "Chat-vache", gif: "chat-vache.gif" },
  { id: "chat-vache-assis", slug: "chat-vache-assis", nameFr: "Chat-vache assis", gif: "chat-vache-assis.gif" },
  { id: "deroule-vertebral-debout", slug: "deroule-vertebral-debout", nameFr: "Déroulé vertébral debout", gif: "deroule-vertebral-debout.gif" },
  { id: "inclinaison-laterale-debout", slug: "inclinaison-laterale-debout", nameFr: "Inclinaison latérale debout", gif: "inclinaison-laterale-debout.gif" },
  { id: "rotation-thoracique-allongee", slug: "rotation-thoracique-allongee", nameFr: "Rotation thoracique allongée", gif: "rotation-thoracique-allongee.gif" },
  { id: "essorage-du-tronc", slug: "essorage-du-tronc", nameFr: "Essorage du tronc", gif: "essorage-du-tronc.gif" },
  { id: "extension-dorsale-au-sol", slug: "extension-dorsale-au-sol", nameFr: "Extension dorsale au sol", gif: "extension-dorsale-au-sol.gif" },
  { id: "bascule-du-bassin-allongee", slug: "bascule-du-bassin-allongee", nameFr: "Bascule du bassin allongée", gif: "bascule-du-bassin-allongee.gif" },
  { id: "bascule-du-bassin-debout", slug: "bascule-du-bassin-debout", nameFr: "Bascule du bassin debout", gif: "bascule-du-bassin-debout.gif" },
  { id: "cercles-de-cheville-assis", slug: "cercles-de-cheville-assis", nameFr: "Cercles de cheville assis", gif: "cercles-de-cheville-assis.gif" },
  { id: "flexion-extension-de-cheville-assis", slug: "flexion-extension-de-cheville-assis", nameFr: "Flexion-extension de cheville", gif: "flexion-extension-de-cheville-assis.gif" },
  { id: "balancement-de-jambe-avant-arriere", slug: "balancement-de-jambe-avant-arriere", nameFr: "Balancement de jambe avant-arrière", gif: "balancement-de-jambe-avant-arriere.gif" },
  { id: "balancement-de-jambe-lateral", slug: "balancement-de-jambe-lateral", nameFr: "Balancement de jambe latéral", gif: "balancement-de-jambe-lateral.gif" },
  { id: "ouverture-de-hanche-en-appui", slug: "ouverture-de-hanche-en-appui", nameFr: "Ouverture de hanche en appui", gif: "ouverture-de-hanche-en-appui.gif" },
  { id: "position-90-90-assis", slug: "position-90-90-assis", nameFr: "Position 90-90 assise", gif: "position-90-90-assis.gif" },
  { id: "glissement-de-talon-allonge", slug: "glissement-de-talon-allonge", nameFr: "Glissement de talon allongé", gif: "glissement-de-talon-allonge.gif" },
  { id: "reveil-articulaire-debout", slug: "reveil-articulaire-debout", nameFr: "Réveil articulaire debout", gif: "reveil-articulaire-debout.gif" },
  { id: "enchainement-mobilite-debout", slug: "enchainement-mobilite-debout", nameFr: "Enchaînement mobilité debout", gif: "enchainement-mobilite-debout.gif" },
  { id: "tapotements-corps-debout", slug: "tapotements-corps-debout", nameFr: "Tapotements du corps debout", gif: "tapotements-corps-debout.gif" },
  { id: "balancement-lateral-debout", slug: "balancement-lateral-debout", nameFr: "Balancement latéral debout", gif: "balancement-lateral-debout.gif" },
  { id: "marche-sur-place", slug: "marche-sur-place", nameFr: "Marche sur place", gif: "marche-sur-place.gif" },
  { id: "marche-talon-pointe", slug: "marche-talon-pointe", nameFr: "Marche talon-pointe", gif: "marche-talon-pointe.gif" },
  { id: "pas-lateraux-sur-place", slug: "pas-lateraux-sur-place", nameFr: "Pas latéraux sur place", gif: "pas-lateraux-sur-place.gif" },
  { id: "montees-de-genoux-controlees", slug: "montees-de-genoux-controlees", nameFr: "Montées de genoux contrôlées", gif: "montees-de-genoux-controlees.gif" },
  { id: "talons-fesses", slug: "talons-fesses", nameFr: "Talons-fesses", gif: "talons-fesses.gif" },
  { id: "jumping-jacks-sans-saut", slug: "jumping-jacks-sans-saut", nameFr: "Jumping jacks sans saut", gif: "jumping-jacks-sans-saut.gif" },
  { id: "coordination-croisee-debout", slug: "coordination-croisee-debout", nameFr: "Coordination croisée debout", gif: "coordination-croisee-debout.gif" },
  { id: "coordination-bras-jambe-croisee", slug: "coordination-bras-jambe-croisee", nameFr: "Coordination bras-jambe croisée", gif: "coordination-bras-jambe-croisee.gif" },
  { id: "dead-bug", slug: "dead-bug", nameFr: "Dead bug", gif: "dead-bug.gif" },
  { id: "gainage-genoux-au-sol", slug: "gainage-genoux-au-sol", nameFr: "Gainage genoux au sol", gif: "gainage-genoux-au-sol.gif" },
  { id: "gainage-avant-bras", slug: "gainage-avant-bras", nameFr: "Gainage avant-bras", gif: "gainage-avant-bras.gif" },
  { id: "gainage-lateral-genoux-flechis", slug: "gainage-lateral-genoux-flechis", nameFr: "Gainage latéral genoux fléchis", gif: "gainage-lateral-genoux-flechis.gif" },
  { id: "crunch-court", slug: "crunch-court", nameFr: "Crunch court", gif: "crunch-court.gif" },
  { id: "ramene-de-genoux-allonge", slug: "ramene-de-genoux-allonge", nameFr: "Ramener les genoux allongé", gif: "ramene-de-genoux-allonge.gif" },
  { id: "montagnards", slug: "montagnards", nameFr: "Montagnards", gif: "montagnards.gif" },
  { id: "pont-fessier", slug: "pont-fessier", nameFr: "Pont fessier", gif: "pont-fessier.gif" },
  { id: "coquillage-sur-le-cote", slug: "coquillage-sur-le-cote", nameFr: "Coquillage sur le côté", gif: "coquillage-sur-le-cote.gif" },
  { id: "abduction-de-hanche-sur-le-cote", slug: "abduction-de-hanche-sur-le-cote", nameFr: "Abduction de hanche sur le côté", gif: "abduction-de-hanche-sur-le-cote.gif" },
  { id: "coup-de-pied-arriere-quadrupedie", slug: "coup-de-pied-arriere-quadrupedie", nameFr: "Coup de pied arrière en quadrupédie", gif: "coup-de-pied-arriere-quadrupedie.gif" },
  { id: "bras-jambe-opposes-quadrupedie", slug: "bras-jambe-opposes-quadrupedie", nameFr: "Bras-jambe opposés (Bird Dog)", gif: "bras-jambe-opposes-quadrupedie.gif" },
  { id: "superman-au-sol", slug: "superman-au-sol", nameFr: "Superman au sol", gif: "superman-au-sol.gif" },
  { id: "retractions-scapulaires-au-sol", slug: "retractions-scapulaires-au-sol", nameFr: "Rétractions scapulaires au sol", gif: "retractions-scapulaires-au-sol.gif" },
  { id: "bon-matin-au-poids-du-corps", slug: "bon-matin-au-poids-du-corps", nameFr: "Bon matin au poids du corps", gif: "bon-matin-au-poids-du-corps.gif" },
  { id: "chenille", slug: "chenille", nameFr: "Chenille (Inchworm)", gif: "chenille.gif" },
  { id: "pression-des-paumes", slug: "pression-des-paumes", nameFr: "Pression des paumes", gif: "pression-des-paumes.gif" },
  { id: "pompes-scapulaires-genoux-au-sol", slug: "pompes-scapulaires-genoux-au-sol", nameFr: "Pompes scapulaires genoux au sol", gif: "pompes-scapulaires-genoux-au-sol.gif" },
  { id: "pompes-genoux-au-sol", slug: "pompes-genoux-au-sol", nameFr: "Pompes genoux au sol", gif: "pompes-genoux-au-sol.gif" },
  { id: "pompes-classiques", slug: "pompes-classiques", nameFr: "Pompes classiques", gif: "pompes-classiques.gif" },
  { id: "tape-epaules-en-gainage", slug: "tape-epaules-en-gainage", nameFr: "Tape-épaules en gainage", gif: "tape-epaules-en-gainage.gif" },
  { id: "gainage-monte-descente", slug: "gainage-monte-descente", nameFr: "Gainage monté-descendu", gif: "gainage-monte-descente.gif" },
  { id: "montees-sur-pointes", slug: "montees-sur-pointes", nameFr: "Montées sur pointes de pieds", gif: "montees-sur-pointes.gif" },
  { id: "mini-flexions-de-genoux", slug: "mini-flexions-de-genoux", nameFr: "Mini-flexions de genoux", gif: "mini-flexions-de-genoux.gif" },
  { id: "squat-partiel", slug: "squat-partiel", nameFr: "Squat partiel", gif: "squat-partiel.gif" },
  { id: "squat-au-poids-du-corps", slug: "squat-au-poids-du-corps", nameFr: "Squat au poids du corps", gif: "squat-au-poids-du-corps.gif" },
  { id: "squat-maintenu", slug: "squat-maintenu", nameFr: "Squat maintenu au mur", gif: "squat-maintenu.gif" },
  { id: "fente-statique", slug: "fente-statique", nameFr: "Fente statique", gif: "fente-statique.gif" },
  { id: "fente-arriere-alternee", slug: "fente-arriere-alternee", nameFr: "Fente arrière alternée", gif: "fente-arriere-alternee.gif" },
  { id: "fente-laterale", slug: "fente-laterale", nameFr: "Fente latérale", gif: "fente-laterale.gif" },
  { id: "squat-saute", slug: "squat-saute", nameFr: "Squat sauté", gif: "squat-saute.gif" },
  { id: "jumping-jacks", slug: "jumping-jacks", nameFr: "Jumping jacks", gif: "jumping-jacks.gif" },
  { id: "equilibre-sur-un-pied", slug: "equilibre-sur-un-pied", nameFr: "Équilibre sur un pied", gif: "equilibre-sur-un-pied.gif" },
  { id: "equilibre-en-tandem", slug: "equilibre-en-tandem", nameFr: "Équilibre en tandem", gif: "equilibre-en-tandem.gif" },
  { id: "posture-de-l-enfant", slug: "posture-de-l-enfant", nameFr: "Posture de l’enfant", gif: "posture-de-l-enfant.gif" },
  { id: "etirement-vers-le-haut", slug: "etirement-vers-le-haut", nameFr: "Étirement vers le haut", gif: "etirement-vers-le-haut.gif" },
  { id: "etirement-de-l-epaule", slug: "etirement-de-l-epaule", nameFr: "Étirement de l’épaule", gif: "etirement-de-l-epaule.gif" },
  { id: "etirement-des-trapezes-assis", slug: "etirement-des-trapezes-assis", nameFr: "Étirement des trapèzes assis", gif: "etirement-des-trapezes-assis.gif" },
  { id: "etirement-du-grand-dorsal-au-mur", slug: "etirement-du-grand-dorsal-au-mur", nameFr: "Étirement du grand dorsal au mur", gif: "etirement-du-grand-dorsal-au-mur.gif" },
  { id: "ischio-jambiers-allonge", slug: "ischio-jambiers-allonge", nameFr: "Ischio-jambiers allongé", gif: "ischio-jambiers-allonge.gif" },
  { id: "etirement-du-quadriceps-debout", slug: "etirement-du-quadriceps-debout", nameFr: "Étirement du quadriceps debout", gif: "etirement-du-quadriceps-debout.gif" },
  { id: "etirement-des-flechisseurs-debout", slug: "etirement-des-flechisseurs-debout", nameFr: "Étirement des fléchisseurs de hanche debout", gif: "etirement-des-flechisseurs-debout.gif" },
  { id: "etirement-des-mollets-au-mur", slug: "etirement-des-mollets-au-mur", nameFr: "Étirement des mollets au mur", gif: "etirement-des-mollets-au-mur.gif" },
  { id: "mobilite-complete-des-poignets", slug: "mobilite-complete-des-poignets", nameFr: "Mobilité complète des poignets", gif: "mobilite-complete-des-poignets.gif" },
  { id: "flexion-extension-genou-debout", slug: "flexion-extension-genou-debout", nameFr: "Flexion-extension du genou debout avec appui", gif: "flexion-extension-genou-debout.gif" },
  { id: "pompes-contre-un-mur", slug: "pompes-contre-un-mur", nameFr: "Pompes contre un mur", gif: "pompes-contre-un-mur.gif" },
  { id: "glissement-bras-contre-mur", slug: "glissement-bras-contre-mur", nameFr: "Glissement des bras contre un mur", gif: "glissement-bras-contre-mur.gif" },
  { id: "equilibre-touches-pied-etoile", slug: "equilibre-touches-pied-etoile", nameFr: "Équilibre avec touches du pied en étoile", gif: "equilibre-touches-pied-etoile.gif" }
];

const existingExercises = JSON.parse(fs.readFileSync(path.resolve("files/exercises.json"), "utf-8"));
const existingMap = new Map();
existingExercises.forEach(e => {
  existingMap.set(e.id, e);
  existingMap.set(e.slug, e);
});

// Definitions for the 5 newly added exercises
const NEW_EXERCISES_DATA = {
  "mobilite-complete-des-poignets": {
    category: "shoulder_mobility",
    shortDescriptionFr: "Cercles et étirements doux des poignets pour déverrouiller l'articulation.",
    instructionsFr: [
      "Joins les mains paume contre paume devant la poitrine.",
      "Effectue des rotations fluides dans un sens, puis dans l'autre sans forcer.",
      "Secoue délicatement les mains pour détendre complètement les articulations."
    ],
    generalPrecautionsFr: ["Effectuer des cercles doux sans à-coups."],
    stopSignalsFr: ["Douleur vive ou engourdissement dans les doigts."],
    alternativeExerciseIds: ["cercles-des-epaules", "ouverture-dynamique-de-la-poitrine"],
    breathingGuidanceFr: "Respiration fluide et naturelle tout au long des rotations.",
    tags: ["poignets", "mobilite", "debout", "assis", "sans-saut"],
    mode: "timed",
    defaultDurationSeconds: 40,
    restAfterSeconds: 10,
    difficulty: "easy",
    minimumEnergy: "low",
    maximumEnergy: "high",
    intensity: 1,
    impactLevel: "none",
    positions: ["standing", "seated"],
    primaryBodyAreas: ["wrists", "forearms"],
    secondaryBodyAreas: ["shoulders"],
    fatigueAreas: ["wrists", "forearms"],
    jointsUsed: ["wrist"],
    requiresUpperBody: true,
    requiresLowerBody: false,
    requiresArmSupport: false,
    requiresWristSupport: false,
    requiresKneeSupport: false,
    requiresFloorTransition: false,
    unilateral: false,
    jumping: false,
    enabled: true,
    compatibleWithUpperBodyDiscomfort: true,
    compatibleWithLowerBodyDiscomfort: true,
    suitableForGentleSession: true,
    suitableForWarmup: true,
    suitableForMainPhase: false,
    suitableForCooldown: true,
  },
  "flexion-extension-genou-debout": {
    category: "knee_mobility",
    shortDescriptionFr: "Debout avec appui, flexion et extension contrôlées du genou.",
    instructionsFr: [
      "Debout, prends appui avec une main contre un mur ou une chaise.",
      "Plie le genou vers l'arrière en amenant le talon vers la fesse.",
      "Déplie lentement la jambe sans la verrouiller, puis change de côté à mi-parcours."
    ],
    generalPrecautionsFr: ["Garder le bassin stable et le dos droit."],
    stopSignalsFr: ["Tension ou douleur dans l'articulation du genou."],
    alternativeExerciseIds: ["mini-flexions-de-genoux", "talons-fesses"],
    breathingGuidanceFr: "Expire en pliant le genou, inspire en redescendant la jambe.",
    tags: ["genoux", "mobilite", "debout", "unilateral", "sans-saut"],
    mode: "timed",
    defaultDurationSeconds: 45,
    restAfterSeconds: 10,
    difficulty: "easy",
    minimumEnergy: "low",
    maximumEnergy: "high",
    intensity: 1,
    impactLevel: "none",
    positions: ["standing"],
    primaryBodyAreas: ["quadriceps", "hamstrings"],
    secondaryBodyAreas: ["calves"],
    fatigueAreas: ["quadriceps", "hamstrings"],
    jointsUsed: ["knee", "hip"],
    requiresUpperBody: false,
    requiresLowerBody: true,
    requiresArmSupport: false,
    requiresWristSupport: false,
    requiresKneeSupport: false,
    requiresFloorTransition: false,
    unilateral: true,
    jumping: false,
    enabled: true,
    compatibleWithUpperBodyDiscomfort: true,
    compatibleWithLowerBodyDiscomfort: true,
    suitableForGentleSession: true,
    suitableForWarmup: true,
    suitableForMainPhase: false,
    suitableForCooldown: true,
  },
  "pompes-contre-un-mur": {
    category: "upper_body_strength",
    shortDescriptionFr: "Pompes douces réalisées debout en appui sur un mur.",
    instructionsFr: [
      "Place-toi face au mur à environ un pas, mains à hauteur et largeur d'épaules.",
      "Fléchis les coudes pour rapprocher la poitrine du mur en maintenant le corps aligné.",
      "Pousse doucement sur les paumes pour revenir en position initiale."
    ],
    generalPrecautionsFr: ["Maintenir la sangle abdominale engagée."],
    stopSignalsFr: ["Douleur dans les épaules ou les poignets."],
    alternativeExerciseIds: ["pompes-scapulaires-genoux-au-sol", "pression-des-paumes"],
    breathingGuidanceFr: "Inspire en te rapprochant du mur, expire en repoussant.",
    tags: ["haut-du-corps", "pompes", "mur", "debout", "sans-saut"],
    mode: "timed",
    defaultDurationSeconds: 40,
    restAfterSeconds: 15,
    difficulty: "easy",
    minimumEnergy: "low",
    maximumEnergy: "high",
    intensity: 2,
    impactLevel: "none",
    positions: ["standing"],
    primaryBodyAreas: ["chest", "shoulders", "triceps"],
    secondaryBodyAreas: ["deep_core"],
    fatigueAreas: ["chest", "triceps", "shoulders"],
    jointsUsed: ["shoulder", "elbow", "wrist"],
    requiresUpperBody: true,
    requiresLowerBody: false,
    requiresArmSupport: true,
    requiresWristSupport: true,
    requiresKneeSupport: false,
    requiresWall: true,
    requiresFloorTransition: false,
    unilateral: false,
    jumping: false,
    enabled: true,
    compatibleWithUpperBodyDiscomfort: false,
    compatibleWithLowerBodyDiscomfort: true,
    suitableForGentleSession: true,
    suitableForWarmup: true,
    suitableForMainPhase: true,
    suitableForCooldown: false,
  },
  "glissement-bras-contre-mur": {
    category: "shoulder_mobility",
    shortDescriptionFr: "Glissement des avant-bras contre le mur pour ouvrir la cage et mobiliser les épaules.",
    instructionsFr: [
      "Dos au mur, place les coudes et le dos des mains en contact avec la paroi.",
      "Fais glisser les bras vers le haut le long du mur sans creuser le bas du dos.",
      "Redescends lentement jusqu'à la position initiale en gardant le contact."
    ],
    generalPrecautionsFr: ["Ne pas forcer sur l'amplitude si les bras décollent."],
    stopSignalsFr: ["Pincement ou douleur dans le haut de l'épaule."],
    alternativeExerciseIds: ["ouverture-dynamique-de-la-poitrine", "cercles-des-epaules"],
    breathingGuidanceFr: "Inspire en montant les bras, expire en redescendant.",
    tags: ["epaules", "posture", "mur", "debout", "sans-saut"],
    mode: "timed",
    defaultDurationSeconds: 40,
    restAfterSeconds: 10,
    difficulty: "easy",
    minimumEnergy: "low",
    maximumEnergy: "high",
    intensity: 2,
    impactLevel: "none",
    positions: ["standing"],
    primaryBodyAreas: ["shoulders", "upper_back"],
    secondaryBodyAreas: ["chest"],
    fatigueAreas: ["shoulders", "upper_back"],
    jointsUsed: ["shoulder"],
    requiresUpperBody: true,
    requiresLowerBody: false,
    requiresArmSupport: false,
    requiresWristSupport: false,
    requiresKneeSupport: false,
    requiresWall: true,
    requiresFloorTransition: false,
    unilateral: false,
    jumping: false,
    enabled: true,
    compatibleWithUpperBodyDiscomfort: false,
    compatibleWithLowerBodyDiscomfort: true,
    suitableForGentleSession: true,
    suitableForWarmup: true,
    suitableForMainPhase: false,
    suitableForCooldown: true,
  },
  "equilibre-touches-pied-etoile": {
    category: "balance",
    shortDescriptionFr: "En appui sur un pied, pointe l'autre pied dans plusieurs directions en étoile.",
    instructionsFr: [
      "Tiens-toi sur une jambe légèrement fléchie, tronc bien gainé.",
      "Touche délicatement le sol avec l'autre pied : devant, sur le côté, puis derrière.",
      "Maintiens l'équilibre sans poser tout ton poids, puis change de jambe à mi-parcours."
    ],
    generalPrecautionsFr: ["Garder un mur ou support à proximité pour la sécurité."],
    stopSignalsFr: ["Perte d'équilibre brutale ou douleur à la cheville."],
    alternativeExerciseIds: ["equilibre-sur-un-pied", "equilibre-en-tandem"],
    breathingGuidanceFr: "Respiration calme et rythmée, regarde un point fixe devant toi.",
    tags: ["equilibre", "chevilles", "debout", "unilateral", "sans-saut"],
    mode: "timed",
    defaultDurationSeconds: 45,
    restAfterSeconds: 10,
    difficulty: "medium",
    minimumEnergy: "low",
    maximumEnergy: "high",
    intensity: 2,
    impactLevel: "none",
    positions: ["standing"],
    primaryBodyAreas: ["ankles", "calves", "quadriceps"],
    secondaryBodyAreas: ["glutes", "deep_core"],
    fatigueAreas: ["ankles", "calves", "quadriceps"],
    jointsUsed: ["ankle", "knee", "hip"],
    requiresUpperBody: false,
    requiresLowerBody: true,
    requiresArmSupport: false,
    requiresWristSupport: false,
    requiresKneeSupport: false,
    requiresFloorTransition: false,
    unilateral: true,
    jumping: false,
    balanceRequired: true,
    enabled: true,
    compatibleWithUpperBodyDiscomfort: true,
    compatibleWithLowerBodyDiscomfort: false,
    suitableForGentleSession: true,
    suitableForWarmup: true,
    suitableForMainPhase: true,
    suitableForCooldown: false,
  }
};

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
    if ((e.category === 'gentle_cardio' || e.category === 'balance') && e.intensity <= 2) {
      phases.add('finish');
    }
  }
  if (e.category === 'light_stretching' || e.category === 'cooldown') {
    phases.add('finish');
    if (e.intensity <= 2) phases.add('mobility');
  }
  if (e.suitableForWarmup && e.intensity <= 2 && phases.size === 0) {
    phases.add('wakeup');
  }
  if (e.suitableForWarmup && e.intensity <= 3 && !phases.has('wakeup') && !phases.has('activation')) {
    phases.add('mobility');
  }
  if (e.suitableForCooldown && e.intensity <= 2) {
    phases.add('finish');
  }
  if (e.intensity >= 4 || e.jumping) {
    phases.delete('wakeup');
  }
  if (e.intensity >= 4) {
    phases.delete('finish');
  }
  return Array.from(phases);
}

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

  // Flexion/Extension
  if (allText.includes('flexion') || allText.includes('extension') ||
      allText.includes('deroule') || allText.includes('chat-vache') ||
      allText.includes('genou-poitrine') || allText.includes('bascule')) {
    patterns.add('flexion_extension');
  }
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
      allText.includes('crunch') || allText.includes('abdomin') ||
      allText.includes('pont-fessier') || allText.includes('coquillage') ||
      allText.includes('abduction')) {
    patterns.add('core_stability');
  }

  // Balance
  if (e.balanceRequired || e.category === 'balance' ||
      allText.includes('equilibre') || allText.includes('tandem')) {
    patterns.add('balance');
  }

  // Locomotion
  if (allText.includes('marche') || allText.includes('pas-') ||
      (allText.includes('talon') && allText.includes('pointe')) ||
      allText.includes('montee') || allText.includes('course') ||
      e.category === 'gentle_cardio' || e.category === 'dynamic_cardio') {
    if (allText.includes('marche') || allText.includes('pas-') ||
        allText.includes('montee-de-genoux') || allText.includes('talon-pointe') ||
        allText.includes('talons-fesses') || allText.includes('jumping-jacks') ||
        allText.includes('montagnard') || allText.includes('coordination')) {
      patterns.add('locomotion');
    }
  }

  // Jump
  if (e.jumping) {
    patterns.add('jump');
  }

  // Stretch
  if (e.category === 'light_stretching' || e.category === 'cooldown' ||
      allText.includes('etirement') || allText.includes('stretch') ||
      allText.includes('posture-de-l-enfant') || allText.includes('ischio') ||
      allText.includes('quadriceps') || allText.includes('mollet')) {
    patterns.add('stretch');
  }

  // Back strength
  if (e.category === 'back_strength' && !patterns.has('hinge')) {
    if (allText.includes('extension') || allText.includes('superman') || allText.includes('nage')) {
      patterns.add('flexion_extension');
    }
  }

  if (patterns.size === 0) patterns.add('posture');
  return Array.from(patterns);
}

// Build the final 87 exercises array
const finalExercises = USER_87.map(item => {
  let base = NEW_EXERCISES_DATA[item.slug] || existingMap.get(item.id) || existingMap.get(item.slug);

  if (!base) {
    throw new Error(`Exercise ${item.slug} not found in database or new data!`);
  }

  const ex = {
    ...base,
    id: item.slug,
    slug: item.slug,
    nameFr: item.nameFr,
    enabled: true,
    fatigueAreas: base.fatigueAreas || base.primaryBodyAreas || ["deep_core"],
    media: [
      {
        id: `${item.slug}-anim`,
        type: "animation",
        format: "gif",
        localPath: `/animations/${item.gif}`
      }
    ]
  };

  ex.suitablePhases = deriveSuitablePhases(ex);
  ex.movementPatterns = deriveMovementPatterns(ex);

  return ex;
});

console.log(`Successfully built ${finalExercises.length} exercises.`);

// Write files/exercises.json
fs.writeFileSync(path.resolve("files/exercises.json"), JSON.stringify(finalExercises, null, 2), "utf-8");
console.log("Updated files/exercises.json");

// Write src/data/exercisesData.ts
const tsContent = `// Auto-generated exercise dataset (87 active curated exercises with GIF animations). Do not edit manually.
import type { Exercise } from '../types/exercise.ts';

export const EXERCISES: Exercise[] = ${JSON.stringify(finalExercises, null, 2)};

export const EXERCISES_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e])
);
`;

fs.writeFileSync(path.resolve("src/data/exercisesData.ts"), tsContent, "utf-8");
console.log("Updated src/data/exercisesData.ts");
