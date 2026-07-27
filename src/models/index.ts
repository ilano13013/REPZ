/**
 * Modèles de domaine de REPZ.
 *
 * Ces types sont partagés par les moteurs, les stores, la base de données et
 * l'UI. Ils sont volontairement indépendants de React Native.
 */

// ----------------------------------------------------------------------------
// Utilisateur & profil
// ----------------------------------------------------------------------------

export type Sex = 'male' | 'female' | 'unspecified';
export type Units = 'kg' | 'lb';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Goal =
  | 'muscle_gain' // prise de masse
  | 'weight_loss' // perte de poids
  | 'recomposition' // recomposition corporelle
  | 'strength' // gain de force
  | 'maintenance' // maintien
  | 'general_fitness'; // condition physique générale

export type TrainingLocation = 'gym' | 'home' | 'outdoor';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'bodyweight'
  | 'band'
  | 'bench'
  | 'pullup_bar'
  | 'cardio_machine';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  sex: Sex;
  heightCm: number | null;
  weightKg: number | null;
  fitnessLevel: FitnessLevel;
  goal: Goal;
  sessionsPerWeek: number;
  availableDays: Weekday[];
  location: TrainingLocation;
  equipment: Equipment[];
  limitations: string | null;
  units: Units;
  createdAt: number;
  // Gamification
  totalXp: number;
  level: number;
  activeProgramId: string | null;
  currentStreak: number; // séries de jours/semaines actifs
  bestStreak: number;
  lastWorkoutDate: number | null;
}

export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  units: Units;
  privacyShareStats: boolean;
}

// ----------------------------------------------------------------------------
// Muscles
// ----------------------------------------------------------------------------

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'cardio';

/** Répartition de l'XP d'un exercice entre groupes musculaires (somme = 1). */
export type MuscleSplit = Partial<Record<MuscleGroup, number>>;

// ----------------------------------------------------------------------------
// Exercices
// ----------------------------------------------------------------------------

export type ExerciseType =
  | 'weight_reps' // charge + répétitions
  | 'bodyweight' // poids du corps
  | 'duration' // isométrique / gainage
  | 'distance' // course, rameur (distance)
  | 'cardio'; // cardio basé sur la durée/intensité

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  equipment: Equipment[];
  instructions: string;
  difficulty: Difficulty;
  /** Coefficient d'XP propre à l'exercice. */
  xpCoefficient: number;
  /** Clé de coefficient poids du corps (voir xpConfig), pour type bodyweight. */
  bodyweightKey?: string;
  /** Répartition de l'XP entre muscles (défaut dérivé si absent). */
  muscleSplit: MuscleSplit;
  media?: string; // placeholder image/animation
  recommended: {
    sets: number;
    reps: string; // ex "8-12" ou "30s"
    restSeconds: number;
  };
}

// ----------------------------------------------------------------------------
// Programmes
// ----------------------------------------------------------------------------

export interface ProgramExerciseTemplate {
  exerciseId: string;
  order: number;
  sets: number;
  targetReps: string;
  restSeconds: number;
}

export interface ProgramDay {
  id: string;
  name: string; // ex "Push", "Full Body A"
  order: number;
  exercises: ProgramExerciseTemplate[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  goal: Goal;
  level: FitnessLevel;
  isPreset: boolean;
  days: ProgramDay[];
}

// ----------------------------------------------------------------------------
// Séances & séries
// ----------------------------------------------------------------------------

export interface SetEntry {
  id: string;
  workoutExerciseId: string;
  order: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
  rpe: number | null; // 1-10, ou reps en réserve inversées
  completed: boolean;
  xpEarned: number;
  isPersonalRecord: boolean;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  note: string | null;
  sets: SetEntry[];
  skipped: boolean;
}

export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned';

export interface Workout {
  id: string;
  userId: string;
  programId: string | null;
  programDayId: string | null;
  name: string;
  status: WorkoutStatus;
  startedAt: number;
  completedAt: number | null;
  note: string | null;
  totalXp: number;
  totalVolumeKg: number;
  exercises: WorkoutExercise[];
}

// ----------------------------------------------------------------------------
// Records personnels
// ----------------------------------------------------------------------------

export type PersonalRecordType =
  | 'max_load' // charge maximale
  | 'max_reps_at_load' // reps max à une charge donnée
  | 'best_set_volume' // meilleur volume sur une série
  | 'best_workout_volume' // meilleur volume sur une séance
  | 'best_estimated_1rm'; // meilleur 1RM estimé

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  type: PersonalRecordType;
  value: number;
  /** Contexte (ex : charge pour max_reps_at_load). */
  context: number | null;
  achievedAt: number;
  workoutId: string | null;
}

// ----------------------------------------------------------------------------
// XP, niveaux, muscles, stats
// ----------------------------------------------------------------------------

export interface XpLogEntry {
  id: string;
  userId: string;
  amount: number;
  source: string; // 'set' | 'workout' | 'quest' | 'boss' | ...
  refId: string | null;
  createdAt: number;
}

export interface MuscleProgress {
  userId: string;
  muscle: MuscleGroup;
  xp: number;
  level: number;
}

export type CharacterStatKey =
  | 'strength' // Force
  | 'endurance' // Endurance
  | 'discipline' // Discipline
  | 'power' // Puissance
  | 'consistency' // Régularité
  | 'recovery'; // Récupération

export type CharacterStats = Record<CharacterStatKey, number>;

// ----------------------------------------------------------------------------
// Quêtes, boss, badges, ligue
// ----------------------------------------------------------------------------

export type QuestPeriod = 'daily' | 'weekly';

export type QuestMetric =
  | 'complete_workout'
  | 'sets_count'
  | 'beat_record'
  | 'train_muscle'
  | 'no_skip_workout'
  | 'workouts_count'
  | 'volume_increase'
  | 'train_all_muscles'
  | 'rest_days'
  | 'total_sets';

export interface QuestDefinition {
  id: string;
  period: QuestPeriod;
  title: string;
  description: string;
  metric: QuestMetric;
  target: number;
  /** Muscle ciblé pour metric === 'train_muscle'. */
  muscle?: MuscleGroup;
  rewardXp: number;
  rewardBadgeId?: string;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  period: QuestPeriod;
  periodKey: string; // ex "2026-07-27" ou "2026-W30"
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export type BossMetric = 'total_volume' | 'total_sets' | 'workouts' | 'active_minutes';

export interface WeeklyBoss {
  id: string;
  userId: string;
  weekKey: string;
  name: string;
  metric: BossMetric;
  target: number;
  progress: number;
  defeated: boolean;
  rewardXp: number;
  startsAt: number;
  endsAt: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji placeholder
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  unlockedAt: number;
}

export type LeagueDivision =
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'elite'
  | 'titan';

export interface LeagueMember {
  id: string;
  name: string;
  isUser: boolean;
  score: number;
  division: LeagueDivision;
}

// ----------------------------------------------------------------------------
// Mesures & récupération
// ----------------------------------------------------------------------------

export interface BodyWeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  date: number;
}

export interface MeasurementEntry {
  id: string;
  userId: string;
  date: number;
  armCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  bodyFatPct: number | null;
  photoUri: string | null;
}

export interface RecoveryCheckin {
  id: string;
  userId: string;
  date: number;
  energy: number; // 1-5
  sleepQuality: number; // 1-5
  soreness: number; // 1-5
  motivation: number; // 1-5
  pain: boolean;
}

export type RecoveryRecommendation =
  | 'proceed' // conserver la séance prévue
  | 'reduce_load' // réduire la charge
  | 'reduce_volume' // diminuer une série
  | 'rest'; // recommander une récupération
