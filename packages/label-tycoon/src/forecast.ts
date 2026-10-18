import { type ActionHandler, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { INTEL } from './balance';
import { canAfford, spend } from './finance';
import { cyclicPopularity, genreKeys, subgenrePopularity } from './market';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Prévision de popularité d'un genre : une valeur bruitée et la marge d'erreur annoncée. */
export interface Prevision {
  genre: string;
  faiteLe: number;
  pour: number;
  valeur: number;
  marge: number;
}

/** Niveau de l'analyste : le meilleur dénicheur employé (0 sans équipe). */
export const analystLevel = (state: LabelState): number =>
  state.denicheurs.reduce((best, d) => Math.max(best, d.niveau), 0);

/** Écart-type de l'erreur de prévision, proportionnel à la qualité de l'analyste. */
export const forecastError = (level: number): number =>
  INTEL.baseError * (1 - (INTEL.maxReduction * clamp(level, 0, 100)) / 100);

/** Popularité attendue (sans bruit) d'un genre à une semaine donnée. */
export function expectedPopularity(state: LabelState, genre: string, week: number): number {
  const sub = state.sousGenres.find((s) => s.id === genre);
  if (sub) return subgenrePopularity(sub, week);
  const index = genreKeys(state.marche).indexOf(genre);
  const base = state.marche.genres[genre]?.base ?? 50;
  return clamp(cyclicPopularity(base, Math.max(0, index), week), 0, 100);
}

export interface StudyAction extends Action {
  readonly type: 'etude-marche';
  readonly genre: string;
  readonly horizon: number;
}

export const marketStudy: ActionHandler<LabelState, StudyAction, LabelSignal> = {
  validate(state, action) {
    if (!state.marche.genres[action.genre]) return reject('genre-inconnu');
    if (!INTEL.horizons.includes(action.horizon)) return reject('horizon-invalide');
    const cost = cents(INTEL.studyCost);
    return canAfford(state, cost) ? null : reject('fonds-insuffisants', { besoin: cost });
  },
  apply(state, action, ctx) {
    spend(state, 'reperage', cents(INTEL.studyCost));
    const sd = forecastError(analystLevel(state));
    const pour = ctx.tick + action.horizon;
    const truth = expectedPopularity(state, action.genre, pour);
    const valeur = Math.round(clamp(truth + ctx.rng('marche').gaussian(0, sd), 0, 100));
    state.previsions.push({
      genre: action.genre,
      faiteLe: ctx.tick,
      pour,
      valeur,
      marge: Math.round(2 * sd),
    });
    state.previsions = state.previsions.slice(-INTEL.keep);
    ctx.emit({ kind: 'prevision', payload: { genre: action.genre, pour } });
  },
};
