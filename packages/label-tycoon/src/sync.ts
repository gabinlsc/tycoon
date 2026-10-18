import { type ActionHandler, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { SYNC, type SyncKind } from './balance';
import { liveShare } from './contracts';
import { earn } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface OffreSynchro {
  id: number;
  projetId: number;
  type: SyncKind;
  marque: string;
  cachet: number;
  expire: number;
}

const KINDS = Object.keys(SYNC.kinds).sort() as SyncKind[];

/** Nouvelles offres de la semaine, pour les sorties de qualité suffisante. */
export function syncOffersWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  state.offresSynchro = state.offresSynchro.filter((o) => o.expire > tick);
  for (const p of state.projets) {
    if (p.statut !== 'sortie' || (p.qualite ?? 0) < SYNC.minQuality) continue;
    if (state.offresSynchro.length >= SYNC.maxPending) break;
    if (!rng.chance(SYNC.weeklyChance * ((p.qualite ?? 0) / 100) * 2)) continue;
    const type = rng.pick(KINDS);
    state.offresSynchro.push({
      id: state.nextId,
      projetId: p.id,
      type,
      marque: rng.pick(SYNC.brands),
      cachet: Math.round(SYNC.kinds[type].cachet * rng.range(0.7, 1.4)),
      expire: tick + SYNC.validWeeks,
    });
    state.nextId += 1;
    emit({ kind: 'offre-synchro', payload: { projetId: p.id, type } });
  }
}

export interface SyncAnswerAction extends Action {
  readonly type: 'accepter-synchro' | 'refuser-synchro';
  readonly offreId: number;
}

const offerOf = (state: LabelState, id: number) => state.offresSynchro.find((o) => o.id === id);

export const answerSync: ActionHandler<LabelState, SyncAnswerAction, LabelSignal> = {
  validate: (state, action) =>
    offerOf(state, action.offreId) ? null : reject('offre-introuvable'),
  apply(state, action) {
    const offer = offerOf(state, action.offreId);
    if (!offer) return;
    state.offresSynchro = state.offresSynchro.filter((o) => o.id !== offer.id);
    if (action.type === 'refuser-synchro') return;
    const projet = state.projets.find((p) => p.id === offer.projetId);
    const artist = projet && state.artistes.find((a) => a.id === projet.artisteId);
    if (projet)
      earn(
        state,
        'synchro',
        cents(liveShare(state, projet.artisteId, offer.cachet, SYNC.labelBps)),
      );
    if (!artist) return;
    const kind = SYNC.kinds[offer.type];
    artist.hype = clamp(artist.hype + kind.hype, 0, 100);
    artist.fanbase += kind.fans;
    if (offer.type !== 'pub' || artist.ethique > SYNC.ethicsThreshold)
      artist.moral = clamp(artist.moral + kind.moral, 0, 100);
  },
};
