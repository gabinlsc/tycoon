import { type ActionHandler, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { notoriety } from './artists';
import { FESTIVALS } from './balance';
import { earn } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Festival {
  id: number;
  nom: string;
  /** Semaine absolue du festival. */
  semaine: number;
  notorieteMin: number;
  /** Cachet de base (centimes) ; multiplié pour une tête d'affiche. */
  cachet: number;
  /** Artiste retenu, ou `null`. */
  artisteId: number | null;
  tete: boolean;
  tenu: boolean;
}

/** Cachet d'un artiste pour un festival : tête d'affiche si sa notoriété dépasse le minimum de la marge. */
export function festivalOffer(
  festival: Festival,
  fans: number,
): { tete: boolean; cachet: number } | null {
  const n = notoriety(fans);
  if (n < festival.notorieteMin) return null;
  const tete = n >= festival.notorieteMin + FESTIVALS.headlinerMargin;
  return { tete, cachet: Math.round(festival.cachet * (tete ? FESTIVALS.headlinerFeeFactor : 1)) };
}

export interface ApplyFestivalAction extends Action {
  readonly type: 'candidater-festival';
  readonly festivalId: number;
  readonly artisteId: number;
}

export const applyFestival: ActionHandler<LabelState, ApplyFestivalAction, LabelSignal> = {
  validate(state, action) {
    const festival = state.festivals.find((f) => f.id === action.festivalId);
    if (!festival || festival.tenu) return reject('festival-introuvable');
    if (festival.artisteId !== null) return reject('festival-complet');
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'joueur') return reject('artiste-non-signe');
    if (artist.repos > 0) return reject('artiste-au-repos', { semaines: artist.repos });
    if (
      state.festivals.some(
        (f) => f.artisteId === artist.id && f.semaine === festival.semaine && !f.tenu,
      )
    )
      return reject('festival-conflit');
    return festivalOffer(festival, artist.fanbase) ? null : reject('candidature-refusee');
  },
  apply(state, action) {
    const festival = state.festivals.find((f) => f.id === action.festivalId);
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!festival || !artist) return;
    const offer = festivalOffer(festival, artist.fanbase);
    festival.artisteId = artist.id;
    festival.tete = offer?.tete ?? false;
  },
};

/** Ouvre les candidatures chaque année et tient les festivals de la semaine. */
export function festivalsWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  if (tick % 52 === FESTIVALS.openWeek) {
    const year = Math.floor(tick / 52);
    for (let i = 0; i < FESTIVALS.perYear; i += 1) {
      const min = rng.int(FESTIVALS.minNotoriety.min, FESTIVALS.minNotoriety.max);
      state.festivals.push({
        id: state.nextId,
        nom: `${rng.pick(FESTIVALS.names)} ${rng.pick(FESTIVALS.suffixes)}`,
        semaine: year * 52 + rng.int(FESTIVALS.summer.min, FESTIVALS.summer.max),
        notorieteMin: min,
        cachet: FESTIVALS.baseFee + min * FESTIVALS.feePerNotoriety,
        artisteId: null,
        tete: false,
        tenu: false,
      });
      state.nextId += 1;
    }
  }
  for (const f of state.festivals) {
    if (f.tenu || tick < f.semaine) continue;
    f.tenu = true;
    const artist =
      f.artisteId === null ? undefined : state.artistes.find((a) => a.id === f.artisteId);
    if (!artist) continue;
    const offer = festivalOffer(f, artist.fanbase) ?? { tete: f.tete, cachet: f.cachet };
    const cachet = Math.round(f.cachet * (f.tete ? FESTIVALS.headlinerFeeFactor : 1));
    earn(state, 'concerts', cents(Math.round((cachet * FESTIVALS.labelBps) / 10_000)));
    artist.hype = clamp(artist.hype + (f.tete ? FESTIVALS.headlinerHype : FESTIVALS.hype), 0, 100);
    artist.fatigue = clamp(artist.fatigue + FESTIVALS.fatigue, 0, 100);
    if (f.tete) {
      state.label.credibilite[artist.genre] = Math.min(
        100,
        (state.label.credibilite[artist.genre] ?? 0) + FESTIVALS.headlinerCredibility,
      );
    }
    emit({
      kind: 'festival',
      payload: { festivalId: f.id, artisteId: artist.id, tete: offer.tete && f.tete },
    });
  }
  state.festivals = state.festivals.filter((f) => !f.tenu || tick - f.semaine < 4);
}
