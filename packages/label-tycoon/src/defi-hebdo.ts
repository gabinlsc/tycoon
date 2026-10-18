import type { DifficultySettings } from './config';
import { GENRE_IDS } from './content/genres';
import { estDefiHebdo } from './defi-date';
import type { LabelAction } from './actions';
import type { LabelState } from './state';

export type ContrainteId =
  | 'sans-emprunt'
  | 'roster-reduit'
  | 'un-genre'
  | 'budget-serre'
  | 'sans-concerts'
  | 'rivaux-aguerris';

export interface ContrainteDef {
  nom: string;
  description: string;
}

export const CONTRAINTES: Readonly<Record<ContrainteId, ContrainteDef>> = {
  'sans-emprunt': {
    nom: 'Sans crédit',
    description: 'Aucun prêt bancaire cette semaine : le label doit se financer seul.',
  },
  'roster-reduit': {
    nom: 'Écurie réduite',
    description: 'Trois artistes sous contrat au plus, quel que soit le palier.',
  },
  'un-genre': {
    nom: 'Un seul genre',
    description: 'Seuls les artistes du genre de la semaine peuvent être signés.',
  },
  'budget-serre': {
    nom: 'Budget serré',
    description: 'Le capital de départ est divisé par deux.',
  },
  'sans-concerts': {
    nom: 'Sans scène',
    description: 'Les concerts sont interdits : tout repose sur les sorties.',
  },
  'rivaux-aguerris': {
    nom: 'Rivaux aguerris',
    description: 'Les labels rivaux sont presque deux fois plus agressifs.',
  },
};

const ORDRE: readonly ContrainteId[] = [
  'sans-emprunt',
  'roster-reduit',
  'un-genre',
  'budget-serre',
  'sans-concerts',
  'rivaux-aguerris',
];

/** Empreinte stable d'une chaîne (FNV-1a) : le choix de la contrainte ne dépend que de l'identifiant. */
function empreinte(texte: string): number {
  let h = 0x811c9dc5;
  for (const c of texte) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export interface ContrainteDeLaSemaine {
  id: ContrainteId;
  /** Genre imposé (contrainte « un seul genre »). */
  genre?: string;
}

/** Contrainte d'une semaine de défi : la même pour tous les joueurs. */
export function contrainteDeLaSemaine(semaine: string): ContrainteDeLaSemaine {
  const id = ORDRE[empreinte(`contrainte:${semaine}`) % ORDRE.length] ?? 'sans-emprunt';
  if (id !== 'un-genre') return { id };
  return { id, genre: GENRE_IDS[empreinte(`genre:${semaine}`) % GENRE_IDS.length] ?? 'rap' };
}

/** Contrainte en vigueur dans une partie : seulement pour un défi de la semaine. */
export function contrainteActive(state: LabelState): ContrainteDeLaSemaine | null {
  const id = state.config.defiDate;
  return state.config.mode === 'defi' && id !== undefined && estDefiHebdo(id)
    ? contrainteDeLaSemaine(id)
    : null;
}

/** Réglages de difficulté imposés par la contrainte de la semaine (les autres contraintes se font respecter en jeu). */
export function difficulteDeLaSemaine(
  base: DifficultySettings,
  semaine: string,
): DifficultySettings {
  const c = contrainteDeLaSemaine(semaine).id;
  if (c === 'budget-serre') return { ...base, startingCash: base.startingCash * 0.5 };
  if (c === 'rivaux-aguerris') return { ...base, rivalAggression: base.rivalAggression * 1.8 };
  return base;
}

/** Motif de refus d'une action au regard de la contrainte de la semaine, ou `null`. */
export function refusDeContrainte(
  state: LabelState,
  action: LabelAction,
): { code: string; params?: Record<string, string | number> } | null {
  const c = contrainteActive(state);
  if (!c) return null;
  switch (c.id) {
    case 'sans-emprunt':
      return action.type === 'emprunter' ? { code: 'contrainte-sans-emprunt' } : null;
    case 'sans-concerts':
      return action.type === 'organiser-concert' ? { code: 'contrainte-sans-concerts' } : null;
    case 'un-genre': {
      if (action.type !== 'signer' && action.type !== 'proposer' && action.type !== 'encherir')
        return null;
      const artiste = state.artistes.find((a) => a.id === action.artisteId);
      return artiste && artiste.genre !== c.genre
        ? { code: 'contrainte-un-genre', params: { genre: c.genre ?? '' } }
        : null;
    }
    default:
      return null;
  }
}

/** Plafond d'artistes imposé par la contrainte « écurie réduite ». */
export const PLAFOND_ECURIE_REDUITE = 3;
