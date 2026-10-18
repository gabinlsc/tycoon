import { type ActionHandler, type Rng, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { calendarOf } from '@tycoon/core';
import { TAX, type TaxStrategy } from './balance';
import { spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Fiscalite {
  strategie: TaxStrategy;
  /** Dernier impôt payé (centimes) et nombre de contrôles subis. */
  dernierImpot: number;
  controles: number;
}

export const initialTax = (): Fiscalite => ({
  strategie: 'prudente',
  dernierImpot: 0,
  controles: 0,
});

export interface ChooseTaxAction extends Action {
  readonly type: 'choisir-fiscalite';
  readonly strategie: TaxStrategy;
}

export const chooseTax: ActionHandler<LabelState, ChooseTaxAction, LabelSignal> = {
  validate: (_state, action) =>
    action.strategie in TAX.strategies ? null : reject('strategie-inconnue'),
  apply(state, action) {
    state.fiscalite.strategie = action.strategie;
  },
};

/** Impôt dû sur un bénéfice avec une stratégie donnée (jamais négatif). */
export const taxDue = (profit: number, strategy: TaxStrategy): number =>
  profit <= 0 ? 0 : Math.round((profit * TAX.strategies[strategy].rateBps) / 10_000);

/** En fin d'année : impôt sur le bénéfice de l'exercice, puis tirage éventuel d'un contrôle. */
export function taxWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  if (!calendarOf(tick).isYearEnd) return;
  const report = state.finances.annees[state.finances.annees.length - 1];
  const profit = report?.net ?? 0;
  const strategy = state.fiscalite.strategie;
  const due = taxDue(profit, strategy);
  if (due > 0) spend(state, 'impots', cents(due));
  state.fiscalite.dernierImpot = due;
  emit({ kind: 'impot', payload: { montant: due } });
  const audit = TAX.strategies[strategy].auditChance;
  if (profit > 0 && audit > 0 && rng.chance(audit)) {
    const avoided = taxDue(profit, 'prudente') - due;
    const penalty = Math.round(avoided * TAX.auditPenaltyFactor);
    if (penalty > 0) spend(state, 'impots', cents(penalty));
    state.fiscalite.controles += 1;
    state.label.reputation = Math.max(0, state.label.reputation - TAX.auditReputationLoss);
    emit({
      kind: 'controle-fiscal',
      payload: { penalite: penalty },
      interrupt: true,
    } as LabelSignal);
  }
}
