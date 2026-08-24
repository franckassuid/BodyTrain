import type {
  BodyArea,
  Category,
  Difficulty,
  EnergyLevel,
  ExerciseMode,
  ImpactLevel,
  Joint,
  Position,
} from "../domain/enums.v2.js";

/** A source exercise kept for BodyTrain, with its French content and metadata. */
export interface CuratedEntry {
  slug: string;
  nameFr: string;
  shortDescriptionFr: string;
  instructionsFr: string[];
  breathingGuidanceFr?: string;

  category: Category;
  mode: ExerciseMode;
  durationSeconds?: number;
  repetitions?: number;
  rest?: number;

  difficulty: Difficulty;
  minEnergy: EnergyLevel;
  maxEnergy: EnergyLevel;
  intensity: number;
  impact: ImpactLevel;

  positions: Position[];
  primary: BodyArea[];
  secondary?: BodyArea[];
  joints: Joint[];

  upperBody: boolean;
  lowerBody: boolean;
  armSupport?: boolean;
  wristSupport?: boolean;
  kneeSupport?: boolean;
  wall?: boolean;
  unilateral?: boolean;
  jumping?: boolean;
  balance?: boolean;

  gentle?: boolean;
  warmup?: boolean;
  main?: boolean;
  cooldown?: boolean;

  precautions: string[];
  extraStopSignals?: string[];
  tags: string[];

  easierVariantId?: string;
  harderVariantId?: string;
  alternatives?: string[];

  /** Anything uncertain. A non-empty list forces quality.status = review_required. */
  review?: string[];
}

/**
 * Source exercises merged into an existing BodyTrain exercise. The French
 * content and adaptive metadata of the custom exercise win; the source brings
 * its two photos, its English name, its original instructions and its category.
 */
export const MERGES: Record<string, string> = {
  Crunches: "crunch-court",
  Dead_Bug: "dead-bug",
  Plank: "gainage-avant-bras",
  Pushups: "pompes-classiques",
  Bodyweight_Squat: "squat-au-poids-du-corps",
  Butt_Lift_Bridge: "pont-fessier",
  Single_Leg_Glute_Bridge: "pont-fessier-une-jambe",
  Glute_Kickback: "coup-de-pied-arriere-quadrupedie",
  Mountain_Climbers: "montagnards",
  Cat_Stretch: "chat-vache",
  Childs_Pose: "posture-de-l-enfant",
  One_Knee_To_Chest: "genou-poitrine-allonge",
  Kneeling_Hip_Flexor: "etirement-du-psoas-en-fente",
  Seated_Floor_Hamstring_Stretch: "etirement-des-ischio-jambiers-assis",
  Standing_Hip_Circles: "cercles-de-hanche-debout",
  Shoulder_Circles: "cercles-des-epaules",
  Shoulder_Raise: "haussements-d-epaules",
  Chin_To_Chest_Stretch: "mobilite-cervicale-avant-arriere",
  Standing_Lateral_Stretch: "inclinaison-laterale-debout",
};

/** Rejection rules applied before any manual decision, in order. */
export const EQUIPMENT_REJECTIONS: Record<string, string> = {
  barbell: "Nécessite une barre",
  dumbbell: "Nécessite des haltères",
  kettlebells: "Nécessite une kettlebell",
  cable: "Nécessite une machine à poulies",
  machine: "Nécessite une machine",
  bands: "Nécessite des élastiques",
  "medicine ball": "Nécessite un medicine ball",
  "exercise ball": "Nécessite un ballon de gym",
  "foam roll": "Nécessite un rouleau de massage",
  "e-z curl bar": "Nécessite une barre EZ",
  other: "Nécessite du matériel non disponible à la maison",
};

/**
 * Manual decisions for the equipment-free candidates that BodyTrain does not
 * keep. Every one of the 188 candidates is either curated, merged or listed here.
 */
export const MANUAL_REJECTIONS: Record<string, { reason: string; rule: string }> = {
  // Space and outdoor requirements
  Trail_Running_Walking: { reason: "Course ou marche sur longue distance, en extérieur", rule: "space" },
  Wind_Sprints: { reason: "Sprints répétés, demande une grande distance", rule: "space" },
  Carioca_Quick_Step: { reason: "Déplacement latéral rapide sur plusieurs mètres", rule: "space" },
  Lateral_Bound: { reason: "Bond latéral ample, demande une grande largeur", rule: "space" },
  Alternate_Leg_Diagonal_Bound: { reason: "Bonds en diagonale, demande une grande longueur", rule: "space" },
  Side_Standing_Long_Jump: { reason: "Saut en longueur latéral, demande une grande largeur", rule: "space" },
  Standing_Long_Jump: { reason: "Saut en longueur, demande une grande longueur", rule: "space" },
  Frog_Hops: { reason: "Sauts groupés vers l'avant, demande une grande longueur", rule: "space" },
  Spider_Crawl: { reason: "Déplacement au sol sur plusieurs mètres", rule: "space" },
  Bodyweight_Walking_Lunge: { reason: "Fentes marchées, demande une grande longueur", rule: "space" },
  Moving_Claw_Series: { reason: "Éducatif de course en déplacement", rule: "space" },
  "Linear_3-Part_Start_Technique": { reason: "Technique de départ sprinté, demande une piste", rule: "space" },
  Linear_Acceleration_Wall_Drill: { reason: "Éducatif d'accélération, technique et encombrant", rule: "space" },

  // Furniture, bar or hidden equipment
  Bench_Jump: { reason: "Nécessite un banc", rule: "furniture" },
  Bench_Dips: { reason: "Nécessite un banc ou une chaise", rule: "furniture" },
  "Dips_-_Triceps_Version": { reason: "Nécessite des barres parallèles", rule: "furniture" },
  "Step-up_with_Knee_Raise": { reason: "Nécessite une marche ou un banc", rule: "furniture" },
  "Decline_Push-Up": { reason: "Nécessite un support surélevé pour les pieds", rule: "furniture" },
  "Push-Ups_With_Feet_Elevated": { reason: "Nécessite un support surélevé pour les pieds", rule: "furniture" },
  "Incline_Push-Up": { reason: "Nécessite un support surélevé pour les mains", rule: "furniture" },
  "Incline_Push-Up_Medium": { reason: "Nécessite un support surélevé pour les mains", rule: "furniture" },
  "Incline_Push-Up_Wide": { reason: "Nécessite un support surélevé pour les mains", rule: "furniture" },
  "Incline_Push-Up_Reverse_Grip": { reason: "Nécessite un support surélevé pour les mains", rule: "furniture" },
  "Incline_Push-Up_Close-Grip": { reason: "Nécessite un support surélevé pour les mains", rule: "furniture" },
  Chair_Lower_Back_Stretch: { reason: "Nécessite une chaise", rule: "furniture" },
  "Leg-Up_Hamstring_Stretch": { reason: "Nécessite un support surélevé pour la jambe", rule: "furniture" },
  "Flat_Bench_Leg_Pull-In": { reason: "Nécessite un banc", rule: "furniture" },
  Flat_Bench_Lying_Leg_Raise: { reason: "Nécessite un banc", rule: "furniture" },
  "Seated_Flat_Bench_Leg_Pull-In": { reason: "Nécessite un banc", rule: "furniture" },
  Seated_Leg_Tucks: { reason: "Nécessite un banc", rule: "furniture" },
  Decline_Crunch: { reason: "Nécessite un banc incliné", rule: "furniture" },
  Decline_Oblique_Crunch: { reason: "Nécessite un banc incliné", rule: "furniture" },
  Decline_Reverse_Crunch: { reason: "Nécessite un banc incliné", rule: "furniture" },
  "Crunch_-_Legs_On_Exercise_Ball": { reason: "Nécessite un ballon de gym", rule: "furniture" },
  "Close-Grip_Push-Up_off_of_a_Dumbbell": { reason: "Nécessite un haltère", rule: "furniture" },
  Standing_Towel_Triceps_Extension: { reason: "Nécessite une serviette tendue en résistance", rule: "furniture" },
  Inverted_Row: { reason: "Nécessite une barre basse ou une table solide", rule: "furniture" },
  "Chin-Up": { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  Pullups: { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  "V-Bar_Pullup": { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  "Wide-Grip_Rear_Pull-Up": { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  "Scapular_Pull-Up": { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  Gorilla_Chin_Crunch: { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  Hanging_Leg_Raise: { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },
  Hanging_Pike: { reason: "Nécessite une barre de traction", rule: "pull_up_bar" },

  // Partner or anchored feet
  "Janda_Sit-Up": { reason: "Nécessite un partenaire ou un ancrage des pieds", rule: "partner" },
  Prone_Manual_Hamstring: { reason: "Nécessite un partenaire", rule: "partner" },
  Natural_Glute_Ham_Raise: { reason: "Nécessite un ancrage solide des pieds", rule: "partner" },
  "Floor_Glute-Ham_Raise": { reason: "Nécessite un ancrage solide des pieds", rule: "partner" },
  "3_4_Sit-Up": { reason: "Nécessite un ancrage des pieds", rule: "partner" },

  // Too technical, too advanced or risky for an unsupervised morning session
  "Handstand_Push-Ups": { reason: "Niveau expert, charge importante sur le cou et les épaules", rule: "risk" },
  "Single-Arm_Push-Up": { reason: "Niveau expert", rule: "difficulty" },
  "Plyo_Push-up": { reason: "Impact important sur les poignets et les épaules", rule: "risk" },
  Isometric_Wipers: { reason: "Mouvement avancé, exécution difficile à comprendre en deux images", rule: "clarity" },
  "Clock_Push-Up": { reason: "Déplacement circulaire complexe, peu lisible en deux images", rule: "clarity" },
  Cocoons: { reason: "Mouvement dynamique complet, charge sur le bas du dos", rule: "risk" },
  Bottoms_Up: { reason: "Élévation du bassin jambes tendues, charge sur le bas du dos", rule: "risk" },
  "Jackknife_Sit-Up": { reason: "Mouvement avancé, charge sur le bas du dos", rule: "risk" },
  One_Half_Locust: { reason: "Extension dorsale poussée, peu adaptée au réveil", rule: "risk" },
  Toe_Touchers: { reason: "Flexion balistique vers les orteils, contrainte lombaire", rule: "risk" },
  Standing_Toe_Touches: { reason: "Flexion balistique vers les orteils, contrainte lombaire", rule: "risk" },
  Seated_Biceps: { reason: "Appui arrière des mains, contrainte sur les épaules, niveau expert", rule: "risk" },
  Seated_Front_Deltoid: { reason: "Appui arrière des mains, contrainte sur les épaules, niveau expert", rule: "risk" },
  All_Fours_Quad_Stretch: { reason: "Position instable, contrainte sur le genou d'appui", rule: "risk" },

  // Ambiguous instructions
  Leg_Lift: { reason: "Consignes ambiguës, mouvement non identifiable avec certitude", rule: "clarity" },
  Body_Tricep_Press: { reason: "Consignes ambiguës sur le placement des mains", rule: "clarity" },
  Windmills: { reason: "Consignes ambiguës, plusieurs mouvements portent ce nom", rule: "clarity" },
  Dynamic_Back_Stretch: { reason: "Consignes ambiguës", rule: "clarity" },
  "Upper_Back-Leg_Grab": { reason: "Consignes ambiguës", rule: "clarity" },
  Looking_At_Ceiling: { reason: "Consignes ambiguës, bénéfice du mouvement peu clair", rule: "clarity" },
  Side_Wrist_Pull: { reason: "Consignes ambiguës", rule: "clarity" },
  "Side-Lying_Floor_Stretch": { reason: "Consignes ambiguës sur le placement", rule: "clarity" },
  Hip_Circles_prone: { reason: "Consignes ambiguës, position instable", rule: "clarity" },

  // Redundant with an exercise already kept
  "Sit-Up": { reason: "Redondant avec le crunch court, et souvent réalisé pieds bloqués", rule: "redundant" },
  "Frog_Sit-Ups": { reason: "Redondant avec le crunch court", rule: "redundant" },
  Tuck_Crunch: { reason: "Redondant avec le crunch inversé", rule: "redundant" },
  "Crunch_-_Hands_Overhead": { reason: "Redondant avec le crunch court", rule: "redundant" },
  Oblique_Crunches: { reason: "Redondant avec le crunch croisé", rule: "redundant" },
  "Oblique_Crunches_-_On_The_Floor": { reason: "Redondant avec le crunch croisé", rule: "redundant" },
  Elbow_to_Knee: { reason: "Redondant avec le crunch croisé", rule: "redundant" },
  "Bent-Knee_Hip_Raise": { reason: "Redondant avec le crunch inversé", rule: "redundant" },
  Scissor_Kick: { reason: "Redondant avec les battements de jambes", rule: "redundant" },
  Pushups_Close_and_Wide_Hand_Positions: { reason: "Redondant avec les pompes larges et serrées déjà retenues", rule: "redundant" },
  Split_Jump: { reason: "Redondant avec le saut en fente alterné", rule: "redundant" },
  Rocket_Jump: { reason: "Redondant avec le squat sauté", rule: "redundant" },
  Star_Jump: { reason: "Redondant avec le squat sauté", rule: "redundant" },
  Single_Leg_Butt_Kick: { reason: "Redondant avec les talons-fesses", rule: "redundant" },
  Elbow_Circles: { reason: "Redondant avec les cercles de bras", rule: "redundant" },
  Overhead_Stretch: { reason: "Redondant avec l'étirement vers le haut", rule: "redundant" },
  Seated_Overhead_Stretch: { reason: "Redondant avec l'étirement vers le haut", rule: "redundant" },
  Elbows_Back: { reason: "Redondant avec l'ouverture dynamique de la poitrine", rule: "redundant" },
  Tricep_Side_Stretch: { reason: "Redondant avec l'étirement des triceps", rule: "redundant" },
  Overhead_Triceps: { reason: "Redondant avec l'étirement des triceps", rule: "redundant" },
  Upper_Back_Stretch: { reason: "Redondant avec l'étirement du milieu du dos", rule: "redundant" },
  Spinal_Stretch: { reason: "Redondant avec l'étirement du milieu du dos", rule: "redundant" },
  Knee_Across_The_Body: { reason: "Redondant avec l'étirement fessier allongé", rule: "redundant" },
  Lying_Glute: { reason: "Redondant avec l'étirement fessier allongé", rule: "redundant" },
  Seated_Glute: { reason: "Redondant avec l'étirement fessier assis", rule: "redundant" },
  Lower_Back_Curl: { reason: "Redondant avec les genoux ramenés à la poitrine", rule: "redundant" },
  Pelvic_Tilt_Into_Bridge: { reason: "Redondant avec la bascule du bassin et le pont fessier", rule: "redundant" },
  Hamstring_Stretch: { reason: "Redondant avec l'étirement des ischio-jambiers assis", rule: "redundant" },
  Seated_Hamstring: { reason: "Redondant avec l'étirement des ischio-jambiers assis", rule: "redundant" },
  Groin_and_Back_Stretch: { reason: "Redondant avec l'étirement des adducteurs", rule: "redundant" },
  Side_Lying_Groin_Stretch: { reason: "Redondant avec l'étirement des adducteurs", rule: "redundant" },
  On_Your_Side_Quad_Stretch: { reason: "Redondant avec l'étirement du quadriceps sur le ventre", rule: "redundant" },
  Iron_Crosses_stretch: { reason: "Redondant avec la torsion allongée", rule: "redundant" },
  Calf_Stretch_Elbows_Against_Wall: { reason: "Redondant avec l'étirement des mollets au mur", rule: "redundant" },
  // Rejected after a visual check of the two source photos
  "Flutter_Kicks": { reason: "Photos réalisées à plat ventre sur un banc, sans rapport avec des battements allongé sur le dos", rule: "media_mismatch" },
  "Rear_Leg_Raises": { reason: "Photos réalisées à quatre pattes, redondant avec le coup de pied arrière", rule: "media_mismatch" },
  "Middle_Back_Stretch": { reason: "Photos ne correspondant pas à un étirement du milieu du dos", rule: "media_mismatch" },
  "Lying_Prone_Quadriceps": { reason: "Photos montrant un étirement assisté par un partenaire", rule: "media_mismatch" },
  "Adductor_Groin": { reason: "Photos montrant un étirement assisté par un partenaire, allongé sur le dos", rule: "media_mismatch" },
  "Runners_Stretch": { reason: "Photos montrant une flexion debout vers les orteils, pas une fente", rule: "media_mismatch" },
  "Front_Leg_Raises": { reason: "Photos réalisées avec appui sur une chaise, incompatible avec notre consigne sans matériel", rule: "media_mismatch" },
  "Side_Leg_Raises": { reason: "Photos réalisées avec appui sur une chaise, incompatible avec notre consigne sans matériel", rule: "media_mismatch" },
  "Ankle_Circles": { reason: "Photos debout alors que notre exercice est assis sans mise en charge", rule: "media_mismatch" },
  "Wrist_Circles": { reason: "Photos debout alors que notre exercice est assis", rule: "media_mismatch" },
  "Standing_Gastrocnemius_Calf_Stretch": { reason: "Photos réalisées avec un pied sur une marche, matériel non disponible", rule: "media_mismatch" },
  "Hyperextensions_With_No_Hyperextension_Bench": { reason: "Photos réalisées sur un banc avec un partenaire", rule: "media_mismatch" },
  "Double_Leg_Butt_Kick": { reason: "Photos montrant un saut à deux pieds, différent de nos talons-fesses en course sur place", rule: "media_mismatch" },
  "Lying_Crossover": { reason: "Photos montrant un étirement assisté par un partenaire", rule: "media_mismatch" },
  "Side_Neck_Stretch": { reason: "Photos debout alors que notre exercice est assis", rule: "media_mismatch" },
};