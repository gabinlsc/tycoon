/**
 * Genres de départ : ancrés dans la musique urbaine et pop actuelle, avec des noms génériques.
 * Les sous-genres fictifs naissent plus tard de ces genres parents (voir `feat/label-sous-genres`).
 *
 * Les noms affichés vivent dans `strings/fr.ts`, pas ici.
 */

export const GENRE_IDS = [
  'rap',
  'drill',
  'trap',
  'afro',
  'rnb',
  'pop-urbaine',
  'electro-pop',
  'latino',
  'variete',
  'dancehall',
] as const;

export type BaseGenreId = (typeof GENRE_IDS)[number];

export type GenreFamily = 'urbain' | 'pop' | 'afro' | 'latino' | 'electro';

/** Attribut qui porte le talent vocal d'un artiste dans ce genre (voir GDD, 5.5). */
export type VocalAxis = 'flow' | 'voix' | 'mixte';

export interface GenreDef {
  id: BaseGenreId;
  famille: GenreFamily;
  vocal: VocalAxis;
  /** Audience potentielle hebdomadaire de base (auditeurs), avant tendance et découverte. */
  audience: number;
  /** Popularité de départ (0-100). */
  popularite: number;
  /** Popularité vers laquelle le genre revient à long terme (0-100). */
  moyenne: number;
  /** Amplitude des variations de popularité d'une semaine à l'autre (écart-type, en points). */
  volatilite: number;
  /** Poids de `plume` dans le talent artistique (le reste revient à l'axe vocal). */
  poidsPlume: number;
}

export const GENRES: Readonly<Record<BaseGenreId, GenreDef>> = {
  rap: {
    id: 'rap',
    famille: 'urbain',
    vocal: 'flow',
    audience: 900_000,
    popularite: 62,
    moyenne: 60,
    volatilite: 1.2,
    poidsPlume: 0.5,
  },
  drill: {
    id: 'drill',
    famille: 'urbain',
    vocal: 'flow',
    audience: 450_000,
    popularite: 55,
    moyenne: 48,
    volatilite: 2.2,
    poidsPlume: 0.35,
  },
  trap: {
    id: 'trap',
    famille: 'urbain',
    vocal: 'flow',
    audience: 700_000,
    popularite: 58,
    moyenne: 55,
    volatilite: 1.7,
    poidsPlume: 0.35,
  },
  afro: {
    id: 'afro',
    famille: 'afro',
    vocal: 'mixte',
    audience: 800_000,
    popularite: 64,
    moyenne: 58,
    volatilite: 1.8,
    poidsPlume: 0.3,
  },
  rnb: {
    id: 'rnb',
    famille: 'pop',
    vocal: 'voix',
    audience: 500_000,
    popularite: 50,
    moyenne: 50,
    volatilite: 1.1,
    poidsPlume: 0.4,
  },
  'pop-urbaine': {
    id: 'pop-urbaine',
    famille: 'pop',
    vocal: 'mixte',
    audience: 1_100_000,
    popularite: 60,
    moyenne: 60,
    volatilite: 1,
    poidsPlume: 0.35,
  },
  'electro-pop': {
    id: 'electro-pop',
    famille: 'electro',
    vocal: 'voix',
    audience: 600_000,
    popularite: 48,
    moyenne: 50,
    volatilite: 1.5,
    poidsPlume: 0.25,
  },
  latino: {
    id: 'latino',
    famille: 'latino',
    vocal: 'mixte',
    audience: 650_000,
    popularite: 56,
    moyenne: 54,
    volatilite: 1.6,
    poidsPlume: 0.3,
  },
  variete: {
    id: 'variete',
    famille: 'pop',
    vocal: 'voix',
    audience: 700_000,
    popularite: 45,
    moyenne: 46,
    volatilite: 0.7,
    poidsPlume: 0.55,
  },
  dancehall: {
    id: 'dancehall',
    famille: 'afro',
    vocal: 'flow',
    audience: 300_000,
    popularite: 42,
    moyenne: 42,
    volatilite: 1.9,
    poidsPlume: 0.25,
  },
};
