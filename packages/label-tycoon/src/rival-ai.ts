import type { Phase, Rng } from '@tycoon/core';
import { type Artist, generateArtist, notoriety, takenStageNames } from './artists';
import { PERSONALITIES, RIVAL_AI, RIVAL_RELEASES, STREAMS } from './balance';
import { fairAdvance } from './contracts';
import { rivalInteractions, rosterOf } from './rival-interactions';

export { rosterOf };
import type { Rival } from './auction';
import { genreKeys, trendMultiplier } from './market';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { newId } from './state';

/** Revenu hebdomadaire du roster d'un rival, avec les mêmes constantes de streaming que le joueur. */
export function rivalIncome(roster: readonly Artist[]): number {
  return roster.reduce(
    (sum, a) =>
      sum +
      Math.round(
        a.fanbase * RIVAL_AI.revenueShare * STREAMS.listensPerFan * STREAMS.centsPerStream,
      ),
    0,
  );
}

/**
 * Utilité d'un talent libre pour un rival : critères pondérés par sa personnalité (valeur sûre,
 * talent précoce, tendance du genre) plus un bonus de genre fétiche, moins le risque financier.
 */
export function signingUtility(state: LabelState, rival: Rival, artist: Artist): number {
  const w = PERSONALITIES[rival.personnalite].poids;
  const surete = notoriety(artist.fanbase) / 100;
  const precoce =
    (artist.potentiel / 100) * (artist.phase === 'emergent' || artist.phase === 'montee' ? 1 : 0.3);
  const tendance = trendMultiplier(state.marche.genres[artist.genre]?.popularite ?? 50) - 0.5;
  const bonus = artist.genre === rival.genreFetiche ? RIVAL_AI.genreBonus : 0;
  const risk =
    RIVAL_AI.riskWeight * Math.min(1, fairAdvance(artist) / Math.max(1, rival.tresorerie));
  return w.surete * surete + w.precoce * precoce + w.tendance * tendance + bonus - risk;
}

function spawnFreeArtist(state: LabelState, rival: Rival, rng: Rng): Artist {
  const artist = generateArtist(
    rng,
    {
      id: newId(state),
      market: state.marche,
      cities: state.villes,
      takenNames: takenStageNames(state.artistes),
    },
    rival.personnalite === 'pointu' ? { genre: rival.genreFetiche } : {},
  );
  state.artistes.push(artist);
  return artist;
}

/** Semaines pendant lesquelles les rivaux ne jouent pas dans le tutoriel. */
export const TUTORIEL_SANS_RIVAUX = 16;

/** Phase « rivaux » : revenus, dépenses, signatures, repérage et sorties, par utilité et dans la limite de candidats. */
export const rivalsPhase: Phase<LabelState, LabelSignal> = {
  name: 'rivaux',
  run(state, ctx) {
    // Tutoriel : les rivaux laissent le temps d'apprendre, sinon les talents repérés leur échappent.
    if (state.config.mode === 'tutoriel' && ctx.tick < TUTORIEL_SANS_RIVAUX) return;
    const rng = ctx.rng('rivaux');
    const aggression = state.config.difficulty.rivalAggression;
    const genres = genreKeys(state.marche);
    // Artistes libres, dans l'ordre du monde, tenus à jour au fil des signatures et des repérages :
    // les recalculer pour chaque rival coûterait un parcours de tout le monde à chaque fois.
    const libres = state.artistes.filter((a) => a.employeur === 'libre');
    // Artistes qui ont déjà une sortie rivale annoncée ou à venir.
    const avecSortie = new Set<number>();
    for (const s of state.sortiesRivales)
      if (s.artisteId !== null && s.semaine >= ctx.tick) avecSortie.add(s.artisteId);
    for (const rival of state.rivaux) {
      const roster = rosterOf(state, rival);
      rival.tresorerie +=
        rivalIncome(roster) - RIVAL_AI.weeklyOverhead - roster.length * RIVAL_AI.salaryPerArtist;
      rival.semainesNegatives = rival.tresorerie < 0 ? rival.semainesNegatives + 1 : 0;
      if (rival.tresorerie < 0) continue;

      // 1. Signature : meilleur candidat libre par utilité, parmi un nombre borné
      if (rng.chance(Math.min(1, RIVAL_AI.signChance * aggression))) {
        const free = libres;
        const picks: Artist[] = [];
        for (let i = 0; i < Math.min(RIVAL_AI.candidates, free.length); i += 1) {
          const candidate = rng.pick(free);
          if (!picks.includes(candidate)) picks.push(candidate);
        }
        let best: { artist: Artist; utility: number } | null = null;
        for (const artist of picks) {
          const utility = signingUtility(state, rival, artist);
          if (!best || utility > best.utility) best = { artist, utility };
        }
        if (best && best.utility >= RIVAL_AI.signThreshold) {
          const cost = fairAdvance(best.artist);
          if (cost <= rival.tresorerie * 0.5 && rival.tresorerie - cost >= RIVAL_AI.reserve) {
            rival.tresorerie -= cost;
            best.artist.employeur = `rival:${rival.id}`;
            libres.splice(libres.indexOf(best.artist), 1);
            state.suivis = state.suivis.filter((p) => p.artisteId !== best?.artist.id);
            ctx.emit({
              kind: 'signature-rivale',
              payload: { rivalId: rival.id, artisteId: best.artist.id },
            });
          }
        }
      }

      // 2. Repérage maison : les rivaux font vivre le vivier de talents
      const scoutChance =
        RIVAL_AI.scoutChance * (rival.personnalite === 'pointu' ? RIVAL_AI.scoutPointuFactor : 1);
      if (
        rival.tresorerie > RIVAL_AI.scoutCost &&
        rng.chance(Math.min(1, scoutChance * aggression))
      ) {
        rival.tresorerie -= RIVAL_AI.scoutCost;
        libres.push(spawnFreeArtist(state, rival, rng));
      }

      // 3. Sorties : un artiste du roster sans sortie à venir en prépare une, selon la trésorerie
      for (const artist of roster) {
        if (avecSortie.has(artist.id)) continue;
        if (!rng.chance(Math.min(1, RIVAL_RELEASES.weeklyChance * aggression))) continue;
        const affordable = RIVAL_RELEASES.weights.filter(
          (p) =>
            p * RIVAL_AI.releaseCostPerWeight <= rival.tresorerie * 0.4 &&
            rival.tresorerie - p * RIVAL_AI.releaseCostPerWeight >= RIVAL_AI.reserve,
        );
        if (affordable.length === 0) continue;
        const poids = rng.pick(affordable);
        rival.tresorerie -= poids * RIVAL_AI.releaseCostPerWeight;
        state.sortiesRivales.push({
          id: newId(state),
          rivalId: rival.id,
          genre: genres.includes(artist.genre) ? artist.genre : rng.pick(genres),
          semaine: ctx.tick + rng.int(RIVAL_RELEASES.leadWeeks.min, RIVAL_RELEASES.leadWeeks.max),
          poids,
          annoncee: rng.chance(RIVAL_RELEASES.announceChance),
          artisteId: artist.id,
        });
        ctx.emit({ kind: 'sortie-rivale', payload: { rivalId: rival.id, artisteId: artist.id } });
      }
    }
    rivalInteractions(state, ctx.tick, rng, ctx.emit);
    state.sortiesRivales = state.sortiesRivales.filter(
      (s) => s.semaine >= ctx.tick - RIVAL_RELEASES.keepWeeks,
    );
  },
};
