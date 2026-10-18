import { type Rng, clamp, exp, ln } from '@tycoon/core';
import {
  DYNAMIC_START,
  EGO_PER_NOTORIETY_10,
  HIDDEN,
  LEVELS,
  LEVEL_WEIGHTS,
  NOTORIETY_MAX_FANS,
  PEAK_AGE,
  PEAK_AGE_BOUNDS,
  PEAK_AGE_SD,
  SECONDARY_GENRE,
  STREET_CRED_MEAN,
  STREET_CRED_SD,
  TRAIT_COUNT_WEIGHTS,
  type TalentLevel,
} from './balance';
import { GENRES, type BaseGenreId, type GenreFamily } from './content/genres';
import { TRAITS, TRAIT_IDS, type TraitId } from './content/traits';
import { type MarketState, genreKeys } from './market';
import {
  type Origin,
  type StageStyle,
  generateRealName,
  generateStageName,
  normalizeForCompare,
  pickOrigin,
  pickStyle,
  uniqueName,
} from './naming';

export type CareerPhase = 'emergent' | 'montee' | 'pic' | 'plateau' | 'declin' | 'culte';

/**
 * Un artiste, fictif et généré. Tous les attributs sont des entiers (0-100 sauf indication).
 * - visibles après repérage : plume, flow, voix, charisme, scene ;
 * - cachés jusqu'à un repérage poussé : potentiel, ethique, ego, loyaute, polyvalence, agePic ;
 * - dynamiques : hype, moral, fatigue, fanbase (nombre de fans), rue, affinite (-100 à 100).
 * La notoriété n'est pas stockée : elle se déduit de la fanbase (`notoriety`).
 */
export interface Artist {
  id: number;
  nomScene: string;
  prenom: string;
  nom: string;
  origine: Origin;
  ville: string;
  age: number;
  /** Genre principal (identifiant de genre ou de sous-genre). */
  genre: string;
  genresSecondaires: string[];
  traits: TraitId[];
  /** Niveau à la génération (indicatif, la carrière évolue ensuite). */
  niveau: TalentLevel;

  plume: number;
  flow: number;
  voix: number;
  charisme: number;
  scene: number;

  potentiel: number;
  ethique: number;
  ego: number;
  loyaute: number;
  polyvalence: number;

  phase: CareerPhase;
  /** Nombre de retours en grâce déjà vécus. */
  retours: number;
  /** Âge du pic de carrière (caché). */
  agePic: number;

  hype: number;
  moral: number;
  fatigue: number;
  fanbase: number;
  /** Crédibilité de rue. */
  rue: number;
  /** Affinité avec le label du joueur (-100 à 100) : baisse après une offre insultante. */
  affinite: number;
  /** « libre », « joueur » ou l'identifiant d'un rival (« rival:3 »). */
  employeur: string;
  /** Semaines de repos forcé restantes (après un burnout) : pas de concert ni de tournée. */
  repos: number;
}

/** Notoriété (0-100), échelle logarithmique de la fanbase : 0 sans fan, 100 à `NOTORIETY_MAX_FANS`. */
export function notoriety(fans: number): number {
  if (fans <= 0) return 0;
  return clamp((100 * ln(1 + fans)) / ln(1 + NOTORIETY_MAX_FANS), 0, 100);
}

/** Phase de carrière d'un artiste de cet âge dont le pic est à `agePic`. */
export function careerPhaseFor(age: number, agePic: number, level: TalentLevel): CareerPhase {
  if (level === 'amateur') return 'emergent';
  const gap = age - agePic;
  if (gap < -6) return 'emergent';
  if (gap < -2) return 'montee';
  if (gap <= 2) return 'pic';
  if (gap <= 7) return 'plateau';
  return 'declin';
}

export interface GenerationContext {
  /** Identifiant fourni par l'appelant (`newId`). */
  id: number;
  market: MarketState;
  /** Villes du monde. */
  cities: readonly string[];
  /** Noms de scène déjà pris, sous forme normalisée (`normalizeForCompare`). */
  takenNames: ReadonlySet<string>;
}

export interface GenerationOptions {
  level?: TalentLevel;
  genre?: string;
  origin?: Origin;
  ville?: string;
}

const LEVEL_IDS = Object.keys(LEVELS) as TalentLevel[];

/** Bonus de style sur la famille de genre : un style « afro » tire vers les genres afro, etc. */
const STYLE_FAMILY_BOOST: Readonly<
  Record<StageStyle, Readonly<Partial<Record<GenreFamily, number>>>>
> = {
  urbain: { urbain: 3, afro: 1.2 },
  pop: { pop: 3, electro: 2 },
  afro: { afro: 3, urbain: 1.2 },
  latino: { latino: 4, pop: 1.2 },
};

const familyOf = (genre: string): GenreFamily => GENRES[genre as BaseGenreId]?.famille ?? 'urbain';
const vocalOf = (genre: string) => GENRES[genre as BaseGenreId]?.vocal ?? 'mixte';

const round = (x: number): number => Math.round(x);
const score = (x: number): number => clamp(round(x), 0, 100);

function pickGenre(
  rng: Rng,
  market: MarketState,
  style: StageStyle,
  exclude: readonly string[] = [],
): string {
  const keys = genreKeys(market).filter((key) => !exclude.includes(key));
  return rng.pickWeighted(keys, (key) => {
    const audience = market.genres[key]?.audience ?? 0;
    return audience * (STYLE_FAMILY_BOOST[style][familyOf(key)] ?? 1);
  });
}

function pickTraits(rng: Rng): TraitId[] {
  const count = rng.pickWeighted([1, 2, 3] as const, (n) => TRAIT_COUNT_WEIGHTS[n]);
  const chosen: TraitId[] = [];
  let pool: readonly TraitId[] = TRAIT_IDS;
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const trait = rng.pick(pool);
    chosen.push(trait);
    const def = TRAITS[trait];
    // Retire le trait choisi et tous ceux qui sont incompatibles avec lui
    pool = pool.filter(
      (t) =>
        t !== trait && !def.incompatibles.includes(t) && !TRAITS[t].incompatibles.includes(trait),
    );
  }
  return chosen;
}

/** Fabrique un artiste fictif. Aucune source de hasard hors du `Rng` fourni : reproductible. */
export function generateArtist(
  rng: Rng,
  ctx: GenerationContext,
  options: GenerationOptions = {},
): Artist {
  const niveau = options.level ?? rng.pickWeighted(LEVEL_IDS, (l) => LEVEL_WEIGHTS[l]);
  const profile = LEVELS[niveau];
  const origine = options.origin ?? pickOrigin(rng);
  const real = generateRealName(rng, origine);
  const style = pickStyle(rng, origine);
  const genre = options.genre ?? pickGenre(rng, ctx.market, style);
  const family = familyOf(genre);
  const vocal = vocalOf(genre);

  // Compétences visibles : le genre favorise le flow, la voix, ou les deux
  const vocalShift = {
    flow: vocal === 'flow' ? 6 : vocal === 'voix' ? -12 : -2,
    voix: vocal === 'voix' ? 6 : vocal === 'flow' ? -12 : -2,
  };
  const skill = (shift = 0): number =>
    score(rng.gaussian(profile.skillMean + shift, profile.skillSd));
  const plume = skill();
  const flow = skill(vocalShift.flow);
  const voix = skill(vocalShift.voix);
  const charisme = skill();
  const scene = skill();

  const average = (plume + Math.max(flow, voix) + charisme + scene) / 4;
  const potentiel = Math.max(
    score(average + profile.potentialMargin + rng.gaussian(0, 8)),
    round(average),
  );

  const fanbase = round(exp(rng.range(ln(profile.fansMin), ln(profile.fansMax))));
  const notorietyNow = notoriety(fanbase);

  const traits = pickTraits(rng);
  const traitSum = (key: 'ego' | 'ethique' | 'loyaute'): number =>
    traits.reduce((sum, t) => sum + (TRAITS[t][key] ?? 0), 0);
  const hidden = (key: keyof typeof HIDDEN): number =>
    rng.gaussian(HIDDEN[key].mean, HIDDEN[key].sd);

  const polyvalence = score(hidden('polyvalence'));
  const ethique = score(hidden('ethique') + traitSum('ethique'));
  const ego = score(hidden('ego') + traitSum('ego') + (notorietyNow / 10) * EGO_PER_NOTORIETY_10);
  const loyaute = score(hidden('loyaute') + traitSum('loyaute'));

  const age = rng.int(profile.ageMin, profile.ageMax);
  const agePic = round(
    clamp(rng.gaussian(PEAK_AGE[family], PEAK_AGE_SD), PEAK_AGE_BOUNDS.min, PEAK_AGE_BOUNDS.max),
  );

  // Genres secondaires : plus probables pour un artiste polyvalent
  const secondary: string[] = [];
  const pSecondary = SECONDARY_GENRE.base + SECONDARY_GENRE.perPolyvalence * polyvalence;
  if (rng.chance(pSecondary)) {
    secondary.push(pickGenre(rng, ctx.market, style, [genre]));
    if (rng.chance(SECONDARY_GENRE.second))
      secondary.push(pickGenre(rng, ctx.market, style, [genre, ...secondary]));
  }

  const nomScene = uniqueName(() => generateStageName(rng, style, real), ctx.takenNames);

  return {
    id: ctx.id,
    nomScene,
    prenom: real.prenom,
    nom: real.nom,
    origine,
    ville: options.ville ?? rng.pick(ctx.cities),
    age,
    genre,
    genresSecondaires: secondary,
    traits,
    niveau,
    plume,
    flow,
    voix,
    charisme,
    scene,
    potentiel,
    ethique,
    ego,
    loyaute,
    polyvalence,
    phase: careerPhaseFor(age, agePic, niveau),
    retours: 0,
    agePic,
    hype: score(profile.hype + rng.gaussian(0, 3)),
    moral: DYNAMIC_START.moral,
    fatigue: DYNAMIC_START.fatigue,
    fanbase,
    rue: score(rng.gaussian(STREET_CRED_MEAN[family], STREET_CRED_SD)),
    affinite: DYNAMIC_START.affinite,
    employeur: 'libre',
    repos: 0,
  };
}

/** Clés normalisées des noms de scène déjà utilisés, pour `GenerationContext.takenNames`. */
export const takenStageNames = (artists: readonly Artist[]): Set<string> =>
  new Set(artists.map((a) => normalizeForCompare(a.nomScene)));
