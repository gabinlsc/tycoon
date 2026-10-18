import { type Rng, Rng as RngClass, cents, money } from '@tycoon/core';
import type { LabelAction } from './actions';
import { type Clauses, fairAdvance } from './contracts';
import { newGame, type LabelSession, labelGame } from './game';
import { knownRange, VISIBLE_ATTRIBUTES } from './scouting';
import { productionCapacity, studioCap } from './buildings';
import type { LabelState } from './state';
import type { GameConfig } from './config';

/** Stratégies de bots : elles jouent comme un joueur, par les mêmes actions, pour mesurer l'équilibrage. */
export type BotStrategy = 'prudent' | 'agressif' | 'specialiste' | 'aleatoire';
export const BOT_STRATEGIES: readonly BotStrategy[] = [
  'prudent',
  'agressif',
  'specialiste',
  'aleatoire',
];

export interface BotContext {
  state: LabelState;
  tick: number;
  rng: Rng;
  /** Genre de prédilection du spécialiste. */
  genre: string;
}

export type Bot = (ctx: BotContext) => LabelAction[];

const euros = (n: number) => money.euros(n);

const clausesFor = (generosity: number, artist: Parameters<typeof fairAdvance>[0]): Clauses => ({
  avance: cents(Math.round(fairAdvance(artist) * generosity)),
  royaltiesArtisteBps: 5500,
  dureeAnnees: 2,
  exclusivite: false,
  part360Bps: 0,
  clauseRachat: cents(0),
});

/** Meilleur talent suivi selon le milieu des fourchettes visibles (jamais la valeur réelle). */
function bestProspect(state: LabelState, genre?: string) {
  let best: { id: number; score: number } | null = null;
  for (const p of state.suivis) {
    const artist = state.artistes.find((a) => a.id === p.artisteId);
    if (!artist || artist.employeur !== 'libre') continue;
    if (genre && artist.genre !== genre) continue;
    let sum = 0;
    for (const attr of VISIBLE_ATTRIBUTES) {
      const range = knownRange(p, artist, attr);
      sum += range ? (range[0] + range[1]) / 2 : 0;
    }
    if (!best || sum > best.score) best = { id: artist.id, score: sum };
  }
  return best;
}

/** Actions de production communes : lancer, sortir, concerts. */
function production(ctx: BotContext, cash: number): LabelAction[] {
  const { state, tick } = ctx;
  const actions: LabelAction[] = [];
  for (const p of state.projets)
    if (p.statut === 'prete') actions.push({ type: 'sortir-projet', projetId: p.id });
  let active = state.projets.filter((p) => p.statut === 'production').length;
  for (const artist of state.artistes.filter((a) => a.employeur === 'joueur')) {
    if (
      active < productionCapacity(state) &&
      cash > euros(6000) &&
      !state.projets.some((p) => p.artisteId === artist.id && p.statut === 'production')
    ) {
      actions.push({
        type: 'lancer-projet',
        artisteId: artist.id,
        sortie: 'single',
        clip: 'aucun',
        studio: Math.min(40, studioCap(state)),
        producteur: 40,
        mixage: euros(600),
      });
      active += 1;
    }
    if (tick % 8 === 0 && artist.fanbase > 2000 && cash > euros(4000))
      actions.push({ type: 'organiser-concert', artisteId: artist.id, salle: 'club', prix: 18 });
  }
  return actions;
}

const sign = (ctx: BotContext, generosity: number, genre?: string): LabelAction[] => {
  const best = bestProspect(ctx.state, genre);
  const artist = best && ctx.state.artistes.find((a) => a.id === best.id);
  const cost = artist ? fairAdvance(artist) * generosity : Infinity;
  return artist && ctx.state.label.tresorerie > cost + euros(4000)
    ? [{ type: 'signer', artisteId: artist.id, clauses: clausesFor(generosity, artist) }]
    : [];
};

export const BOTS: Readonly<Record<BotStrategy, Bot>> = {
  prudent(ctx) {
    const { state, tick } = ctx;
    const actions: LabelAction[] = [];
    if (tick % 4 === 0 && state.suivis.length < 8)
      actions.push({ type: 'reperer', source: 'candidature' });
    if (tick % 6 === 0) actions.push(...sign(ctx, 1.4));
    actions.push(...production(ctx, state.label.tresorerie));
    return actions;
  },
  agressif(ctx) {
    const { state, tick } = ctx;
    const actions: LabelAction[] = [];
    if (tick % 2 === 0 && state.suivis.length < 20)
      actions.push({ type: 'reperer', source: 'plateforme' });
    if (tick % 3 === 0) actions.push(...sign(ctx, 2));
    actions.push(...production(ctx, state.label.tresorerie));
    if (tick % 26 === 0 && state.prets.length === 0)
      actions.push({ type: 'emprunter', montant: euros(20_000), semaines: 104 });
    return actions;
  },
  specialiste(ctx) {
    const { state, tick } = ctx;
    const actions: LabelAction[] = [];
    if (tick % 4 === 0 && state.suivis.length < 10)
      actions.push({ type: 'reperer', source: 'battle' });
    if (tick % 4 === 0) actions.push(...sign(ctx, 1.6, ctx.genre));
    actions.push(...production(ctx, state.label.tresorerie));
    return actions;
  },
  aleatoire(ctx) {
    const { state, rng } = ctx;
    const actions: LabelAction[] = [];
    if (rng.chance(0.3))
      actions.push({
        type: 'reperer',
        source: rng.pick(['open-mic', 'plateforme', 'battle', 'candidature'] as const),
      });
    if (rng.chance(0.2)) actions.push(...sign(ctx, 1 + rng.float()));
    if (rng.chance(0.5)) actions.push(...production(ctx, state.label.tresorerie));
    return actions;
  },
};

export interface BotRun {
  session: LabelSession;
  /** Actions acceptées et refusées par le jeu. */
  jouees: number;
  refusees: number;
  /** Semaine de la faillite, ou `null`. */
  faillite: number | null;
  /** Première semaine de disque d'or, ou `null`. */
  premierOr: number | null;
}

/** Fait jouer un bot pendant `weeks` semaines, de façon déterministe. */
export function runBot(
  strategy: BotStrategy,
  seed: string,
  weeks: number,
  config?: GameConfig,
): BotRun {
  let session = newGame(seed, config);
  const rng = RngClass.fromSeed(`bot:${strategy}:${seed}`);
  const genre = rng.pick(['rap', 'afro', 'pop-urbaine', 'trap']);
  let jouees = 0;
  let refusees = 0;
  let faillite: number | null = null;
  let premierOr: number | null = null;
  for (let tick = 0; tick < weeks; tick += 1) {
    for (const action of BOTS[strategy]({ state: session.engine.data, tick, rng, genre })) {
      const result = labelGame.dispatch(session, action);
      if (result.ok) {
        session = result.session;
        jouees += 1;
      } else refusees += 1;
    }
    session = labelGame.advance(session, 1).session;
    const d = session.engine.data;
    if (d.faillite.terminee) {
      faillite = tick;
      break;
    }
    if (premierOr === null && d.projets.some((p) => p.certification !== null)) premierOr = tick;
  }
  return { session, jouees, refusees, faillite, premierOr };
}
