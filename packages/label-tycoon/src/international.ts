import { type ActionHandler, type Phase, cents, clamp, reject, sin } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { INTERNATIONAL, PAYS, PAYS_IDS, UNLOCKS, type PaysId } from './balance';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { tierAtLeast } from './tiers';

/** Bureau local d'un pays : présence du label sur ce marché. */
export interface MarcheExport {
  pays: PaysId;
  ouvert: number;
  /** Part du public local touché par le label, de 0 à 100. */
  penetration: number;
  /** Budget hebdomadaire de campagne (centimes). */
  budget: number;
  /** Revenu de la dernière semaine et net cumulé (centimes). */
  dernier: number;
  cumul: number;
}

export interface InternationalState {
  marches: MarcheExport[];
}

export const initialInternational = (): InternationalState => ({ marches: [] });

export const debloque = (state: LabelState): boolean => tierAtLeast(state, UNLOCKS.export);

export const estPays = (id: string): id is PaysId => (PAYS_IDS as readonly string[]).includes(id);

/** Goût d'un pays pour un genre cette semaine : base du pays, modulée par une mode lente. */
export function affinite(pays: PaysId, genre: string, tick: number): number {
  const regles = PAYS[pays];
  const base = regles.affinites[genre] ?? 1;
  const mode =
    1 +
    INTERNATIONAL.driftAmplitude *
      sin(2 * Math.PI * (tick / INTERNATIONAL.driftPeriod + regles.phase));
  return Math.round(base * mode * 1000) / 1000;
}

/** Affinité moyenne du roster avec un pays, pondérée par les fans de chaque artiste. */
export function affiniteDuRoster(state: LabelState, pays: PaysId, tick: number): number {
  const roster = state.artistes.filter((a) => a.employeur === 'joueur');
  const fans = roster.reduce((s, a) => s + a.fanbase, 0);
  if (fans <= 0) return 1;
  const total = roster.reduce((s, a) => s + a.fanbase * affinite(pays, a.genre, tick), 0);
  return Math.round((total / fans) * 1000) / 1000;
}

export interface LigneClassement {
  rang: number;
  artisteId: number;
  nom: string;
  genre: string;
  joueur: boolean;
  score: number;
}

/**
 * Classement local d'un pays : audience de chaque artiste, selon le goût du pays et sa présence
 * (le joueur n'y est que s'il a un bureau, avec sa pénétration ; rivaux et artistes libres y ont
 * une présence fixe).
 */
export function classementLocal(state: LabelState, pays: PaysId, tick: number): LigneClassement[] {
  const marche = state.international.marches.find((m) => m.pays === pays);
  const lignes = state.artistes
    .filter((a) => a.employeur !== 'retraite')
    .map((a) => {
      const joueur = a.employeur === 'joueur';
      const presence = joueur
        ? (marche?.penetration ?? 0) / 100
        : a.employeur === 'libre'
          ? INTERNATIONAL.freePresence
          : INTERNATIONAL.rivalPresence;
      return {
        artisteId: a.id,
        nom: a.nomScene,
        genre: a.genre,
        joueur,
        score: Math.round(a.fanbase * affinite(pays, a.genre, tick) * presence),
      };
    })
    .filter((l) => l.score > 0)
    .sort((x, y) => y.score - x.score || x.artisteId - y.artisteId)
    .slice(0, INTERNATIONAL.chartSize);
  return lignes.map((l, i) => ({ rang: i + 1, ...l }));
}

export interface OpenMarketAction extends Action {
  readonly type: 'ouvrir-marche';
  readonly pays: string;
}
export interface SetCampaignAction extends Action {
  readonly type: 'regler-campagne';
  readonly pays: string;
  readonly budget: number;
}

export const openMarket: ActionHandler<LabelState, OpenMarketAction, LabelSignal> = {
  validate(state, action) {
    if (!debloque(state)) return reject('palier-insuffisant');
    if (!estPays(action.pays)) return reject('pays-inconnu');
    if (state.international.marches.some((m) => m.pays === action.pays))
      return reject('marche-deja-ouvert');
    const cout = PAYS[action.pays].ouverture;
    return canAfford(state, cout) ? null : reject('fonds-insuffisants', { besoin: cout });
  },
  apply(state, action, ctx) {
    if (!estPays(action.pays)) return;
    spend(state, 'export', PAYS[action.pays].ouverture);
    state.international.marches.push({
      pays: action.pays,
      ouvert: ctx.tick,
      penetration: 0,
      budget: 0,
      dernier: 0,
      cumul: 0,
    });
    ctx.emit({ kind: 'marche-ouvert', payload: { pays: action.pays } });
  },
};

export const setCampaign: ActionHandler<LabelState, SetCampaignAction, LabelSignal> = {
  validate(state, action) {
    if (!estPays(action.pays)) return reject('pays-inconnu');
    if (!state.international.marches.some((m) => m.pays === action.pays))
      return reject('marche-ferme');
    return Number.isInteger(action.budget) &&
      action.budget >= 0 &&
      action.budget <= INTERNATIONAL.budgetMax
      ? null
      : reject('montant-invalide', { max: INTERNATIONAL.budgetMax });
  },
  apply(state, action) {
    const m = state.international.marches.find((x) => x.pays === action.pays);
    if (m) m.budget = action.budget;
  },
};

/** Phase hebdomadaire : campagnes, pénétration, revenus d'écoute à l'étranger et frais des bureaux. */
export const internationalPhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    const streaming = state.finances.semaine.revenus['streaming'] ?? 0;
    for (const m of state.international.marches) {
      const regles = PAYS[m.pays];
      let budget = m.budget;
      if (budget > 0 && canAfford(state, cents(budget))) spend(state, 'export', cents(budget));
      else budget = 0;
      m.penetration = clamp(
        m.penetration * (1 - INTERNATIONAL.decay) +
          (budget / 100) * INTERNATIONAL.gainPerEuro * (100 - m.penetration),
        0,
        100,
      );
      const revenu = Math.round(
        streaming *
          regles.poids *
          (m.penetration / 100) *
          affiniteDuRoster(state, m.pays, ctx.tick) *
          INTERNATIONAL.margin,
      );
      if (revenu > 0) earn(state, 'export', cents(revenu));
      const frais = Math.round(regles.fraisAnnuels / 52);
      spend(state, 'export', cents(frais));
      m.dernier = revenu;
      m.cumul += revenu - frais - budget;
    }
  },
};
