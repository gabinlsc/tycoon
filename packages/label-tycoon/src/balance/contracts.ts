import { type Cents, money } from '@tycoon/core';

/** Contrats d'artiste (GDD, 5.4). Valeurs de départ à recaler par simulation. */
export const CONTRACTS = {
  /** Bornes des clauses acceptées par le jeu. */
  royaltiesBps: { min: 1000, max: 9000 },
  durationYears: { min: 1, max: 6 },
  /** Part du label sur concerts, merch et synchro pour un contrat 360 (points de base). */
  share360Bps: { min: 0, max: 5000 },
  /** Valeur de référence : avance « juste » = plancher + notoriété × facteur. */
  advanceFloor: money.euros(500) as Cents,
  advancePerNotoriety: money.euros(60) as Cents,
  /** Part de royalties jugée normale par un artiste (points de base). */
  fairRoyaltiesBps: 3500,
  /** Poids de chaque terme du modèle d'utilité. */
  weights: {
    avance: 30,
    royalties: 40,
    prestige: 0.3,
    affinite: 0.15,
    exclusivite: 12,
    clause360: 25,
    duree: 4,
    rachat: 10,
  },
  /** Utilité minimale pour qu'un artiste accepte. */
  acceptThreshold: 0,
} as const;
