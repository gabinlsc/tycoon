/** Réglages d'une partie. Ils font partie de l'état : ils sont donc sauvegardés, rejoués et hachés. */

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
}
