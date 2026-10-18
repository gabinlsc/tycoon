import { type Cents, money } from '@tycoon/core';

export type TierId = 'home-studio' | 'independant' | 'etabli' | 'major';
export type CertificationLevel = 'or' | 'platine' | 'diamant';

export interface TierRule {
  id: TierId;
  /** Réputation minimale du label (0-100). */
  minReputation: number;
  /** Chiffre d'affaires minimal sur 52 semaines glissantes. */
  minAnnualRevenue: Cents;
  /** Certification minimale obtenue, le cas échéant. */
  requiredCertification?: CertificationLevel;
}

/**
 * Paliers du label, du plus bas au plus haut. Chaque palier est atteint par une combinaison de
 * réputation, de chiffre d'affaires annuel et de certifications. Valeurs de départ à recaler par
 * simulation (voir GDD, section 5.1).
 */
export const TIERS: readonly TierRule[] = [
  { id: 'home-studio', minReputation: 0, minAnnualRevenue: money.euros(0) },
  {
    id: 'independant',
    minReputation: 20,
    minAnnualRevenue: money.euros(150_000),
    requiredCertification: 'or',
  },
  {
    id: 'etabli',
    minReputation: 45,
    minAnnualRevenue: money.euros(1_500_000),
    requiredCertification: 'platine',
  },
  {
    id: 'major',
    minReputation: 75,
    minAnnualRevenue: money.euros(20_000_000),
    requiredCertification: 'diamant',
  },
];

/** Palier minimal requis pour débloquer une fonctionnalité (GDD, 5.1). */
export const UNLOCKS = {
  emprunter: 'independant',
  investisseurs: 'etabli',
  'directeur-financier': 'etabli',
} as const satisfies Record<string, TierId>;
