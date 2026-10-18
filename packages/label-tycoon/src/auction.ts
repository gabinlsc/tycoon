import { type ActionHandler, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { CONTRACTS, RIVALS, type RivalStyle } from './balance';
import { type Clauses, clausesValid, concludeSigning, fairAdvance, utilityOf } from './contracts';
import { canAfford } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Rival {
  id: number;
  nom: string;
  style: RivalStyle;
  tresorerie: number;
}

/** Offre d'un rival pour un artiste, selon son style et son budget. */
export function rivalBid(
  rival: Rival,
  artist: Parameters<typeof fairAdvance>[0],
  baseClauses: Clauses,
): Clauses | null {
  const advance = cents(Math.round(fairAdvance(artist) * RIVALS.advanceMultiple[rival.style]));
  if (advance > rival.tresorerie * RIVALS.maxCashShare) return null;
  return {
    ...baseClauses,
    avance: advance,
    royaltiesArtisteBps: RIVALS.royaltiesBps[rival.style],
    dureeAnnees: 3,
    exclusivite: rival.style === 'predateur',
    part360Bps: 0,
    clauseRachat: cents(0),
  };
}

export interface AuctionAction extends Action {
  readonly type: 'encherir';
  readonly artisteId: number;
  readonly clauses: Clauses;
}

/**
 * Enchère : les rivaux intéressés (tirage selon leur style et l'agressivité) déposent une offre ;
 * l'artiste retient celle qui a l'utilité la plus haute, à condition qu'elle dépasse son seuil.
 */
export const auction: ActionHandler<LabelState, AuctionAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'libre') return reject('artiste-indisponible');
    if (!clausesValid(action.clauses)) return reject('clauses-invalides');
    if (!canAfford(state, action.clauses.avance))
      return reject('fonds-insuffisants', { besoin: action.clauses.avance });
    return null;
  },
  apply(state, action, ctx) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return;
    const rng = ctx.rng('rivaux');
    const rep = state.label.reputation;
    const aggression = state.config.difficulty.rivalAggression;
    let best: { who: string; utility: number; clauses: Clauses } = {
      who: 'joueur',
      utility: utilityOf(artist, action.clauses, rep).total,
      clauses: action.clauses,
    };
    let bids = 0;
    for (const rival of state.rivaux) {
      if (!rng.chance(Math.min(1, RIVALS.interest[rival.style] * aggression))) continue;
      const bid = rivalBid(rival, artist, action.clauses);
      if (!bid) continue;
      bids += 1;
      const utility = utilityOf(artist, bid, 50).total;
      if (utility > best.utility) best = { who: `rival:${rival.id}`, utility, clauses: bid };
    }
    ctx.emit({ kind: 'enchere', payload: { artisteId: artist.id, offres: bids } });
    if (best.who === 'joueur' && best.utility >= CONTRACTS.acceptThreshold) {
      concludeSigning(state, artist.id, action.clauses, ctx.tick, ctx.emit);
      return;
    }
    if (best.who !== 'joueur' && best.utility >= CONTRACTS.acceptThreshold) {
      artist.employeur = best.who;
      state.suivis = state.suivis.filter((p) => p.artisteId !== artist.id);
      ctx.emit({ kind: 'enchere-perdue', payload: { artisteId: artist.id, rival: best.who } });
      return;
    }
    ctx.emit({ kind: 'enchere-sans-vainqueur', payload: { artisteId: artist.id } });
  },
};

/** Rivaux de départ, tirés avec le flux dédié. */
export function generateRivals(rng: { pick<T>(list: readonly T[]): T }): Rival[] {
  const names = ['Atlas Records', 'Maison Vertigo', 'Nova Sound', 'Bleu Cobalt', 'Panthéon Music'];
  return Array.from({ length: RIVALS.count }, (_, i) => ({
    id: i + 1,
    nom: names[i] ?? `Rival ${i + 1}`,
    style: rng.pick(RIVALS.styles),
    tresorerie: RIVALS.startCash,
  }));
}
