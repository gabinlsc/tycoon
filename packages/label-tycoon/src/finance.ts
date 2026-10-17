import { type Cents, type Phase, calendarOf, money } from '@tycoon/core';
import { FINANCE } from './balance';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  REVENUE_CATEGORIES,
  type RevenueCategory,
} from './content/finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Entrées et sorties d'argent par catégorie, sur une période. */
export interface Report {
  /** Première et dernière semaine de la période (indices de semaine). */
  debut: number;
  fin: number;
  revenus: Record<string, Cents>;
  depenses: Record<string, Cents>;
  totalRevenus: Cents;
  totalDepenses: Cents;
  /** Résultat net : revenus moins dépenses. */
  net: Cents;
  /** Trésorerie à la fin de la période. */
  tresorerieFin: Cents;
}

/** Mouvements de la semaine en cours, avant clôture. */
export interface Ledger {
  revenus: Record<string, Cents>;
  depenses: Record<string, Cents>;
}

export interface FinanceState {
  semaine: Ledger;
  /** Dernières semaines closes (détail). */
  semaines: Report[];
  /** Derniers mois clos (calendrier 4-4-5). */
  mois: Report[];
  /** Toutes les années closes. */
  annees: Report[];
  /** Vrai tant que la trésorerie est négative (sert à n'alerter qu'une fois). */
  sousZero: boolean;
}

const emptyLedger = (): Ledger => ({ revenus: {}, depenses: {} });

export const initialFinance = (): FinanceState => ({
  semaine: emptyLedger(),
  semaines: [],
  mois: [],
  annees: [],
  sousZero: false,
});

function assertCategory(
  kind: 'revenu' | 'dépense',
  category: string,
  allowed: readonly string[],
): void {
  if (!allowed.includes(category))
    throw new RangeError(`Catégorie de ${kind} inconnue : ${category}`);
}

function assertAmount(amount: Cents): void {
  if (amount < 0)
    throw new RangeError('Un montant doit être positif (le sens est donné par earn ou spend)');
}

/** Encaisse `amount` dans la catégorie : la trésorerie monte, le compte de la semaine en garde la trace. */
export function earn(state: LabelState, category: RevenueCategory, amount: Cents): void {
  assertCategory('revenu', category, REVENUE_CATEGORIES);
  assertAmount(amount);
  const { semaine } = state.finances;
  semaine.revenus[category] = money.add(semaine.revenus[category] ?? money.ZERO, amount);
  state.label.tresorerie = money.add(state.label.tresorerie, amount);
}

/** Dépense `amount` dans la catégorie. Ne vérifie pas les fonds : les actions du joueur le font avec `canAfford`. */
export function spend(state: LabelState, category: ExpenseCategory, amount: Cents): void {
  assertCategory('dépense', category, EXPENSE_CATEGORIES);
  assertAmount(amount);
  const { semaine } = state.finances;
  semaine.depenses[category] = money.add(semaine.depenses[category] ?? money.ZERO, amount);
  state.label.tresorerie = money.sub(state.label.tresorerie, amount);
}

export const canAfford = (state: LabelState, amount: Cents): boolean =>
  state.config.sandbox === true || state.label.tresorerie >= amount;

function sumCategories(
  parts: ReadonlyArray<Record<string, Cents>>,
  categories: readonly string[],
): Record<string, Cents> {
  const out: Record<string, Cents> = {};
  for (const category of categories) {
    const total = money.sum(parts.map((part) => part[category] ?? money.ZERO));
    if (total !== 0) out[category] = total;
  }
  return out;
}

/** Additionne des rapports consécutifs en un seul (semaines vers mois, mois ou semaines vers année). */
export function aggregate(reports: readonly Report[]): Report {
  const first = reports[0];
  const last = reports[reports.length - 1];
  if (!first || !last) throw new RangeError('Aucun rapport à agréger');
  const revenus = sumCategories(
    reports.map((r) => r.revenus),
    REVENUE_CATEGORIES,
  );
  const depenses = sumCategories(
    reports.map((r) => r.depenses),
    EXPENSE_CATEGORIES,
  );
  const totalRevenus = money.sum(Object.values(revenus));
  const totalDepenses = money.sum(Object.values(depenses));
  return {
    debut: first.debut,
    fin: last.fin,
    revenus,
    depenses,
    totalRevenus,
    totalDepenses,
    net: money.sub(totalRevenus, totalDepenses),
    tresorerieFin: last.tresorerieFin,
  };
}

/** Clôt la semaine `tick` : fige le compte, le range dans l'historique et ouvre une semaine vierge. */
export function closeWeek(state: LabelState, tick: number): Report {
  const finances = state.finances;
  const revenus = sumCategories([finances.semaine.revenus], REVENUE_CATEGORIES);
  const depenses = sumCategories([finances.semaine.depenses], EXPENSE_CATEGORIES);
  const totalRevenus = money.sum(Object.values(revenus));
  const totalDepenses = money.sum(Object.values(depenses));
  const report: Report = {
    debut: tick,
    fin: tick,
    revenus,
    depenses,
    totalRevenus,
    totalDepenses,
    net: money.sub(totalRevenus, totalDepenses),
    tresorerieFin: state.label.tresorerie,
  };
  finances.semaines.push(report);
  finances.semaine = emptyLedger();

  const date = calendarOf(tick);
  if (date.isMonthEnd) {
    const monthStart = tick - (date.weekOfMonth - 1);
    finances.mois.push(aggregate(finances.semaines.filter((r) => r.debut >= monthStart)));
  }
  if (date.isYearEnd) {
    const yearStart = tick - 51;
    finances.annees.push(aggregate(finances.semaines.filter((r) => r.debut >= yearStart)));
  }
  if (finances.semaines.length > FINANCE.weekHistory) {
    finances.semaines.splice(0, finances.semaines.length - FINANCE.weekHistory);
  }
  if (finances.mois.length > FINANCE.monthHistory) {
    finances.mois.splice(0, finances.mois.length - FINANCE.monthHistory);
  }
  return report;
}

/** Chiffre d'affaires sur les 52 dernières semaines closes (sert aux paliers du label). */
export function annualRevenue(state: LabelState): Cents {
  return money.sum(state.finances.semaines.slice(-52).map((r) => r.totalRevenus));
}

/**
 * Phase de fin de semaine : frais courants, clôture des comptes, alerte si la trésorerie passe
 * sous zéro. Le signal interrompt la boucle rapide (auto-pause « crise financière »).
 */
export const financePhase: Phase<LabelState, LabelSignal> = {
  name: 'finances',
  run(state, ctx) {
    spend(state, 'entretien', FINANCE.weeklyBaseCost);
    closeWeek(state, ctx.tick);

    const negative = state.label.tresorerie < 0;
    if (negative && !state.finances.sousZero) {
      ctx.emit({
        kind: 'tresorerie-negative',
        interrupt: true,
        payload: { tresorerie: state.label.tresorerie },
      });
    }
    state.finances.sousZero = negative;
  },
};
