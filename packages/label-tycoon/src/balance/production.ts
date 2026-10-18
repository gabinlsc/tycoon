import { type Cents, money } from '@tycoon/core';

/** Production des sorties (GDD, 5.5). Valeurs de départ à recaler par simulation. */
export type ReleaseType = 'single' | 'ep' | 'album' | 'mixtape';
export type ClipSize = 'aucun' | 'petit' | 'gros';

export interface ReleaseProfile {
  titres: number;
  /** Coût de base. */
  cout: Cents;
  /** Durée de base en semaines. */
  semaines: number;
  /** Poids dans les classements. */
  poids: number;
}

export const RELEASE_TYPES: Readonly<Record<ReleaseType, ReleaseProfile>> = {
  single: { titres: 1, cout: money.euros(2000), semaines: 3, poids: 1 },
  ep: { titres: 4, cout: money.euros(8000), semaines: 8, poids: 3 },
  album: { titres: 10, cout: money.euros(25_000), semaines: 16, poids: 8 },
  mixtape: { titres: 8, cout: money.euros(6000), semaines: 10, poids: 2 },
};

export const CLIPS: Readonly<Record<ClipSize, { cout: Cents; semaines: number }>> = {
  aucun: { cout: money.euros(0), semaines: 0 },
  petit: { cout: money.euros(3000), semaines: 1 },
  gros: { cout: money.euros(15_000), semaines: 3 },
};

export const PRODUCTION = {
  /** Projets simultanés possibles (augmente avec le palier plus tard). */
  capacity: 2,
  /** Coût par niveau de studio (0-100) et par titre. */
  studioCostPerLevel: money.euros(8) as Cents,
  /** Durée : facteur = base − éthique × pente (un artiste sérieux va plus vite). */
  durationBase: 1.3,
  durationEthicsSlope: 0.6,
  /** Probabilité de retard, et retard maximal (en part de la durée). */
  delayChance: 0.25,
  delayMaxShare: 0.5,
  /** Budget de mixage minimal et qualité de mixage qu'il donne (0-100 pour ce budget par titre). */
  mixingCostFor100: money.euros(1500) as Cents,
} as const;
