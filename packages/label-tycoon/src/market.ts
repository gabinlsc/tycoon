import { type Phase, clamp, lerp, sin } from '@tycoon/core';
import { TRENDS } from './balance/market';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { MARKET, START_CREDIBILITY } from './balance/market';
import { GENRES, GENRE_IDS } from './content/genres';

/** Marché d'un genre à un instant donné. */
export interface GenreMarket {
  /** Popularité (0-100). Elle évolue chaque semaine (voir `feat/label-tendances`). */
  popularite: number;
  /** Popularité moyenne du genre, autour de laquelle la tendance oscille. */
  base: number;
  /** Bruit à retour à la moyenne (marche aléatoire rappelée vers 0). */
  bruit: number;
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
    genres[id] = {
      popularite: def.popularite,
      base: def.popularite,
      bruit: 0,
      audience: def.audience,
    };
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

const TWO_PI = 6.283185307179586;

/** Déphasage propre à un genre (stable, déduit de son rang alphabétique). */
const phaseOf = (index: number, salt: number): number => ((index * 2.399963 + salt) % 1) * TWO_PI;

/** Popularité attendue d'un genre à la semaine `tick`, sans le bruit : base + cycle lent + cycle saisonnier. */
export function cyclicPopularity(base: number, index: number, tick: number): number {
  return (
    base +
    TRENDS.slowAmplitude * sin((TWO_PI * tick) / TRENDS.slowPeriod + phaseOf(index, 0.17)) +
    TRENDS.seasonAmplitude * sin((TWO_PI * tick) / TRENDS.seasonPeriod + phaseOf(index, 0.61))
  );
}

/** Phase « marche » : la popularité de chaque genre évolue (cycles + bruit rappelé vers la moyenne). */
export const marketPhase: Phase<LabelState, LabelSignal> = {
  name: 'marche',
  run(state, ctx) {
    const rng = ctx.rng('marche');
    const volatility = state.config.difficulty.marketVolatility;
    genreKeys(state.marche).forEach((id, index) => {
      const genre = state.marche.genres[id];
      if (!genre) return;
      genre.bruit = clamp(
        genre.bruit * (1 - TRENDS.noiseReversion) + rng.gaussian(0, TRENDS.noiseSd * volatility),
        -TRENDS.noiseLimit,
        TRENDS.noiseLimit,
      );
      genre.popularite =
        Math.round(
          clamp(cyclicPopularity(genre.base, index, ctx.tick) + genre.bruit, 0, 100) * 10,
        ) / 10;
    });
  },
};
