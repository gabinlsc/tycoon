/** Réglages d'une partie. Ils font partie de l'état : ils sont donc sauvegardés, rejoués et hachés. */

import type { HeritageBonusId } from './balance/heritage';

export type GameMode = 'carriere' | 'scenario' | 'bac-a-sable' | 'defi' | 'tutoriel';

/** Curseurs de difficulté, appliqués comme multiplicateurs sur les valeurs de `balance/`. */
export interface DifficultySettings {
  /** Multiplicateur du budget de départ (1 = normal). */
  startingCash: number;
  /** Agressivité des rivaux : vitesse de repérage et de signature (1 = normal). */
  rivalAggression: number;
  /** Volatilité du marché : amplitude des variations de tendance (1 = normal). */
  marketVolatility: number;
  /**
   * Bonus de trésorerie des rivaux (0 = aucun). C'est la seule entorse à « les rivaux jouent avec
   * les mêmes règles que le joueur » : explicite, réglable, affichée dans les paramètres.
   */
  rivalCashBonus: number;
}

export type DifficultyPreset = 'facile' | 'normal' | 'difficile';

/** Ce qu'un règne précédent transmet à une partie « Héritage ». */
export interface HeritageDepart {
  /** Rang du règne (1 = première partie, 2 = premier héritier…). */
  generation: number;
  /** Nom du label du règne précédent. */
  ancetre: string;
  /** Réputation transmise (points ajoutés à celle de départ). */
  reputation: number;
  bonus: HeritageBonusId[];
}

export interface GameConfig {
  mode: GameMode;
  difficulty: DifficultySettings;
  /** Identifiant du scénario (mode scénario ou tutoriel). */
  scenarioId?: string;
  /** Argent illimité (bac à sable) : rien n'est jamais refusé faute de fonds, la faillite est impossible. */
  sandbox?: boolean;
  /** Faillite désactivée même sans argent illimité (bac à sable). */
  bankruptcyOff?: boolean;
  /** Date du défi du jour (AAAA-MM-JJ, UTC) : la graine en découle (mode défi). */
  defiDate?: string;
  /** Fréquence des événements : 1 = normal, 0 = aucun événement tiré, 3 = triple. */
  eventRate?: number;
  /** Héritage d'un règne précédent (mode carrière uniquement). */
  heritage?: HeritageDepart;
}
