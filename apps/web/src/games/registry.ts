import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { purgerParties } from './label-tycoon/sauvegardes/stockage';

/** Props reçues par chaque jeu. Un jeu lit et écrit sa sauvegarde avec `useGameSave(slug)`. */
export interface GameProps {
  slug: string;
}

/**
 * Nettoyage des données qu'un jeu range hors du compte (IndexedDB…) : appelé quand le joueur efface
 * la sauvegarde d'un jeu ou supprime son compte, pour ne rien laisser derrière.
 */
export const PURGES: Readonly<Record<string, (compte: string) => Promise<void>>> = {
  'label-tycoon': (compte) => purgerParties(compte),
};

/**
 * Registre des jeux jouables. Chaque jeu est un module indépendant, chargé à la demande :
 * il n'est téléchargé que quand le joueur ouvre sa page.
 *
 * Ajouter un jeu jouable :
 *   1. créer `src/games/<slug>/index.tsx` qui exporte son composant par défaut ;
 *   2. l'enregistrer ici : `'<slug>': lazy(() => import('./<slug>')),`
 *   3. passer son statut à « Disponible » dans `data/games.ts`.
 */
export const GAME_MODULES: Partial<Record<string, LazyExoticComponent<ComponentType<GameProps>>>> =
  {
    'label-tycoon': lazy(() => import('./label-tycoon')),
  };
