import type { Rng } from '@tycoon/core';
import { ALL_EXCLUSIONS } from './content/exclusions';
import { NOMS_DETOURNES, PARODIES, PRENOMS_DETOURNES } from './content/parodies';
import {
  ADJECTIVES,
  CITY_PARTS,
  FAMILY_NAMES,
  GIVEN_NAMES,
  LABEL_WORDS,
  NOUNS,
  ORIGINS,
  ORIGIN_STYLE_WEIGHTS,
  ORIGIN_WEIGHTS,
  type Origin,
  STAGE_PREFIXES,
  SYLLABLES,
  type StageStyle,
} from './content/names-data';

export type { Origin, StageStyle };

/** Forme comparable d'un nom : sans accents, en minuscules, sans espace ni ponctuation. */
export function normalizeForCompare(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

const EXCLUDED = new Set(ALL_EXCLUSIONS.map(normalizeForCompare));

/** Vrai si le nom ressemble trop à un vrai artiste, label ou ville de la liste d'exclusion. */
export const isExcluded = (name: string): boolean => EXCLUDED.has(normalizeForCompare(name));

const capitalize = (word: string): string =>
  word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);

export const pickOrigin = (rng: Rng): Origin => rng.pickWeighted(ORIGINS, (o) => ORIGIN_WEIGHTS[o]);

export function pickStyle(rng: Rng, origin: Origin): StageStyle {
  const weights = ORIGIN_STYLE_WEIGHTS[origin];
  const styles = Object.keys(weights) as StageStyle[];
  return rng.pickWeighted(styles, (s) => weights[s]);
}

export interface RealName {
  prenom: string;
  nom: string;
  origin: Origin;
}

/** Nom d'état civil, cohérent avec l'origine (prénom et nom de la même aire). */
export function generateRealName(rng: Rng, origin: Origin = pickOrigin(rng)): RealName {
  return { prenom: rng.pick(GIVEN_NAMES[origin]), nom: rng.pick(FAMILY_NAMES[origin]), origin };
}

type StagePattern =
  'syllabes' | 'compose' | 'prefixe' | 'initiales' | 'prenom-initiale' | 'prenom' | 'parodie';

/** Poids des façons de fabriquer un nom de scène, par style. */
const PATTERN_WEIGHTS: Readonly<Record<StageStyle, Readonly<Record<StagePattern, number>>>> = {
  urbain: {
    syllabes: 46,
    compose: 10,
    prefixe: 14,
    initiales: 14,
    'prenom-initiale': 14,
    prenom: 2,
    parodie: 30,
  },
  pop: {
    syllabes: 34,
    compose: 26,
    prefixe: 4,
    initiales: 4,
    'prenom-initiale': 28,
    prenom: 4,
    parodie: 40,
  },
  afro: {
    syllabes: 56,
    compose: 10,
    prefixe: 8,
    initiales: 6,
    'prenom-initiale': 16,
    prenom: 4,
    parodie: 16,
  },
  latino: {
    syllabes: 50,
    compose: 12,
    prefixe: 8,
    initiales: 6,
    'prenom-initiale': 20,
    prenom: 4,
    parodie: 18,
  },
};

const VOWELS = 'aeiouyéèêëïîôöûüàâ';
const isVowel = (char: string): boolean => char !== '' && VOWELS.includes(char.toLowerCase());

/** Colle deux syllabes sans produire de double voyelle (« Mi » + « ine » donne « Mine », pas « Miine »). */
function joinSyllables(left: string, right: string): string {
  if (isVowel(left.slice(-1)) && isVowel(right.charAt(0))) return left.slice(0, -1) + right;
  return left + right;
}

/** Nom de scène d'un mot, fabriqué en assemblant des syllabes propres au style. */
function syllableName(rng: Rng, style: StageStyle): string {
  const { onsets, middles, endings } = SYLLABLES[style];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let name = rng.pick(onsets);
    if (rng.chance(0.7)) {
      name = joinSyllables(name, rng.pick(middles));
      if (rng.chance(0.2)) name = joinSyllables(name, rng.pick(middles));
    }
    name = capitalize(joinSyllables(name, rng.pick(endings)).toLowerCase());
    if (name.length <= 10) return name;
  }
  return capitalize(rng.pick(onsets).toLowerCase() + rng.pick(endings));
}

/** Initiales prononçables : consonne, voyelle ou consonne, consonne (« KZR », « DMO »). */
function initialsName(rng: Rng): string {
  const consonants = 'BDFGKLMNPRSTVXZ';
  const mixed = 'BDFGKLMNPRSTVXZAEIOU';
  const length = rng.chance(0.6) ? 3 : 2;
  let out = consonants.charAt(rng.int(0, consonants.length - 1));
  for (let i = 1; i < length; i += 1) out += mixed.charAt(rng.int(0, mixed.length - 1));
  return out;
}

/** Tire des noms jusqu'à en obtenir un hors de la liste d'exclusion (borné : la liste est minuscule face au choix). */
function allowed(make: () => string): string {
  let name = make();
  for (let attempt = 0; attempt < 50 && isExcluded(name); attempt += 1) name = make();
  if (isExcluded(name))
    throw new RangeError("Impossible de générer un nom hors de la liste d'exclusion");
  return name;
}

/** Nom de scène. `real` permet les noms construits à partir de l'état civil (« Léa D. »). */
function rawStageName(rng: Rng, style: StageStyle, real?: RealName): string {
  const weights = PATTERN_WEIGHTS[style];
  const patterns = Object.keys(weights) as StagePattern[];
  const pattern = rng.pickWeighted(patterns, (p) => weights[p]);
  switch (pattern) {
    case 'syllabes':
      return syllableName(rng, style);
    case 'compose': {
      const noun = rng.pick(NOUNS);
      const adjective = rng.pick(ADJECTIVES);
      return `${noun.w} ${noun.g === 'f' ? adjective.f : adjective.m}`;
    }
    case 'prefixe':
      return `${rng.pick(STAGE_PREFIXES)} ${syllableName(rng, style)}`;
    case 'initiales':
      return initialsName(rng);
    case 'prenom-initiale': {
      const name = real ?? generateRealName(rng);
      return `${name.prenom} ${name.nom.charAt(0).toUpperCase()}.`;
    }
    case 'prenom':
      return (real ?? generateRealName(rng)).prenom;
    case 'parodie':
      return rng.chance(0.5)
        ? rng.pick(PARODIES[style])
        : `${rng.pick(PRENOMS_DETOURNES)} ${rng.pick(NOMS_DETOURNES)}`;
  }
}

/** Nom de scène hors liste d'exclusion. `real` permet les noms construits à partir de l'état civil. */
export const generateStageName = (rng: Rng, style: StageStyle, real?: RealName): string =>
  allowed(() => rawStageName(rng, style, real));

/** Nom de ville fictive (« Port-Lune », « Mont-Marais-sur-Mer », « Vendel »). */
function rawCityName(rng: Rng): string {
  const prefix = rng.chance(0.55) ? rng.pick(CITY_PARTS.prefixes) : '';
  const root = rng.pick(CITY_PARTS.roots);
  const suffix = rng.pick(CITY_PARTS.suffixes);
  return `${prefix}${root}${suffix}`;
}

/** Nom de ville fictive hors liste d'exclusion. */
export const generateCityName = (rng: Rng): string => allowed(() => rawCityName(rng));

/** Nom de label : « Maison Encre », « Vinyle Records », « Aube & Quai »… */
function rawLabelName(rng: Rng): string {
  const { prefixes, cores, suffixes, connectors } = LABEL_WORDS;
  const shape = rng.pickWeighted(
    ['prefixe', 'suffixe', 'duo', 'trio'] as const,
    (s) => ({ prefixe: 30, suffixe: 30, duo: 28, trio: 12 })[s],
  );
  const core = rng.pick(cores);
  switch (shape) {
    case 'prefixe':
      return `${rng.pick(prefixes)} ${core}`;
    case 'suffixe':
      return `${core} ${rng.pick(suffixes)}`;
    case 'duo': {
      const other = rng.pick(cores.filter((c) => c !== core));
      return `${core} ${rng.pick(connectors)} ${other}`;
    }
    case 'trio':
      return `${rng.pick(prefixes)} ${core} ${rng.pick(suffixes)}`;
  }
}

const ROMAN = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

/**
 * Génère un nom qui n'est ni exclu ni déjà pris (`taken` contient des formes normalisées, voir
 * `normalizeForCompare`). Après `tries` essais infructueux, ajoute un numéro (« Zaro II »).
 * Le nom retenu n'est pas ajouté à `taken` : c'est à l'appelant de le faire.
 */
export function uniqueName(generate: () => string, taken: ReadonlySet<string>, tries = 40): string {
  const usable = (name: string): boolean =>
    !isExcluded(name) && !taken.has(normalizeForCompare(name));
  let last = generate();
  for (let attempt = 0; attempt < tries; attempt += 1) {
    if (usable(last)) return last;
    last = generate();
  }
  for (const numeral of ROMAN) {
    const candidate = `${last} ${numeral}`;
    if (usable(candidate)) return candidate;
  }
  throw new RangeError('Impossible de trouver un nom libre');
}

/** Nom de label hors liste d'exclusion. */
export const generateLabelName = (rng: Rng): string => allowed(() => rawLabelName(rng));
