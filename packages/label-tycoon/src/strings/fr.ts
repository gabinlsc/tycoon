import type { GameMode } from '../config';
import type { TierId } from '../balance/tiers';
import type { BaseGenreId, GenreFamily } from '../content/genres';

/**
 * Toutes les chaînes affichées du jeu, en français. Aucune chaîne n'est écrite en dur dans les
 * composants ni dans les règles : à terme, une autre langue se branche en fournissant un autre
 * objet du même type (`Strings`). Les chaînes à variables sont des fonctions typées.
 */
export const fr = {
  tiers: {
    'home-studio': 'Home-studio',
    independant: 'Label indépendant',
    etabli: 'Label établi',
    major: 'Major',
  } satisfies Record<TierId, string>,

  genres: {
    rap: 'Rap',
    drill: 'Drill',
    trap: 'Trap',
    afro: 'Afro',
    rnb: 'R&B',
    'pop-urbaine': 'Pop urbaine',
    'electro-pop': 'Électro-pop',
    latino: 'Trap latin',
    variete: 'Variété contemporaine',
    dancehall: 'Dancehall',
  } satisfies Record<BaseGenreId, string>,

  famillesDeGenre: {
    urbain: 'Musiques urbaines',
    pop: 'Pop',
    afro: 'Afro et caribéen',
    latino: 'Latino',
    electro: 'Électro',
  } satisfies Record<GenreFamily, string>,

  modes: {
    carriere: 'Carrière',
    scenario: 'Scénario',
    'bac-a-sable': 'Bac à sable',
    defi: 'Défi du jour',
    tutoriel: 'Tutoriel',
  } satisfies Record<GameMode, string>,

  difficulte: {
    facile: 'Facile',
    normal: 'Normal',
    difficile: 'Difficile',
  },

  /** Refus d'actions, par code (voir `Rejection.code` du moteur). */
  refus: {
    'action-inconnue': (p: { type: string }) => `Action inconnue : ${p.type}.`,
    'nom-vide': () => 'Donne un nom à ton label.',
    'nom-trop-long': (p: { max: number }) =>
      `Le nom du label ne peut pas dépasser ${p.max} caractères.`,
    'decision-introuvable': () => "Cette décision n'existe plus.",
    'choix-inconnu': () => "Ce choix n'existe pas.",
    'choix-indisponible': () => "Ce choix n'est pas disponible pour le moment.",
  },
} as const;

export type Strings = typeof fr;
