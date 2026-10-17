import type { DifficultyPreset, DifficultySettings } from '../config';

/**
 * Préréglages de difficulté. Le joueur peut aussi régler chaque curseur à la main.
 * Les bornes servent à valider les réglages importés ou personnalisés.
 */
export const DIFFICULTY_PRESETS: Readonly<Record<DifficultyPreset, DifficultySettings>> = {
  facile: { startingCash: 2, rivalAggression: 0.7, marketVolatility: 0.8, rivalCashBonus: 0 },
  normal: { startingCash: 1, rivalAggression: 1, marketVolatility: 1, rivalCashBonus: 0 },
  difficile: {
    startingCash: 0.5,
    rivalAggression: 1.4,
    marketVolatility: 1.25,
    rivalCashBonus: 0.25,
  },
};

export const DIFFICULTY_BOUNDS = {
  startingCash: { min: 0.1, max: 10 },
  rivalAggression: { min: 0.25, max: 3 },
  marketVolatility: { min: 0.25, max: 3 },
  rivalCashBonus: { min: 0, max: 2 },
} as const satisfies Record<keyof DifficultySettings, { min: number; max: number }>;
