import {
  type ActionHandler,
  type Phase,
  Rng as RngClass,
  cents,
  clamp,
  reject,
} from '@tycoon/core';
import type { Action, Seed } from '@tycoon/core';
import { REGULATION } from './balance';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { tierAtLeast } from './tiers';

/** Vague de piratage : une part des écoutes se perd pendant quelques semaines. */
export interface VaguePiratage {
  debut: number;
  fin: number;
  severite: number;
}

/** Renégociation des tarifs des plateformes : annoncée, puis appliquée pendant un an. */
export interface Renegociation {
  annonce: number;
  debut: number;
  fin: number;
  /** Baisse du revenu par écoute (0 à 1). */
  baisse: number;
  resistee: boolean;
}

export interface RegulationState {
  /** Pression des autorités de la concurrence, de 0 à 100. */
  surveillance: number;
  averti: boolean;
  amendes: number;
  dernierPlaidoyer: number;
  piratage: VaguePiratage | null;
  /** Niveau de la veille anti-piratage (0 à `maxLevel`). */
  veille: number;
  prochainPiratage: number;
  renegociation: Renegociation | null;
  prochaineRenegociation: number;
}

const entre = (rng: RngClass, b: { min: number; max: number }): number =>
  Math.round(rng.range(b.min, b.max));

/** Calendrier initial des frictions : déduit de la graine, sans consommer de tirage de la partie. */
export function initialRegulation(seed: Seed): RegulationState {
  const rng = RngClass.fromSeed(`${String(seed)}\u0000regulation`);
  return {
    surveillance: 0,
    averti: false,
    amendes: 0,
    dernierPlaidoyer: -REGULATION.concentration.lobbyCooldown,
    piratage: null,
    veille: 0,
    prochainPiratage: entre(rng, REGULATION.piratage.first),
    renegociation: null,
    prochaineRenegociation: entre(rng, REGULATION.renegociation.first),
  };
}

/** La friction ne s'applique qu'à partir du palier Groupe. */
export const active = (state: LabelState): boolean => tierAtLeast(state, 'groupe');

/** Part de marché du label : ses fans sur ceux de tous les labels (joueur et rivaux). */
export function partDeMarche(state: LabelState): number {
  let moi = 0;
  let tous = 0;
  for (const a of state.artistes) {
    if (a.employeur === 'joueur') {
      moi += a.fanbase;
      tous += a.fanbase;
    } else if (a.employeur.startsWith('rival:')) tous += a.fanbase;
  }
  return tous > 0 ? moi / tous : 0;
}

/** Gravité réelle d'une vague, une fois la veille anti-piratage prise en compte. */
export const severiteEffective = (state: LabelState, v: VaguePiratage): number =>
  v.severite * (1 - REGULATION.piratage.levelRelief * state.regulation.veille);

/** Multiplicateur des revenus d'écoute dû au piratage et aux tarifs renégociés (1 = rien). */
export function facteurRegulation(state: LabelState, tick: number): number {
  const r = state.regulation;
  let facteur = 1;
  if (r.piratage && tick >= r.piratage.debut && tick < r.piratage.fin)
    facteur *= 1 - severiteEffective(state, r.piratage);
  if (r.renegociation && tick >= r.renegociation.debut && tick < r.renegociation.fin)
    facteur *= 1 - r.renegociation.baisse;
  return facteur;
}

export interface PleadAction extends Action {
  readonly type: 'plaider';
}
export interface SetWatchAction extends Action {
  readonly type: 'regler-veille';
  readonly niveau: number;
}
export interface ResistAction extends Action {
  readonly type: 'resister-plateformes';
}

export const plead: ActionHandler<LabelState, PleadAction, LabelSignal> = {
  validate(state, _action, ctx) {
    if (!active(state)) return reject('palier-insuffisant');
    if (!pleadAllowed(state, ctx.tick)) return reject('plaidoyer-trop-recent');
    return canAfford(state, REGULATION.concentration.lobbyCost)
      ? null
      : reject('fonds-insuffisants', { besoin: REGULATION.concentration.lobbyCost });
  },
  apply(state, _action, ctx) {
    const c = REGULATION.concentration;
    spend(state, 'regulation', c.lobbyCost);
    state.regulation.surveillance = Math.max(0, state.regulation.surveillance - c.lobbyRelief);
    state.regulation.dernierPlaidoyer = ctx.tick;
  },
};

export const pleadAllowed = (state: LabelState, tick: number): boolean =>
  tick - state.regulation.dernierPlaidoyer >= REGULATION.concentration.lobbyCooldown;

export const setWatch: ActionHandler<LabelState, SetWatchAction, LabelSignal> = {
  validate(state, action) {
    if (!active(state)) return reject('palier-insuffisant');
    return Number.isInteger(action.niveau) &&
      action.niveau >= 0 &&
      action.niveau <= REGULATION.piratage.maxLevel
      ? null
      : reject('niveau-invalide');
  },
  apply(state, action) {
    state.regulation.veille = action.niveau;
  },
};

/** Chance de réussir à faire plier les plateformes : réputation et influence pèsent. */
export const chanceDeResister = (state: LabelState): number =>
  clamp(
    REGULATION.renegociation.resistBase +
      state.label.reputation * REGULATION.renegociation.resistPerReputation +
      state.institution.influence * REGULATION.renegociation.resistPerInfluence,
    0,
    REGULATION.renegociation.resistMax,
  );

export const resist: ActionHandler<LabelState, ResistAction, LabelSignal> = {
  validate(state) {
    const r = state.regulation.renegociation;
    if (!r) return reject('rien-a-negocier');
    if (r.resistee) return reject('deja-resiste');
    return canAfford(state, REGULATION.renegociation.resistCost)
      ? null
      : reject('fonds-insuffisants', { besoin: REGULATION.renegociation.resistCost });
  },
  apply(state, _action, ctx) {
    const r = state.regulation.renegociation;
    if (!r) return;
    spend(state, 'regulation', REGULATION.renegociation.resistCost);
    r.resistee = true;
    const gagne = ctx.rng('regulation').chance(chanceDeResister(state));
    if (gagne)
      r.baisse = Math.round(r.baisse * REGULATION.renegociation.resistRemaining * 1000) / 1000;
    ctx.emit({ kind: 'resistance-plateformes', payload: { gagne } });
  },
};

/** Phase hebdomadaire de la friction : surveillance, amendes, vagues de piratage et renégociations. */
export const regulationPhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    if (!active(state)) return;
    const r = state.regulation;
    const rng = ctx.rng('regulation');
    const c = REGULATION.concentration;

    // Anti-concentration
    const part = partDeMarche(state);
    r.surveillance =
      part > c.threshold
        ? Math.min(100, r.surveillance + (part - c.threshold) * c.gain)
        : Math.max(0, r.surveillance - c.relief);
    if (r.surveillance >= c.warning && !r.averti) {
      r.averti = true;
      ctx.emit({ kind: 'avertissement-concentration', payload: {}, interrupt: true });
    } else if (r.surveillance < c.warning - 20) r.averti = false;
    if (r.surveillance >= 100) {
      const ca = state.finances.semaines.slice(-52).reduce((s, w) => s + w.totalRevenus, 0);
      const amende = Math.round(ca * c.fineShare);
      if (amende > 0) spend(state, 'regulation', cents(amende));
      r.amendes += amende;
      r.surveillance = c.afterFine;
      r.averti = false;
      ctx.emit({ kind: 'amende-concentration', payload: { montant: amende }, interrupt: true });
    }

    // Piratage
    const p = REGULATION.piratage;
    if (r.piratage && ctx.tick >= r.piratage.fin) {
      r.piratage = null;
      r.prochainPiratage = ctx.tick + entre(rng, p.gap);
      ctx.emit({ kind: 'fin-piratage', payload: {} });
    } else if (!r.piratage && ctx.tick >= r.prochainPiratage) {
      const duree = entre(rng, p.weeks);
      r.piratage = {
        debut: ctx.tick,
        fin: ctx.tick + duree,
        severite: Math.round(rng.range(p.severity.min, p.severity.max) * 1000) / 1000,
      };
      ctx.emit({
        kind: 'vague-piratage',
        payload: { severite: Math.round(r.piratage.severite * 100), semaines: duree },
        interrupt: true,
      });
    }
    if (r.veille > 0) spend(state, 'regulation', cents(r.veille * p.levelCost));

    // Plateformes qui renégocient
    const n = REGULATION.renegociation;
    if (r.renegociation && ctx.tick >= r.renegociation.fin) {
      r.renegociation = null;
      r.prochaineRenegociation = ctx.tick + entre(rng, n.gap);
    } else if (!r.renegociation && ctx.tick >= r.prochaineRenegociation) {
      r.renegociation = {
        annonce: ctx.tick,
        debut: ctx.tick + n.notice,
        fin: ctx.tick + n.notice + n.weeks,
        baisse: Math.round(rng.range(n.cut.min, n.cut.max) * 1000) / 1000,
        resistee: false,
      };
      ctx.emit({
        kind: 'plateformes-renegocient',
        payload: { baisse: Math.round(r.renegociation.baisse * 100), preavis: n.notice },
        interrupt: true,
      });
    }
  },
};
