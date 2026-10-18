import { type Cents, money } from '@tycoon/core';

/** Rivaux et enchères (GDD, 5.4 et 11). Valeurs de départ à recaler par simulation. */
export type RivalStyle = 'predateur' | 'prudent' | 'flambeur';

export const RIVALS = {
  count: 3,
  startCash: money.euros(60_000) as Cents,
  /** Probabilité qu'un rival participe à une enchère, par style (× agressivité). */
  interest: { predateur: 0.7, prudent: 0.4, flambeur: 0.55 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Multiple de l'avance « juste » proposé, par style. */
  advanceMultiple: { predateur: 1.1, prudent: 0.9, flambeur: 1.8 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Royalties offertes à l'artiste (points de base), par style. */
  royaltiesBps: { predateur: 5000, prudent: 4000, flambeur: 4500 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Part de sa trésorerie qu'un rival accepte de risquer sur une avance. */
  maxCashShare: 0.3,
  styles: ['predateur', 'prudent', 'flambeur'] as readonly RivalStyle[],
} as const;
