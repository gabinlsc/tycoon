import { RIVAL_RELEASES } from './balance';
import type { LabelState } from './state';

/** Sortie planifiée par un rival. */
export interface SortieRivale {
  id: number;
  rivalId: number;
  genre: string;
  semaine: number;
  poids: number;
  /** Visible à l'avance par le joueur. */
  annoncee: boolean;
  /** Artiste du rival concerné, `null` pour une sortie anonyme. */
  artisteId: number | null;
}

/** Facteur d'exposition de la semaine 1 : réduit si une grosse sortie rivale tombe le même jour dans le même genre. */
export function collisionFactor(state: LabelState, genre: string, week: number): number {
  const clash = state.sortiesRivales.some(
    (s) => s.genre === genre && s.semaine === week && s.poids >= RIVAL_RELEASES.bigWeight,
  );
  return clash ? RIVAL_RELEASES.collisionFactor : 1;
}

/** Sorties annoncées à partir d'une semaine : ce que le joueur peut voir pour contourner. */
export function announcedReleases(state: LabelState, fromWeek: number): SortieRivale[] {
  return state.sortiesRivales
    .filter((s) => s.annoncee && s.semaine >= fromWeek)
    .sort((a, b) => a.semaine - b.semaine || a.id - b.id);
}
