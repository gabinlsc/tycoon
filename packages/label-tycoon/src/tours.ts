import { type ActionHandler, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import type { Artist } from './artists';
import { CONCERTS, TOUR, VENUES, type VenueId } from './balance';
import type { Concert } from './concerts';
import { liveShare } from './contracts';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { roleLevel } from './staff';
import type { LabelState } from './state';

export interface Tournee {
  id: number;
  artisteId: number;
  concertIds: number[];
  merchStock: number;
  merchVendu: number;
  annulee: boolean;
}

/** Coût d'une salle après la remise du tourneur. */
export const venueCost = (state: LabelState, salle: VenueId): number =>
  Math.round(VENUES[salle].cout * (1 - TOUR.tourerDiscountPerLevel * roleLevel(state, 'tourneur')));

export interface TourAction extends Action {
  readonly type: 'lancer-tournee';
  readonly artisteId: number;
  readonly salle: VenueId;
  readonly prix: number;
  readonly dates: number;
  readonly merch: number;
}

export const launchTour: ActionHandler<LabelState, TourAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'joueur') return reject('artiste-non-signe');
    if (!(action.salle in VENUES)) return reject('salle-inconnue');
    if (!Number.isInteger(action.prix) || action.prix < 1) return reject('prix-invalide');
    if (
      !Number.isInteger(action.dates) ||
      action.dates < TOUR.dates.min ||
      action.dates > TOUR.dates.max
    )
      return reject('dates-invalides', { min: TOUR.dates.min, max: TOUR.dates.max });
    if (!Number.isInteger(action.merch) || action.merch < 0) return reject('merch-invalide');
    if (
      state.tournees.some(
        (t) =>
          t.artisteId === artist.id &&
          !t.annulee &&
          t.concertIds.some((id) => state.concerts.some((c) => c.id === id && !c.resolu)),
      )
    )
      return reject('tournee-en-cours');
    if (artist.repos > 0) return reject('artiste-au-repos', { semaines: artist.repos });
    const total = cents(
      venueCost(state, action.salle) * action.dates + TOUR.merchCost * action.merch,
    );
    return canAfford(state, total) ? null : reject('fonds-insuffisants', { besoin: total });
  },
  apply(state, action, ctx) {
    const tourId = state.nextId;
    state.nextId += 1;
    const concertIds: number[] = [];
    for (let i = 0; i < action.dates; i += 1) {
      spend(state, 'tournees', cents(venueCost(state, action.salle)));
      const concert: Concert = {
        id: state.nextId,
        artisteId: action.artisteId,
        salle: action.salle,
        prix: action.prix,
        date: ctx.tick + CONCERTS.leadWeeks + i,
        resolu: false,
        spectateurs: 0,
        recette: 0,
        tourneeId: tourId,
      };
      state.nextId += 1;
      state.concerts.push(concert);
      concertIds.push(concert.id);
    }
    if (action.merch > 0) spend(state, 'tournees', cents(TOUR.merchCost * action.merch));
    state.tournees.push({
      id: tourId,
      artisteId: action.artisteId,
      concertIds,
      merchStock: action.merch,
      merchVendu: 0,
      annulee: false,
    });
  },
};

/** Après chaque date d'une tournée : ventes de merch, puis burnout éventuel qui annule la suite. */
export function afterTourDate(
  state: LabelState,
  concert: Concert,
  artist: Artist,
  emit: (s: LabelSignal) => void,
): void {
  const tour = state.tournees.find((t) => t.id === concert.tourneeId);
  if (!tour) return;
  const wanted = Math.round(concert.spectateurs * TOUR.merchRate);
  const sold = Math.min(wanted, tour.merchStock - tour.merchVendu);
  if (sold > 0) {
    tour.merchVendu += sold;
    earn(
      state,
      'merch',
      cents(liveShare(state, artist.id, sold * TOUR.merchPrice, TOUR.merchLabelBps)),
    );
  }
  if (artist.fatigue >= TOUR.burnoutFatigue && !tour.annulee) {
    tour.annulee = true;
    for (const c of state.concerts)
      if (tour.concertIds.includes(c.id) && !c.resolu) c.resolu = true;
    artist.moral = clamp(artist.moral - TOUR.burnoutMoral, 0, 100);
    artist.repos = TOUR.restWeeks;
    emit({
      kind: 'burnout',
      payload: { artisteId: artist.id, tourneeId: tour.id },
      interrupt: true,
    } as LabelSignal);
  }
}
