/**
 * Schémas de validation Zod pour l'onboarding et les formulaires.
 */

import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().min(1, 'Indiquez un prénom ou pseudonyme.').max(24),
  age: z
    .number({ invalid_type_error: 'Âge invalide.' })
    .int()
    .min(10, 'Âge minimum 10 ans.')
    .max(100)
    .nullable(),
  sex: z.enum(['male', 'female', 'unspecified']),
  heightCm: z.number().min(100).max(250).nullable(),
  weightKg: z.number().min(30).max(300).nullable(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goal: z.enum([
    'muscle_gain',
    'weight_loss',
    'recomposition',
    'strength',
    'maintenance',
    'general_fitness',
  ]),
  sessionsPerWeek: z.number().int().min(1).max(7),
  availableDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  location: z.enum(['gym', 'home', 'outdoor']),
  equipment: z.array(
    z.enum([
      'barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'bodyweight',
      'band', 'bench', 'pullup_bar', 'cardio_machine',
    ]),
  ),
  limitations: z.string().max(300).nullable(),
  units: z.enum(['kg', 'lb']),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const setEntrySchema = z.object({
  weightKg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  durationSec: z.number().int().min(0).max(36000).nullable(),
  distanceM: z.number().min(0).max(200000).nullable(),
  rpe: z.number().min(1).max(10).nullable(),
});

export const measurementSchema = z.object({
  armCm: z.number().min(10).max(80).nullable(),
  chestCm: z.number().min(50).max(200).nullable(),
  waistCm: z.number().min(40).max(200).nullable(),
  hipsCm: z.number().min(40).max(200).nullable(),
  thighCm: z.number().min(30).max(120).nullable(),
  calfCm: z.number().min(20).max(80).nullable(),
  bodyFatPct: z.number().min(3).max(60).nullable(),
});

export const checkinSchema = z.object({
  energy: z.number().int().min(1).max(5),
  sleepQuality: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(5),
  motivation: z.number().int().min(1).max(5),
  pain: z.boolean(),
});
