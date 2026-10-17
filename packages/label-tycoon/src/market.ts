import { clamp, lerp } from '@tycoon/core';
import { MARKET, START_CREDIBILITY } from './balance/market';
import { GENRES, GENRE_IDS } from './content/genres';

/** Marché d'un genre à un instant donné. */
export interface GenreMarket {
  /** Popularité (0-100). Elle évolue chaque semaine (voir `feat/label-tendances`). */
  popularite: number;
  /** Audience potentielle hebdomadaire de base. */
  audience: number;
}

/**
 * État du marché. Les genres sont indexés par identifiant (les genres de départ, puis les
 * sous-genres fictifs qui s'ajoutent en cours de partie). Pour itérer dans un ordre stable,
 * passer par `genreKeys`, jamais par l'ordre d'insertion de l'objet.
 */
export interface MarketState {
  genres: Record<string, GenreMarket>;
}

export function initialMarket(): MarketState {
  const genres: Record<string, GenreMarket> = {};
  for (const id of GENRE_IDS) {
    const def = GENRES[id];
    genres[id] = { popularite: def.popularite, audience: def.audience };
  }
  return { genres };
}

export function initialCredibility(): Record<string, number> {
  return Object.fromEntries(GENRE_IDS.map((id) => [id, START_CREDIBILITY]));
}

/** Identifiants des genres présents, dans un ordre stable (tri alphabétique). */
export const genreKeys = (market: MarketState): string[] => Object.keys(market.genres).sort();

/**
 * Tendance du genre : multiplicateur du potentiel de hit. 0 donne 0,5, 50 donne 1, 100 donne 1,5,
 * affine de part et d'autre du point neutre.
 */
export function trendMultiplier(popularity: number): number {
  const p = clamp(popularity, 0, 100);
  const { trendMin, trendMax, neutralPopularity } = MARKET;
  return p <= neutralPopularity
    ? lerp(trendMin, 1, p / neutralPopularity)
    : lerp(1, trendMax, (p - neutralPopularity) / (100 - neutralPopularity));
}
