import { type ActionHandler, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import type { Artist } from './artists';
import { CONTRACTS, NEGOTIATION } from './balance';
import { type Clauses, clausesValid, concludeSigning, fairAdvance, utilityOf } from './contracts';
import { canAfford } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export type Reaction = 'mecontent' | 'hesitant' | 'interesse' | 'enthousiaste';

/** Dernier état de la négociation avec un artiste. */
export interface Negociation {
  artisteId: number;
  /** Nombre de contre-propositions déjà faites par l'artiste. */
  contres: number;
  reaction: Reaction;
  /** Contre-proposition en attente de réponse, s'il y en a une. */
  contre: Clauses | null;
  /** Vrai après une offre insultante : l'artiste ne négocie plus. */
  rompue: boolean;
}

/** Jauge de réaction (mécontent → enthousiaste) à partir de l'utilité de l'offre. */
export function gaugeOf(utility: number): Reaction {
  const t = CONTRACTS.acceptThreshold;
  if (utility >= t + NEGOTIATION.enthusiasticMargin) return 'enthousiaste';
  if (utility >= t) return 'interesse';
  if (utility >= t - NEGOTIATION.hesitantMargin) return 'hesitant';
  return 'mecontent';
}

export type Verdict = 'accepte' | 'contre' | 'insulte';

/** Verdict de l'artiste : accepte, propose une contre-offre, ou s'estime insulté. */
export function evaluateOffer(artist: Artist, clauses: Clauses, reputation: number): Verdict {
  const { total } = utilityOf(artist, clauses, reputation);
  if (total >= CONTRACTS.acceptThreshold) return 'accepte';
  if (total < CONTRACTS.acceptThreshold - NEGOTIATION.insultMargin) return 'insulte';
  return 'contre';
}

/**
 * Contre-proposition : l'artiste retire d'abord l'exclusivité et le 360, puis relève ses royalties
 * et son avance par paliers jusqu'à trouver une offre qu'il accepte. Les durées longues sont raccourcies.
 */
export function counterOffer(artist: Artist, clauses: Clauses, reputation: number): Clauses {
  const next: Clauses = { ...clauses };
  const ok = () => utilityOf(artist, next, reputation).total >= CONTRACTS.acceptThreshold;
  const steps: (() => boolean)[] = [
    () => (next.exclusivite ? ((next.exclusivite = false), true) : false),
    () => (next.part360Bps > 0 ? ((next.part360Bps = 0), true) : false),
    () => (next.dureeAnnees > 2 ? ((next.dureeAnnees -= 1), true) : false),
    () =>
      next.royaltiesArtisteBps < CONTRACTS.royaltiesBps.max
        ? ((next.royaltiesArtisteBps = Math.min(
            CONTRACTS.royaltiesBps.max,
            next.royaltiesArtisteBps + NEGOTIATION.counterRoyaltiesStep,
          )),
          true)
        : false,
    () => (
      (next.avance = cents(
        next.avance + Math.round(fairAdvance(artist) * NEGOTIATION.counterAdvanceStepShare),
      )),
      true
    ),
  ];
  for (let guard = 0; guard < 200 && !ok(); guard += 1) {
    let moved = false;
    for (const step of steps) {
      if (step()) {
        moved = true;
        if (ok()) break;
      }
    }
    if (!moved) break;
  }
  return next;
}

export interface ProposeAction extends Action {
  readonly type: 'proposer';
  readonly artisteId: number;
  readonly clauses: Clauses;
}

const negotiationOf = (state: LabelState, artisteId: number) =>
  state.negociations.find((n) => n.artisteId === artisteId);

export const propose: ActionHandler<LabelState, ProposeAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'libre') return reject('artiste-indisponible');
    if (!clausesValid(action.clauses)) return reject('clauses-invalides');
    const n = negotiationOf(state, artist.id);
    if (n?.rompue) return reject('negociation-rompue');
    if (
      n &&
      n.contres >= NEGOTIATION.maxCounters &&
      evaluateOffer(artist, action.clauses, state.label.reputation) !== 'accepte'
    )
      return reject('contre-propositions-epuisees');
    if (!canAfford(state, action.clauses.avance))
      return reject('fonds-insuffisants', { besoin: action.clauses.avance });
    return null;
  },
  apply(state, action, ctx) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return;
    const reputation = state.label.reputation;
    const verdict = evaluateOffer(artist, action.clauses, reputation);
    if (verdict === 'accepte') {
      concludeSigning(state, artist.id, action.clauses, ctx.tick, ctx.emit);
      return;
    }
    const previous = negotiationOf(state, artist.id);
    state.negociations = state.negociations.filter((n) => n.artisteId !== artist.id);
    const reaction = gaugeOf(utilityOf(artist, action.clauses, reputation).total);
    if (verdict === 'insulte') {
      artist.affinite = clamp(artist.affinite - NEGOTIATION.insultAffinityLoss, -100, 100);
      state.negociations.push({
        artisteId: artist.id,
        contres: previous?.contres ?? 0,
        reaction,
        contre: null,
        rompue: true,
      });
      ctx.emit({ kind: 'offre-insultante', payload: { artisteId: artist.id } });
      return;
    }
    const contres = (previous?.contres ?? 0) + 1;
    state.negociations.push({
      artisteId: artist.id,
      contres,
      reaction,
      contre: counterOffer(artist, action.clauses, reputation),
      rompue: false,
    });
    ctx.emit({ kind: 'contre-proposition', payload: { artisteId: artist.id, numero: contres } });
  },
};
