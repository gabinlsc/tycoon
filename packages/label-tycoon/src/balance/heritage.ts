import { type Cents, money } from '@tycoon/core';

/** Mode Héritage : ce qu'un règne transmet au suivant et ce qu'il faut accomplir pour le mériter (GDD, 14.2). */
export const HERITAGE = {
  /** Un règne se clôt à partir de ce palier (ou après ce nombre de semaines de jeu). */
  minTier: 'groupe',
  minWeeks: 520,
  /** Part de la réputation finale transmise, plafonnée : on repart en inconnu, pas en vedette. */
  reputationShare: 0.12,
  reputationMax: 12,
  /** Nombre maximal de générations enchaînées (au-delà, la cadence des bonus ne change plus). */
  maxGeneration: 99,
  bonus: {
    /** Fondation héritée : de l'influence dès le palier Institution. */
    fondation: { don: money.euros(5_000_000) as Cents, influence: 20 },
    /** Catalogue : droits résiduels qui financent le départ. */
    catalogue: { certifies: 10, tresorerie: money.euros(40_000) as Cents },
    /** Prestige : un nom qui ouvre les portes. */
    prestige: { valorisation: money.euros(50_000_000) as Cents, reputation: 6 },
    /** Réseau : des contacts dans tous les genres. */
    reseau: { signatures: 30, credibilite: 8 },
  },
} as const;

export const HERITAGE_BONUS_IDS = ['fondation', 'catalogue', 'prestige', 'reseau'] as const;
export type HeritageBonusId = (typeof HERITAGE_BONUS_IDS)[number];
