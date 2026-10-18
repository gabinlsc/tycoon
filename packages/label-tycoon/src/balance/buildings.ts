import { type Cents, money } from '@tycoon/core';
import type { TierId } from './tiers';

/** Bâtiments (GDD, 5.9). Valeurs de départ à recaler par simulation. */
export const BUILDING_IDS = ['studio', 'repetition', 'bureaux', 'pressage', 'concert'] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export interface BuildingRule {
  maxLevel: number;
  /** Palier minimal du label pour construire. */
  tier: TierId;
  /** Niveau possédé au départ. */
  start: number;
  /** Coût de construction du niveau n (indice n-1). */
  cost: readonly Cents[];
  /** Entretien hebdomadaire par niveau possédé. */
  upkeep: Cents;
  /** Semaines de travaux par niveau. */
  weeks: number;
}

export const BUILDINGS: Readonly<Record<BuildingId, BuildingRule>> = {
  studio: {
    maxLevel: 5,
    tier: 'home-studio',
    start: 1,
    cost: [0, 15_000, 45_000, 120_000, 300_000].map((e) => money.euros(e)),
    upkeep: money.euros(60),
    weeks: 4,
  },
  repetition: {
    maxLevel: 3,
    tier: 'independant',
    start: 0,
    cost: [10_000, 35_000, 90_000].map((e) => money.euros(e)),
    upkeep: money.euros(50),
    weeks: 3,
  },
  bureaux: {
    maxLevel: 4,
    tier: 'home-studio',
    start: 1,
    cost: [0, 12_000, 40_000, 110_000].map((e) => money.euros(e)),
    upkeep: money.euros(80),
    weeks: 3,
  },
  pressage: {
    maxLevel: 3,
    tier: 'independant',
    start: 0,
    cost: [20_000, 60_000, 150_000].map((e) => money.euros(e)),
    upkeep: money.euros(90),
    weeks: 5,
  },
  concert: {
    maxLevel: 3,
    tier: 'major',
    start: 0,
    cost: [200_000, 500_000, 1_200_000].map((e) => money.euros(e)),
    upkeep: money.euros(400),
    weeks: 12,
  },
};

/** Effets numériques par niveau de bâtiment. */
export const BUILDING_EFFECTS = {
  /** Niveau de studio maximal utilisable dans une sortie : niveau du bâtiment × ce facteur. */
  studioCapPerLevel: 20,
  /** Projets de production simultanés supplémentaires par niveau de studio au-delà du premier. */
  studioCapacityPerLevel: 1,
  /** Membres d'équipe : base + par niveau de bureaux. */
  teamBase: 2,
  teamPerOffice: 3,
  /** Fatigue récupérée en plus chaque semaine par niveau de salle de répétition. */
  rehearsalFatigue: 1.5,
} as const;
