import { type ActionHandler, type Phase, type Cents, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { FESTIVALS_MAISON, PLATEFORME, STUDIOS_SYNCHRO, UNLOCKS } from './balance';
import { notoriety } from './artists';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { tierAtLeast } from './tiers';

/** Plateforme de streaming maison : abonnés, budget d'acquisition et part de catalogue exclusive. */
export interface Plateforme {
  abonnes: number;
  /** Budget hebdomadaire (centimes). */
  budget: number;
  /** Part du catalogue gardée exclusive, de 0 à 100. */
  exclusivite: number;
  /** Revenu net cumulé (abonnements et écoutes exclusives moins coûts). */
  cumul: number;
  cree: number;
}

export const debloque = (state: LabelState): boolean => tierAtLeast(state, UNLOCKS.plateforme);

/** Part des écoutes exclusives qui atteint réellement des abonnés (0 à 1). */
export const portee = (p: Plateforme): number =>
  clamp(p.abonnes / PLATEFORME.reachSubscribers, 0, 1);

/**
 * Répartit le revenu d'écoute d'une sortie entre le marché externe et la plateforme maison : la part
 * exclusive ne rapporte que dans la mesure où elle touche des abonnés, mais mieux (marge de la plateforme).
 */
export function repartirStreaming(
  state: LabelState,
  brut: number,
): { externe: number; plateforme: number } {
  const p = state.plateforme;
  if (!p) return { externe: brut, plateforme: 0 };
  const x = p.exclusivite / 100;
  return {
    externe: Math.round(brut * (1 - x)),
    plateforme: Math.round(brut * x * portee(p) * PLATEFORME.exclusiveRevenueFactor),
  };
}

export interface CreatePlatformAction extends Action {
  readonly type: 'creer-plateforme';
}
export interface SetPlatformAction extends Action {
  readonly type: 'regler-plateforme';
  readonly exclusivite: number;
  readonly budget: number;
}
export interface BuySyncStudioAction extends Action {
  readonly type: 'acheter-studio-synchro';
}
export interface BuyFestivalAction extends Action {
  readonly type: 'acheter-festival';
}

export const createPlatform: ActionHandler<LabelState, CreatePlatformAction, LabelSignal> = {
  validate(state) {
    if (!debloque(state)) return reject('palier-insuffisant');
    if (state.plateforme) return reject('plateforme-existante');
    return canAfford(state, PLATEFORME.creationCost)
      ? null
      : reject('fonds-insuffisants', { besoin: PLATEFORME.creationCost });
  },
  apply(state, _action, ctx) {
    spend(state, 'plateforme', PLATEFORME.creationCost);
    state.plateforme = { abonnes: 0, budget: 0, exclusivite: 0, cumul: 0, cree: ctx.tick };
    ctx.emit({ kind: 'plateforme-lancee', payload: {} });
  },
};

export const setPlatform: ActionHandler<LabelState, SetPlatformAction, LabelSignal> = {
  validate(state, action) {
    if (!state.plateforme) return reject('pas-de-plateforme');
    if (!Number.isInteger(action.exclusivite) || action.exclusivite < 0 || action.exclusivite > 100)
      return reject('exclusivite-invalide');
    return Number.isInteger(action.budget) &&
      action.budget >= 0 &&
      action.budget <= PLATEFORME.budgetMax
      ? null
      : reject('montant-invalide', { max: PLATEFORME.budgetMax });
  },
  apply(state, action) {
    if (!state.plateforme) return;
    state.plateforme.exclusivite = action.exclusivite;
    state.plateforme.budget = action.budget;
  },
};

export const buySyncStudio: ActionHandler<LabelState, BuySyncStudioAction, LabelSignal> = {
  validate(state) {
    if (!debloque(state)) return reject('palier-insuffisant');
    if (state.studiosSynchro >= STUDIOS_SYNCHRO.max) return reject('niveau-maximal');
    return canAfford(state, STUDIOS_SYNCHRO.cost)
      ? null
      : reject('fonds-insuffisants', { besoin: STUDIOS_SYNCHRO.cost });
  },
  apply(state) {
    spend(state, 'plateforme', STUDIOS_SYNCHRO.cost);
    state.studiosSynchro += 1;
  },
};

export const buyFestival: ActionHandler<LabelState, BuyFestivalAction, LabelSignal> = {
  validate(state) {
    if (!debloque(state)) return reject('palier-insuffisant');
    if (state.festivalsPossedes >= FESTIVALS_MAISON.max) return reject('niveau-maximal');
    return canAfford(state, FESTIVALS_MAISON.cost)
      ? null
      : reject('fonds-insuffisants', { besoin: FESTIVALS_MAISON.cost });
  },
  apply(state) {
    spend(state, 'plateforme', FESTIVALS_MAISON.cost);
    state.festivalsPossedes += 1;
  },
};

/** Multiplicateurs des studios de synchro sur la fréquence et le montant des offres. */
export const synchroChance = (state: LabelState): number =>
  1 + state.studiosSynchro * STUDIOS_SYNCHRO.chancePerLevel;
export const synchroCachet = (state: LabelState): number =>
  1 + state.studiosSynchro * STUDIOS_SYNCHRO.cachetPerLevel;

/** Revenu d'un festival maison cette année, d'après la notoriété moyenne du roster. */
export function revenuFestival(state: LabelState): number {
  const roster = state.artistes.filter((a) => a.employeur === 'joueur');
  const moyenne =
    roster.length === 0 ? 0 : roster.reduce((s, a) => s + notoriety(a.fanbase), 0) / roster.length;
  return Math.round(
    FESTIVALS_MAISON.baseRevenue * (FESTIVALS_MAISON.notorietyFloor + moyenne / 100),
  );
}

/** Phase hebdomadaire des actifs du conglomérat. */
export const conglomeratPhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    if (!debloque(state)) return;

    const p = state.plateforme;
    if (p) {
      const x = p.exclusivite / 100;
      const libre = Math.max(0, 1 - p.abonnes / PLATEFORME.market);
      const croissance =
        PLATEFORME.organicGrowth * libre +
        PLATEFORME.exclusivityGrowth * x * libre -
        PLATEFORME.churn * (1 - x * PLATEFORME.exclusivityChurnRelief);
      let budget = p.budget;
      if (budget > 0 && canAfford(state, cents(budget))) spend(state, 'plateforme', cents(budget));
      else budget = 0;
      p.abonnes = Math.max(
        0,
        Math.min(
          PLATEFORME.market,
          Math.round(p.abonnes * (1 + croissance) + (budget / 100) * PLATEFORME.subscribersPerEuro),
        ),
      );
      const abonnements = Math.round((p.abonnes * PLATEFORME.arpuYear) / 52);
      const couts = Math.round((p.abonnes * PLATEFORME.costYear) / 52);
      if (abonnements > 0) earn(state, 'plateforme', cents(abonnements));
      if (couts > 0) spend(state, 'plateforme', cents(couts));
      p.cumul += abonnements - couts - budget;
    }

    if (state.studiosSynchro > 0) {
      const sorties = state.projets.filter(
        (pr) => pr.statut === 'sortie' && (pr.qualite ?? 0) >= STUDIOS_SYNCHRO.minQuality,
      ).length;
      const passif = state.studiosSynchro * sorties * STUDIOS_SYNCHRO.passivePerRelease;
      if (passif > 0) earn(state, 'synchro', cents(passif));
    }

    if (state.festivalsPossedes > 0 && ctx.tick % 52 === FESTIVALS_MAISON.week) {
      const total = revenuFestival(state) * state.festivalsPossedes;
      earn(state, 'concerts', cents(total));
      for (const a of state.artistes)
        if (a.employeur === 'joueur') a.hype = clamp(a.hype + FESTIVALS_MAISON.hype, 0, 100);
      ctx.emit({ kind: 'festival-maison', payload: { revenu: total } });
    }
  },
};

export type { Cents };
