import { type ActionHandler, type Rng, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { INVESTORS, UNLOCKS } from './balance';
import { annualRevenue, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { tierAtLeast } from './tiers';
import type { LabelState } from './state';

export interface OffreInvestisseur {
  id: number;
  nom: string;
  apport: number;
  partBps: number;
  objectifCA: number;
  expire: number;
}

export interface Investisseur {
  id: number;
  nom: string;
  apport: number;
  /** Part de la valorisation finale cédée (points de base). */
  partBps: number;
  objectifCA: number;
  echeance: number;
  statut: 'actif' | 'tenu' | 'manque';
}

/** Part totale de la valorisation due aux investisseurs (points de base, plafonnée). */
export const investorShareBps = (state: LabelState): number =>
  Math.min(
    9000,
    state.investisseurs
      .filter((i) => i.statut !== 'tenu' || i.partBps > 0)
      .reduce((sum, i) => sum + i.partBps, 0),
  );

/** Reçoit parfois une offre d'investisseur, selon la réputation et le chiffre d'affaires. */
export function investorOffersWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  state.offresInvest = state.offresInvest.filter((o) => o.expire > tick);
  if (
    !tierAtLeast(state, UNLOCKS.investisseurs) ||
    state.label.reputation < INVESTORS.minReputation ||
    state.offresInvest.length >= INVESTORS.maxPending ||
    !rng.chance(INVESTORS.weeklyChance)
  )
    return;
  const revenue = annualRevenue(state);
  state.offresInvest.push({
    id: state.nextId,
    nom: rng.pick(INVESTORS.names),
    apport: Math.max(
      INVESTORS.advanceFloor,
      Math.round(revenue * INVESTORS.advanceRevenueMultiple),
    ),
    partBps: rng.int(INVESTORS.shareBps.min, INVESTORS.shareBps.max),
    objectifCA: Math.max(INVESTORS.goalFloor, Math.round(revenue * INVESTORS.goalMultiple)),
    expire: tick + INVESTORS.validWeeks,
  });
  state.nextId += 1;
  emit({ kind: 'offre-investisseur', payload: {} });
}

export interface InvestorAnswerAction extends Action {
  readonly type: 'accepter-investisseur' | 'refuser-investisseur';
  readonly offreId: number;
}

export const answerInvestor: ActionHandler<LabelState, InvestorAnswerAction, LabelSignal> = {
  validate(state, action) {
    if (!state.offresInvest.some((o) => o.id === action.offreId))
      return reject('offre-introuvable');
    if (
      action.type === 'accepter-investisseur' &&
      state.investisseurs.filter((i) => i.statut === 'actif').length >= INVESTORS.maxActive
    )
      return reject('trop-d-investisseurs', { max: INVESTORS.maxActive });
    return null;
  },
  apply(state, action, ctx) {
    const offer = state.offresInvest.find((o) => o.id === action.offreId);
    if (!offer) return;
    state.offresInvest = state.offresInvest.filter((o) => o.id !== offer.id);
    if (action.type === 'refuser-investisseur') return;
    state.label.tresorerie = cents(state.label.tresorerie + offer.apport);
    state.investisseurs.push({
      id: offer.id,
      nom: offer.nom,
      apport: offer.apport,
      partBps: offer.partBps,
      objectifCA: offer.objectifCA,
      echeance: ctx.tick + INVESTORS.deadlineWeeks,
      statut: 'actif',
    });
  },
};

/** À l'échéance : objectif tenu (réputation) ou manqué (pénalité et part supplémentaire cédée). */
export function investorsWeek(
  state: LabelState,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  for (const inv of state.investisseurs) {
    if (inv.statut !== 'actif' || tick < inv.echeance) continue;
    if (annualRevenue(state) >= inv.objectifCA) {
      inv.statut = 'tenu';
      state.label.reputation = Math.min(100, state.label.reputation + INVESTORS.reputationGain);
      emit({ kind: 'objectif-investisseur-tenu', payload: { investisseurId: inv.id } });
    } else {
      inv.statut = 'manque';
      inv.partBps += INVESTORS.extraShareBps;
      spend(state, 'autres', cents(Math.round(inv.apport * INVESTORS.penaltyShare)));
      emit({
        kind: 'objectif-investisseur-manque',
        payload: { investisseurId: inv.id },
        interrupt: true,
      } as LabelSignal);
    }
  }
}
