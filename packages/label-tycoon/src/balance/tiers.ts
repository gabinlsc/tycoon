import { type Cents, money } from '@tycoon/core';

export type TierId =
  'home-studio' | 'independant' | 'etabli' | 'major' | 'groupe' | 'conglomerat' | 'institution';
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
  // Paliers de longue durée (GDD, 14.1) : le jeu change de nature, on pilote des filiales.
  {
    id: 'groupe',
    minReputation: 85,
    minAnnualRevenue: money.euros(100_000_000),
    requiredCertification: 'diamant',
  },
  {
    id: 'conglomerat',
    minReputation: 92,
    minAnnualRevenue: money.euros(400_000_000),
    requiredCertification: 'diamant',
  },
  {
    id: 'institution',
    minReputation: 97,
    minAnnualRevenue: money.euros(1_500_000_000),
    requiredCertification: 'diamant',
  },
];

/** Palier minimal requis pour débloquer une fonctionnalité (GDD, 5.1). */
export const UNLOCKS = {
  emprunter: 'independant',
  investisseurs: 'etabli',
  'directeur-financier': 'etabli',
  'sous-labels': 'groupe',
  'rachat-rival': 'groupe',
  plateforme: 'conglomerat',
  fondation: 'institution',
} as const satisfies Record<string, TierId>;

/**
 * Artistes sous contrat au maximum, par palier : à la taille d'un label correspond ce qu'une équipe
 * peut vraiment accompagner. Sans plafond, empiler les signatures bon marché écrase toute autre
 * façon de jouer.
 */
export const ROSTER_CAP: Readonly<Record<TierId, number>> = {
  'home-studio': 6,
  independant: 12,
  etabli: 24,
  major: 48,
  groupe: 96,
  conglomerat: 150,
  institution: 240,
};
