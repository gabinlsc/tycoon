import { type Phase } from '@tycoon/core';
import { RIVAL_RELEASES } from './balance';
import { genreKeys } from './market';
import type { LabelSignal } from './pipeline';
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

/** Phase « rivaux » : planifie des sorties et purge les anciennes. */
export const rivalsPhase: Phase<LabelState, LabelSignal> = {
  name: 'rivaux',
  run(state, ctx) {
    const rng = ctx.rng('rivaux');
    const aggression = state.config.difficulty.rivalAggression;
    const genres = genreKeys(state.marche);
    for (const rival of state.rivaux) {
      if (!rng.chance(Math.min(1, RIVAL_RELEASES.weeklyChance * aggression))) continue;
      const genre = rng.pickWeighted(genres, (g) => state.marche.genres[g]?.audience ?? 1);
      state.sortiesRivales.push({
        id: state.nextId,
        rivalId: rival.id,
        genre,
        semaine: ctx.tick + rng.int(RIVAL_RELEASES.leadWeeks.min, RIVAL_RELEASES.leadWeeks.max),
        poids: rng.pick(RIVAL_RELEASES.weights),
        annoncee: rng.chance(RIVAL_RELEASES.announceChance),
      });
      state.nextId += 1;
    }
    state.sortiesRivales = state.sortiesRivales.filter(
      (s) => s.semaine >= ctx.tick - RIVAL_RELEASES.keepWeeks,
    );
  },
};
