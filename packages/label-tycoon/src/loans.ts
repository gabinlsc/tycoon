import { type ActionHandler, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { LOANS } from './balance';
import { annualRevenue, canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Pret {
  id: number;
  /** Capital restant dû. */
  restant: number;
  /** Capital emprunté. */
  capital: number;
  tauxBps: number;
  semainesRestantes: number;
}

/** Historique de crédit du label. */
export interface Credit {
  impayes: number;
  rembourses: number;
}

/** Taux annuel proposé (points de base), selon la réputation et l'historique d'impayés. */
export function loanRate(reputation: number, impayes: number): number {
  return Math.max(
    LOANS.minRateBps,
    LOANS.baseRateBps -
      Math.round(LOANS.rateDiscountPerReputationBps * reputation) +
      LOANS.defaultPenaltyBps * impayes,
  );
}

/** Encours total. */
export const outstanding = (state: LabelState): number =>
  state.prets.reduce((sum, p) => sum + p.restant, 0);

/** Plafond d'encours du label. */
export function loanCap(state: LabelState): number {
  const revenue = annualRevenue(state);
  return Math.round(
    (LOANS.capFloor + revenue * LOANS.capRevenueShare) *
      (1 + LOANS.capReputationBonus * state.label.reputation),
  );
}

export interface BorrowAction extends Action {
  readonly type: 'emprunter';
  readonly montant: number;
  readonly semaines: number;
}
export interface RepayAction extends Action {
  readonly type: 'rembourser-pret';
  readonly pretId: number;
}

export const borrow: ActionHandler<LabelState, BorrowAction, LabelSignal> = {
  validate(state, action) {
    if (!Number.isInteger(action.montant) || action.montant < LOANS.minAmount)
      return reject('montant-invalide');
    if (
      !Number.isInteger(action.semaines) ||
      action.semaines < LOANS.weeks.min ||
      action.semaines > LOANS.weeks.max
    )
      return reject('duree-invalide', { min: LOANS.weeks.min, max: LOANS.weeks.max });
    if (state.prets.length >= LOANS.maxActive)
      return reject('trop-de-prets', { max: LOANS.maxActive });
    if (outstanding(state) + action.montant > loanCap(state))
      return reject('plafond-depasse', { max: loanCap(state) });
    return null;
  },
  apply(state, action) {
    state.prets.push({
      id: state.nextId,
      restant: action.montant,
      capital: action.montant,
      tauxBps: loanRate(state.label.reputation, state.credit.impayes),
      semainesRestantes: action.semaines,
    });
    state.nextId += 1;
    state.label.tresorerie = cents(state.label.tresorerie + action.montant);
  },
};

export const repay: ActionHandler<LabelState, RepayAction, LabelSignal> = {
  validate(state, action) {
    const loan = state.prets.find((p) => p.id === action.pretId);
    if (!loan) return reject('pret-introuvable');
    return canAfford(state, cents(loan.restant))
      ? null
      : reject('fonds-insuffisants', { besoin: loan.restant });
  },
  apply(state, action) {
    const loan = state.prets.find((p) => p.id === action.pretId);
    if (!loan) return;
    state.label.tresorerie = cents(state.label.tresorerie - loan.restant);
    state.prets = state.prets.filter((p) => p.id !== loan.id);
    state.credit.rembourses += 1;
  },
};

/** Échéance hebdomadaire : intérêts sur l'encours plus capital linéaire ; impayé si la trésorerie ne suffit pas. */
export function loansWeek(state: LabelState, emit: (s: LabelSignal) => void): void {
  const kept: Pret[] = [];
  for (const loan of state.prets) {
    const interest = Math.round((loan.restant * loan.tauxBps) / 10_000 / 52);
    const principal = Math.min(
      loan.restant,
      Math.ceil(loan.restant / Math.max(1, loan.semainesRestantes)),
    );
    const due = interest + principal;
    if (state.label.tresorerie >= due || state.config.sandbox) {
      if (interest > 0) spend(state, 'interets', cents(interest));
      state.label.tresorerie = cents(state.label.tresorerie - principal);
      loan.restant -= principal;
    } else {
      state.credit.impayes += 1;
      emit({ kind: 'pret-impaye', payload: { pretId: loan.id } });
    }
    loan.semainesRestantes = Math.max(0, loan.semainesRestantes - 1);
    if (loan.restant <= 0) {
      state.credit.rembourses += 1;
      emit({ kind: 'pret-solde', payload: { pretId: loan.id } });
    } else kept.push(loan);
  }
  state.prets = kept;
}
