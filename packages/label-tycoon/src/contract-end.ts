import { type ActionHandler, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { notoriety } from './artists';
import { CONTRACTS, CONTRACT_END } from './balance';
import { type Clauses, clausesValid, prestigeFor, utilityOf } from './contracts';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

const contractOf = (state: LabelState, artisteId: number) =>
  state.contrats.find((c) => c.artisteId === artisteId);

function release(state: LabelState, artisteId: number, employeur = 'libre'): void {
  state.contrats = state.contrats.filter((c) => c.artisteId !== artisteId);
  const artist = state.artistes.find((a) => a.id === artisteId);
  if (artist) artist.employeur = employeur;
}

export interface RenegotiateAction extends Action {
  readonly type: 'renegocier';
  readonly artisteId: number;
  readonly clauses: Clauses;
}
export interface BreakAction extends Action {
  readonly type: 'rompre-contrat';
  readonly artisteId: number;
}
export interface ReleaseAction extends Action {
  readonly type: 'liberer-artiste';
  readonly artisteId: number;
}

/** Renégociation ou prolongation : de nouvelles clauses remplacent les anciennes si l'artiste accepte. */
export const renegotiate: ActionHandler<LabelState, RenegotiateAction, LabelSignal> = {
  validate(state, action) {
    if (!contractOf(state, action.artisteId)) return reject('contrat-introuvable');
    if (!clausesValid(action.clauses)) return reject('clauses-invalides');
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (!canAfford(state, action.clauses.avance))
      return reject('fonds-insuffisants', { besoin: action.clauses.avance });
    if (
      utilityOf(artist, action.clauses, prestigeFor(state, artist)).total <
      CONTRACTS.acceptThreshold
    )
      return reject('offre-refusee');
    return null;
  },
  apply(state, action, ctx) {
    const contract = contractOf(state, action.artisteId);
    if (!contract) return;
    spend(state, 'avances', action.clauses.avance);
    contract.clauses = { ...action.clauses };
    contract.signeLe = ctx.tick;
    contract.echeance = ctx.tick + action.clauses.dureeAnnees * 52;
    ctx.emit({ kind: 'contrat-renouvele', payload: { artisteId: action.artisteId } });
  },
};

/** Rupture anticipée : pénalité, affinité perdue, et risque de procès. */
export const breakContract: ActionHandler<LabelState, BreakAction, LabelSignal> = {
  validate(state, action) {
    const contract = contractOf(state, action.artisteId);
    if (!contract) return reject('contrat-introuvable');
    const penalty = cents(contract.clauses.avance * CONTRACT_END.breakPenaltyMultiple);
    return canAfford(state, penalty) ? null : reject('fonds-insuffisants', { besoin: penalty });
  },
  apply(state, action, ctx) {
    const contract = contractOf(state, action.artisteId);
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!contract || !artist) return;
    spend(state, 'autres', cents(contract.clauses.avance * CONTRACT_END.breakPenaltyMultiple));
    artist.affinite = clamp(artist.affinite - CONTRACT_END.breakAffinityLoss, -100, 100);
    release(state, artist.id);
    if (ctx.rng('evenements').chance(CONTRACT_END.lawsuitChance)) {
      spend(state, 'autres', cents(contract.clauses.avance * CONTRACT_END.lawsuitDamagesMultiple));
      ctx.emit({ kind: 'proces', payload: { artisteId: artist.id } });
    }
    ctx.emit({ kind: 'contrat-rompu', payload: { artisteId: artist.id } });
  },
};

/** Libère l'artiste sans pénalité (par exemple à l'échéance) : il redevient libre. */
export const releaseArtist: ActionHandler<LabelState, ReleaseAction, LabelSignal> = {
  validate: (state, action) =>
    contractOf(state, action.artisteId) ? null : reject('contrat-introuvable'),
  apply(state, action, ctx) {
    release(state, action.artisteId);
    ctx.emit({ kind: 'artiste-libere', payload: { artisteId: action.artisteId } });
  },
};

/**
 * Chaque semaine : signale les échéances (auto-pause), laisse partir les artistes dont la période
 * de grâce est écoulée, et fait jouer les clauses de rachat des artistes très connus.
 */
export function contractsWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (signal: { kind: string; payload: Record<string, unknown>; interrupt?: boolean }) => void,
): void {
  for (const contract of [...state.contrats]) {
    const artist = state.artistes.find((a) => a.id === contract.artisteId);
    if (!artist) continue;
    if (tick === contract.echeance) {
      emit({ kind: 'fin-de-contrat', payload: { artisteId: artist.id }, interrupt: true });
    } else if (tick >= contract.echeance + CONTRACT_END.graceWeeks) {
      release(state, artist.id);
      emit({ kind: 'artiste-parti', payload: { artisteId: artist.id } });
    } else if (
      contract.clauses.clauseRachat > 0 &&
      notoriety(artist.fanbase) >= CONTRACT_END.buyoutNotoriety &&
      rng.chance(CONTRACT_END.buyoutWeeklyChance)
    ) {
      earn(state, 'cessions', contract.clauses.clauseRachat);
      release(state, artist.id);
      emit({ kind: 'clause-rachetee', payload: { artisteId: artist.id } });
    }
  }
}
