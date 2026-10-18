import { type ActionHandler, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { type Rival, generateRival } from './auction';
import { type Artist, notoriety } from './artists';
import { CONTRACT_END, PERSONALITIES, RIVALS, RIVAL_INTERACTIONS as RI } from './balance';
import { fairAdvance } from './contracts';
import { earn, spend } from './finance';
import { GENRE_IDS } from './content/genres';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';

export interface OffreRachat {
  id: number;
  rivalId: number;
  artisteId: number;
  prix: number;
  expire: number;
}

/** Artistes sous contrat avec ce rival. */
export const rosterOf = (state: LabelState, rival: Rival): Artist[] =>
  state.artistes.filter((a) => a.employeur === `rival:${rival.id}`);

const rivalOf = (state: LabelState, employeur: string) =>
  state.rivaux.find((r) => `rival:${r.id}` === employeur);

/** Prix proposé par un rival pour reprendre un artiste du joueur. */
export const buyoutOffer = (state: LabelState, artisteId: number): number => {
  const artist = state.artistes.find((a) => a.id === artisteId);
  return artist ? Math.round(fairAdvance(artist) * RI.buyoutOfferMultiple) : 0;
};

/** Prix qu'un rival exige pour vendre un de ses artistes. */
export const buyoutAsk = (state: LabelState, artisteId: number): number => {
  const artist = state.artistes.find((a) => a.id === artisteId);
  return artist ? Math.round(fairAdvance(artist) * RI.buyoutAskMultiple) : 0;
};

/** Un prédateur débauche un artiste dont le contrat est à échéance, pendant la période de grâce. */
function poach(state: LabelState, tick: number, rng: Rng, emit: (s: LabelSignal) => void): void {
  const predators = state.rivaux.filter((r) => r.personnalite === 'predateur' && r.tresorerie > 0);
  if (predators.length === 0) return;
  for (const contract of [...state.contrats]) {
    if (tick < contract.echeance || tick >= contract.echeance + CONTRACT_END.graceWeeks) continue;
    if (!rng.chance(RI.poachChance)) continue;
    const artist = state.artistes.find((a) => a.id === contract.artisteId);
    const rival = rng.pick(predators);
    if (!artist || fairAdvance(artist) > rival.tresorerie * 0.5) continue;
    rival.tresorerie -= fairAdvance(artist);
    artist.employeur = `rival:${rival.id}`;
    state.contrats = state.contrats.filter((c) => c.id !== contract.id);
    emit({
      kind: 'debauchage',
      payload: { artisteId: artist.id, rivalId: rival.id },
      interrupt: true,
    } as LabelSignal);
  }
}

/** Clash public entre deux artistes du même genre : buzz pour les deux, moral du plus petit en baisse. */
function clash(state: LabelState, rng: Rng, emit: (s: LabelSignal) => void): void {
  if (!rng.chance(RI.clashChance)) return;
  const mine = state.artistes.filter((a) => a.employeur === 'joueur');
  const theirs = state.artistes.filter((a) => a.employeur.startsWith('rival:'));
  if (mine.length === 0 || theirs.length === 0) return;
  const a = rng.pick(mine);
  const rivalSame = theirs.filter((t) => t.genre === a.genre);
  if (rivalSame.length === 0) return;
  const b = rng.pick(rivalSame);
  for (const x of [a, b]) x.hype = clamp(x.hype + RI.clashHype, 0, 100);
  const loser = a.fanbase <= b.fanbase ? a : b;
  loser.moral = clamp(loser.moral - RI.clashMoral, 0, 100);
  const winner = loser === a ? b : a;
  winner.fanbase += Math.round(winner.fanbase * RI.clashFans);
  emit({ kind: 'clash', payload: { artisteId: a.id, rivalArtisteId: b.id } });
}

/** Un rival propose de racheter le contrat d'un artiste notoire du joueur. */
function offerBuyouts(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  state.offresRachat = state.offresRachat.filter((o) => o.expire > tick);
  if (state.offresRachat.length >= RI.buyoutMaxPending || !rng.chance(RI.buyoutChance)) return;
  const targets = state.artistes.filter(
    (a) =>
      a.employeur === 'joueur' &&
      notoriety(a.fanbase) >= RI.buyoutMinNotoriety &&
      !state.offresRachat.some((o) => o.artisteId === a.id),
  );
  const rivals = state.rivaux.filter((r) => r.tresorerie > 0);
  if (targets.length === 0 || rivals.length === 0) return;
  const artist = rng.pick(targets);
  const rival = rng.pick(rivals);
  const prix = buyoutOffer(state, artist.id);
  if (prix > rival.tresorerie * 0.6) return;
  state.offresRachat.push({
    id: newId(state),
    rivalId: rival.id,
    artisteId: artist.id,
    prix,
    expire: tick + RI.buyoutValidWeeks,
  });
  emit({ kind: 'offre-rachat', payload: { artisteId: artist.id, rivalId: rival.id } });
}

/** Évolution : une major émerge des rivaux très riches ; un rival ruiné disparaît, un nouveau le remplace plus tard. */
function evolve(state: LabelState, tick: number, rng: Rng, emit: (s: LabelSignal) => void): void {
  for (const rival of state.rivaux) {
    if (
      rival.personnalite !== 'major' &&
      rival.tresorerie > RIVALS.startCash * PERSONALITIES.major.cash * RI.majorCashMultiple
    ) {
      rival.personnalite = 'major';
      rival.style = PERSONALITIES.major.style;
      emit({ kind: 'rival-evolue', payload: { rivalId: rival.id } });
    }
  }
  const collapsed = state.rivaux.filter((r) => r.semainesNegatives >= RIVALS.collapseWeeks);
  for (const rival of collapsed) {
    for (const artist of rosterOf(state, rival)) artist.employeur = 'libre';
    state.rivaux = state.rivaux.filter((r) => r.id !== rival.id);
    state.remplacements.push(tick + RI.replacementDelay);
    emit({ kind: 'rival-disparu', payload: { rivalId: rival.id } });
  }
  const due = state.remplacements.filter((t) => t <= tick);
  if (due.length > 0) {
    state.remplacements = state.remplacements.filter((t) => t > tick);
    for (let i = 0; i < due.length; i += 1) {
      const rival = generateRival(
        rng,
        newId(state),
        GENRE_IDS,
        state.config.difficulty.rivalCashBonus,
        new Set(state.rivaux.map((r) => r.nom)),
      );
      state.rivaux.push(rival);
      emit({ kind: 'rival-nouveau', payload: { rivalId: rival.id } });
    }
  }
}

export function rivalInteractions(
  state: LabelState,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  poach(state, tick, rng, emit);
  clash(state, rng, emit);
  offerBuyouts(state, tick, rng, emit);
  evolve(state, tick, rng, emit);
}

export interface BuyoutAnswerAction extends Action {
  readonly type: 'accepter-rachat' | 'refuser-rachat';
  readonly offreId: number;
}

export const answerBuyout: ActionHandler<LabelState, BuyoutAnswerAction, LabelSignal> = {
  validate: (state, action) =>
    state.offresRachat.some((o) => o.id === action.offreId) ? null : reject('offre-introuvable'),
  apply(state, action, ctx) {
    const offer = state.offresRachat.find((o) => o.id === action.offreId);
    if (!offer) return;
    state.offresRachat = state.offresRachat.filter((o) => o.id !== offer.id);
    if (action.type === 'refuser-rachat') return;
    const artist = state.artistes.find((a) => a.id === offer.artisteId);
    const rival = state.rivaux.find((r) => r.id === offer.rivalId);
    if (!artist || artist.employeur !== 'joueur') return;
    state.contrats = state.contrats.filter((c) => c.artisteId !== artist.id);
    artist.employeur = `rival:${offer.rivalId}`;
    if (rival) rival.tresorerie -= offer.prix;
    earn(state, 'cessions', cents(offer.prix));
    ctx.emit({ kind: 'contrat-vendu', payload: { artisteId: artist.id, rivalId: offer.rivalId } });
  },
};

export interface BuyRivalArtistAction extends Action {
  readonly type: 'racheter-artiste';
  readonly artisteId: number;
}

/** Le joueur rachète un artiste à un rival, au prix exigé, avec un contrat standard. */
export const buyRivalArtist: ActionHandler<LabelState, BuyRivalArtistAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    const rival = rivalOf(state, artist.employeur);
    if (!rival) return reject('pas-un-artiste-rival');
    const price = buyoutAsk(state, artist.id);
    if (state.label.tresorerie < price && !state.config.sandbox)
      return reject('fonds-insuffisants', { besoin: price });
    return rival.personnalite === 'major' && rival.tresorerie > price * 5
      ? reject('rachat-refuse')
      : null;
  },
  apply(state, action, ctx) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return;
    const rival = rivalOf(state, artist.employeur);
    const price = cents(buyoutAsk(state, artist.id));
    spend(state, 'avances', price);
    if (rival) rival.tresorerie += price;
    artist.employeur = 'joueur';
    state.contrats.push({
      id: newId(state),
      artisteId: artist.id,
      clauses: {
        avance: cents(0),
        royaltiesArtisteBps: RI.buyoutContract.royaltiesBps,
        dureeAnnees: RI.buyoutContract.years,
        exclusivite: false,
        part360Bps: 0,
        clauseRachat: cents(0),
      },
      signeLe: ctx.tick,
      echeance: ctx.tick + RI.buyoutContract.years * 52,
      recette360: 0,
    });
    ctx.emit({ kind: 'artiste-signe', payload: { artisteId: artist.id } });
  },
};
