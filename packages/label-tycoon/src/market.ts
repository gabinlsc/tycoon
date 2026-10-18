import { type Phase, type Rng, clamp, lerp, sin } from '@tycoon/core';
import { SUBGENRES, TRENDS } from './balance/market';
import { GENRE_IDS } from './content/genres';
import { fr } from './strings/fr';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { MARKET, START_CREDIBILITY } from './balance/market';
import { GENRES } from './content/genres';

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
    spawnSubgenre(state, rng, ctx.tick);
    ageSubgenres(state, ctx.tick, ctx.emit);
    genreKeys(state.marche).forEach((id, index) => {
      const genre = state.marche.genres[id];
      if (!genre || state.sousGenres.some((s) => s.id === id)) return;
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

export interface SousGenre {
  id: string;
  nom: string;
  parent: string;
  naissance: number;
  /** Durée de vie totale en semaines. */
  duree: number;
  pic: number;
  /** Premier label à y avoir signé un artiste (`joueur`, `rival:n`) ou `null`. */
  premier: string | null;
}

/** Popularité d'un sous-genre : parabole qui monte, culmine à mi-vie et retombe. */
export function subgenrePopularity(sub: SousGenre, tick: number): number {
  const x = clamp((tick - sub.naissance) / sub.duree, 0, 1);
  return Math.round(sub.pic * 4 * x * (1 - x) * 10) / 10;
}

/** Naissance éventuelle d'un sous-genre fictif à partir d'un genre parent. */
function spawnSubgenre(state: LabelState, rng: Rng, tick: number): void {
  if (state.sousGenres.length >= SUBGENRES.maxAlive) return;
  if (!rng.chance(SUBGENRES.birthChance)) return;
  const parent = rng.pick(GENRE_IDS);
  const prefix = rng.pick(SUBGENRES.prefixes);
  const id = `sg-${state.nextId}`;
  state.nextId += 1;
  state.sousGenres.push({
    id,
    nom: `${prefix} ${fr.genres[parent]}`,
    parent,
    naissance: tick,
    duree: rng.int(SUBGENRES.lifespan.min, SUBGENRES.lifespan.max),
    pic: rng.int(SUBGENRES.peak.min, SUBGENRES.peak.max),
    premier: null,
  });
  const audience = state.marche.genres[parent]?.audience ?? 0;
  state.marche.genres[id] = {
    popularite: 0,
    base: 0,
    bruit: 0,
    audience: Math.round(audience * SUBGENRES.audienceShare),
  };
  state.label.credibilite[id] = 0;
}

/** Met à jour la popularité des sous-genres vivants et retire ceux qui ont disparu. */
function ageSubgenres(state: LabelState, tick: number, emit: (s: LabelSignal) => void): void {
  const alive: SousGenre[] = [];
  const removed = new Set<string>();
  for (const sub of state.sousGenres) {
    const genre = state.marche.genres[sub.id];
    if (tick - sub.naissance >= sub.duree || !genre) {
      removed.add(sub.id);
      emit({ kind: 'sous-genre-disparu', payload: { id: sub.id } });
      continue;
    }
    if (tick === sub.naissance) emit({ kind: 'sous-genre-ne', payload: { id: sub.id } });
    genre.popularite = subgenrePopularity(sub, tick);
    alive.push(sub);
  }
  state.sousGenres = alive;
  if (removed.size > 0)
    state.marche.genres = Object.fromEntries(
      Object.entries(state.marche.genres).filter(([id]) => !removed.has(id)),
    );
}

/** Premier signataire d'un sous-genre : bonus de crédibilité pour le joueur. */
export function claimSubgenre(state: LabelState, genreId: string, owner: string): boolean {
  const sub = state.sousGenres.find((s) => s.id === genreId);
  if (!sub || sub.premier !== null) return false;
  sub.premier = owner;
  if (owner === 'joueur')
    state.label.credibilite[genreId] = Math.min(
      100,
      (state.label.credibilite[genreId] ?? 0) + SUBGENRES.firstSignerCredibility,
    );
  return true;
}
