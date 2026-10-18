import { type ActionHandler, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { BANKRUPTCY } from './balance';
import { fairAdvance } from './contracts';
import { earn } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Faillite {
  /** Semaines consécutives de trésorerie négative. */
  semaines: number;
  /** Vrai quand la partie est perdue. */
  terminee: boolean;
}

/** Semaines restantes avant la faillite (huit moins le compteur). */
export const weeksLeft = (state: LabelState): number =>
  Math.max(0, BANKRUPTCY.weeks - state.faillite.semaines);

export const isBankrupt = (state: LabelState): boolean => state.faillite.terminee;

/**
 * Compteur de faillite : une semaine de plus à chaque fin de semaine en négatif, remis à zéro dès
 * que la trésorerie redevient positive. Au bout de huit semaines la partie est perdue.
 */
export function bankruptcyWeek(state: LabelState, emit: (s: LabelSignal) => void): void {
  if (state.faillite.terminee) return;
  if (state.label.tresorerie >= 0 || state.config.sandbox) {
    state.faillite.semaines = 0;
    return;
  }
  state.faillite.semaines += 1;
  if (state.faillite.semaines >= BANKRUPTCY.weeks) {
    state.faillite.terminee = true;
    emit({ kind: 'faillite', payload: {}, interrupt: true } as LabelSignal);
  } else {
    emit({
      kind: 'alerte-faillite',
      payload: { restantes: weeksLeft(state) },
      interrupt: true,
    } as LabelSignal);
  }
}

export interface SellContractAction extends Action {
  readonly type: 'vendre-contrat';
  readonly artisteId: number;
  readonly rivalId: number;
}

/** Prix qu'un rival paie pour reprendre un contrat : avance juste × durée du contrat × facteur. */
export function contractPrice(state: LabelState, artisteId: number): number {
  const contract = state.contrats.find((c) => c.artisteId === artisteId);
  const artist = state.artistes.find((a) => a.id === artisteId);
  if (!contract || !artist) return 0;
  return Math.round(
    fairAdvance(artist) * contract.clauses.dureeAnnees * BANKRUPTCY.contractSaleFactor,
  );
}

export const sellContract: ActionHandler<LabelState, SellContractAction, LabelSignal> = {
  validate(state, action) {
    if (!state.contrats.some((c) => c.artisteId === action.artisteId))
      return reject('contrat-introuvable');
    return state.rivaux.some((r) => r.id === action.rivalId) ? null : reject('rival-introuvable');
  },
  apply(state, action, ctx) {
    const price = cents(contractPrice(state, action.artisteId));
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    state.contrats = state.contrats.filter((c) => c.artisteId !== action.artisteId);
    if (artist) artist.employeur = `rival:${action.rivalId}`;
    if (price > 0) earn(state, 'cessions', price);
    ctx.emit({
      kind: 'contrat-vendu',
      payload: { artisteId: action.artisteId, rivalId: action.rivalId },
    });
  },
};
