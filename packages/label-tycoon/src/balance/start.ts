import { type Cents, money } from '@tycoon/core';

/** Conditions de départ d'une partie en difficulté « normal ». */
export const START = {
  /** Budget de départ : un home-studio et un budget ridicule. */
  cash: money.euros(10_000) as Cents,
  /** Réputation de départ du label (0-100). */
  reputation: 5,
  /** Nom du label tant que le joueur n'en a pas choisi un. */
  defaultLabelName: 'Mon label',
} as const;

/** Limites de saisie. */
export const LABEL_NAME_MAX = 32;

/** Trésorerie en bac à sable : assez pour ne jamais compter. */
export const SANDBOX_CASH: Cents = money.euros(1_000_000_000);
