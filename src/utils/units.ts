/** Conversion et formatage d'unités de charge. */

import type { Units } from '@/models';

const KG_TO_LB = 2.2046226218;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Convertit une charge stockée en kg vers l'unité d'affichage. */
export function displayWeight(kg: number, units: Units): number {
  const value = units === 'lb' ? kgToLb(kg) : kg;
  return Math.round(value * 10) / 10;
}

/** Convertit une valeur saisie dans l'unité utilisateur vers le kg de stockage. */
export function toStorageKg(value: number, units: Units): number {
  return units === 'lb' ? lbToKg(value) : value;
}

export function formatWeight(kg: number, units: Units): string {
  return `${displayWeight(kg, units)} ${units}`;
}

/** Formate un volume (kg) de façon lisible (ex 12,5k kg). */
export function formatVolume(kg: number, units: Units): string {
  const value = units === 'lb' ? kgToLb(kg) : kg;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k ${units}`;
  }
  return `${Math.round(value)} ${units}`;
}
