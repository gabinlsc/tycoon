import { type ActionHandler, cents, clamp, ln, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { notoriety } from './artists';
import { CONCERTS, VENUES, type VenueId } from './balance';
import { buildingLevel } from './buildings';
import { liveShare } from './contracts';
import { afterTourDate } from './tours';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Concert {
  id: number;
  artisteId: number;
  salle: VenueId;
  /** Prix du billet en euros. */
  prix: number;
  date: number;
  resolu: boolean;
  spectateurs: number;
  recette: number;
  /** Tournée à laquelle appartient la date, ou `null` pour un concert isolé. */
  tourneeId: number | null;
}

/** Taux de remplissage attendu (0-1) : notoriété, hype, prix et salle maison. */
export function fillRate(
  fans: number,
  hype: number,
  salle: VenueId,
  prix: number,
  homeLevel = 0,
): number {
  const venue = VENUES[salle];
  const draw = clamp((notoriety(fans) + hype / 4) / venue.notorieteRef, 0, 1);
  const ratio = Math.max(0.1, prix / venue.prixRef);
  const priceFactor = clamp(1 - CONCERTS.priceElasticity * (ln(ratio) / ln(2)), 0, 1.2);
  return clamp(draw * priceFactor + homeLevel * CONCERTS.homeVenueFill, 0, 1);
}

export interface ConcertAction extends Action {
  readonly type: 'organiser-concert';
  readonly artisteId: number;
  readonly salle: VenueId;
  readonly prix: number;
}

export const organiseConcert: ActionHandler<LabelState, ConcertAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'joueur') return reject('artiste-non-signe');
    if (artist.repos > 0) return reject('artiste-au-repos', { semaines: artist.repos });
    if (!(action.salle in VENUES)) return reject('salle-inconnue');
    if (!Number.isInteger(action.prix) || action.prix < 1) return reject('prix-invalide');
    const cost = VENUES[action.salle].cout;
    return canAfford(state, cost) ? null : reject('fonds-insuffisants', { besoin: cost });
  },
  apply(state, action, ctx) {
    spend(state, 'tournees', VENUES[action.salle].cout);
    state.concerts.push({
      id: state.nextId,
      artisteId: action.artisteId,
      salle: action.salle,
      prix: action.prix,
      date: ctx.tick + CONCERTS.leadWeeks,
      resolu: false,
      spectateurs: 0,
      recette: 0,
      tourneeId: null,
    });
    state.nextId += 1;
  },
};

/** Tient les concerts du jour : billetterie, commission du label, fatigue, fans et hype. */
export function concertsWeek(
  state: LabelState,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  for (const c of state.concerts) {
    if (c.resolu || tick < c.date) continue;
    const artist = state.artistes.find((a) => a.id === c.artisteId);
    c.resolu = true;
    if (!artist) continue;
    const venue = VENUES[c.salle];
    const fill = fillRate(
      artist.fanbase,
      artist.hype,
      c.salle,
      c.prix,
      buildingLevel(state, 'concert'),
    );
    c.spectateurs = Math.round(venue.capacite * fill);
    const gross = cents(c.spectateurs * c.prix * 100);
    c.recette = liveShare(state, artist.id, gross, CONCERTS.commissionBps);
    if (c.recette > 0) earn(state, 'concerts', cents(c.recette));
    artist.fatigue = clamp(artist.fatigue + CONCERTS.fatigue, 0, 100);
    artist.fanbase += Math.round(c.spectateurs * CONCERTS.fansPerSpectator * (artist.scene / 50));
    if (fill > 0.8) artist.hype = Math.min(100, artist.hype + CONCERTS.hypeBoost);
    afterTourDate(state, c, artist, emit);
    emit({ kind: 'concert', payload: { concertId: c.id, spectateurs: c.spectateurs } });
  }
}
