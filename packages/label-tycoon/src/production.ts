import { type ActionHandler, type Phase, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import {
  CLIPS,
  PRODUCTION,
  STREAMS,
  RELEASE_TYPES,
  type ClipSize,
  type ReleaseType,
} from './balance';
import type { CertificationLevel } from './balance/tiers';
import { productionCapacity, studioCap } from './buildings';
import { labelShare } from './contracts';
import { canAfford, earn, spend } from './finance';
import { fansGained, viralStep } from './viral';
import { weeklyStreams } from './formulas/streams';
import { collisionFactor } from './calendar';
import { firstWeekStreams, hitPotential, marketingFactor } from './formulas/streams';
import { trendMultiplier } from './market';
import { trackQuality } from './formulas/quality';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export type ProjectStatus = 'production' | 'prete' | 'sortie';

export interface Projet {
  id: number;
  artisteId: number;
  type: ReleaseType;
  clip: ClipSize;
  /** Niveau du studio (0-100) et du producteur (0-100), fixés au lancement. */
  studio: number;
  producteur: number;
  /** Budget de mixage par titre. */
  mixage: number;
  debut: number;
  /** Semaine de fin prévue, retard compris. */
  fin: number;
  /** Retard tiré au lancement (semaines). */
  retard: number;
  statut: ProjectStatus;
  /** Qualité réelle, connue seulement une fois le projet prêt. */
  qualite: number | null;
  sortieLe: number | null;
  /** Streams de la première semaine, fixés à la sortie. */
  s1: number;
  /** Potentiel de hit fixé à la sortie. */
  hit: number;
  /** Emballement viral en cours (semaines restantes et multiplicateur). */
  viral: { semaines: number; mult: number } | null;
  /** Cumul des streams depuis la sortie. */
  streams: number;
  /** Streams de la dernière semaine (alimente les classements). */
  derniers: number;
  /** Meilleure certification obtenue. */
  certification: CertificationLevel | null;
}

/** Coût total d'un projet. */
export function projectCost(type: ReleaseType, clip: ClipSize, studio: number, mixage: number) {
  const t = RELEASE_TYPES[type];
  return cents(
    t.cout + CLIPS[clip].cout + t.titres * (studio * PRODUCTION.studioCostPerLevel + mixage),
  );
}

/** Qualité de mixage (0-100) donnée par un budget par titre. */
export const mixingQuality = (mixage: number): number =>
  clamp((100 * mixage) / PRODUCTION.mixingCostFor100, 0, 100);

export interface LaunchAction extends Action {
  readonly type: 'lancer-projet';
  readonly artisteId: number;
  readonly sortie: ReleaseType;
  readonly clip: ClipSize;
  readonly studio: number;
  readonly producteur: number;
  readonly mixage: number;
}
export interface ReleaseAction extends Action {
  readonly type: 'sortir-projet';
  readonly projetId: number;
}

export const launchProject: ActionHandler<LabelState, LaunchAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'joueur') return reject('artiste-non-signe');
    if (!(action.sortie in RELEASE_TYPES) || !(action.clip in CLIPS))
      return reject('projet-invalide');
    for (const level of [action.studio, action.producteur])
      if (!Number.isInteger(level) || level < 0 || level > 100) return reject('projet-invalide');
    if (!Number.isInteger(action.mixage) || action.mixage < 0) return reject('projet-invalide');
    const active = state.projets.filter((p) => p.statut === 'production');
    if (active.length >= productionCapacity(state))
      return reject('studio-sature', { max: productionCapacity(state) });
    if (action.studio > studioCap(state))
      return reject('studio-trop-modeste', { max: studioCap(state) });
    const cost = projectCost(action.sortie, action.clip, action.studio, action.mixage);
    return canAfford(state, cost) ? null : reject('fonds-insuffisants', { besoin: cost });
  },
  apply(state, action, ctx) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return;
    spend(
      state,
      'production',
      projectCost(action.sortie, action.clip, action.studio, action.mixage),
    );
    const profile = RELEASE_TYPES[action.sortie];
    const factor =
      PRODUCTION.durationBase - (PRODUCTION.durationEthicsSlope * artist.ethique) / 100;
    const base = Math.max(1, Math.round(profile.semaines * factor)) + CLIPS[action.clip].semaines;
    const rng = ctx.rng('production');
    const retard = rng.chance(PRODUCTION.delayChance)
      ? Math.max(1, Math.round(base * PRODUCTION.delayMaxShare * rng.float()))
      : 0;
    state.projets.push({
      id: state.nextId,
      artisteId: artist.id,
      type: action.sortie,
      clip: action.clip,
      studio: action.studio,
      producteur: action.producteur,
      mixage: action.mixage,
      debut: ctx.tick,
      fin: ctx.tick + base + retard,
      retard,
      statut: 'production',
      qualite: null,
      sortieLe: null,
      s1: 0,
      hit: 0,
      viral: null,
      streams: 0,
      derniers: 0,
      certification: null,
    });
    state.nextId += 1;
    if (retard > 0)
      ctx.emit({ kind: 'projet-retarde', payload: { artisteId: artist.id, semaines: retard } });
  },
};

export const releaseProject: ActionHandler<LabelState, ReleaseAction, LabelSignal> = {
  validate(state, action) {
    const p = state.projets.find((x) => x.id === action.projetId);
    if (!p) return reject('projet-introuvable');
    return p.statut === 'prete' ? null : reject('projet-pas-pret');
  },
  apply(state, action, ctx) {
    const p = state.projets.find((x) => x.id === action.projetId);
    if (!p) return;
    const artist = state.artistes.find((a) => a.id === p.artisteId);
    const market = artist ? state.marche.genres[artist.genre] : undefined;
    p.statut = 'sortie';
    p.sortieLe = ctx.tick;
    if (artist) {
      const hit = hitPotential(
        p.qualite ?? 0,
        trendMultiplier(market?.popularite ?? 50),
        artist.hype,
        marketingFactor(0),
        state.label.credibilite[artist.genre] ?? 0,
      ).value;
      p.hit = hit;
      p.s1 = Math.round(
        firstWeekStreams(artist.fanbase, market?.audience ?? 0, hit) *
          collisionFactor(state, artist.genre, ctx.tick),
      );
      artist.hype = Math.min(100, artist.hype + 10 + (p.clip === 'gros' ? 10 : 0));
    }
    ctx.emit({ kind: 'sortie', payload: { projetId: p.id, artisteId: p.artisteId } });
  },
};

/** Phase « production » : les projets arrivés à terme sont mixés et leur qualité est tirée. */
export const productionPhase: Phase<LabelState, LabelSignal> = {
  name: 'production',
  run(state, ctx) {
    const rng = ctx.rng('production');
    for (const projet of state.projets) {
      if (projet.statut !== 'production' || ctx.tick < projet.fin) continue;
      const artist = state.artistes.find((a) => a.id === projet.artisteId);
      if (!artist) continue;
      projet.qualite = Math.round(
        trackQuality(
          {
            artist,
            genre: artist.genre,
            producer: { niveau: projet.producteur, genre: artist.genre },
            studio: projet.studio,
            mixage: mixingQuality(projet.mixage),
            featuring: 0,
          },
          rng,
        ).value,
      );
      projet.statut = 'prete';
      ctx.emit({
        kind: 'projet-termine',
        payload: { projetId: projet.id, artisteId: projet.artisteId },
        interrupt: true,
      });
    }
  },
};

/** Phase « streams » : chaque sortie rapporte ses écoutes de la semaine, partagées selon le contrat. */
export const streamsPhase: Phase<LabelState, LabelSignal> = {
  name: 'streams',
  run(state, ctx) {
    const rng = ctx.rng('marche');
    for (const p of state.projets) {
      if (p.statut !== 'sortie' || p.sortieLe === null) continue;
      const artist = state.artistes.find((a) => a.id === p.artisteId);
      const viral = artist ? viralStep(p, artist, rng) : null;
      if (viral) ctx.emit({ kind: 'viral', payload: { projetId: p.id, artisteId: p.artisteId } });
      const streams = Math.round(
        weeklyStreams(p.s1, p.qualite ?? 0, ctx.tick - p.sortieLe) * (p.viral?.mult ?? 1),
      );
      p.streams += streams;
      p.derniers = streams;
      if (artist) artist.fanbase += fansGained(streams, artist.charisme);
      const gross = cents(
        Math.round(streams * STREAMS.centsPerStream * state.marche.facteurStreaming),
      );
      if (gross <= 0) continue;
      const contract = state.contrats.find((c) => c.artisteId === p.artisteId);
      earn(state, 'streaming', contract ? labelShare(contract.clauses, gross) : gross);
    }
  },
};
