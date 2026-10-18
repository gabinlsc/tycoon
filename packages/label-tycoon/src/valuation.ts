import { type Explained, cents, explain, pow } from '@tycoon/core';
import { STREAMS, VALUATION } from './balance';
import { fairAdvance } from './contracts';
import { cumulativeStreams } from './formulas/streams';
import { outstanding } from './loans';
import { investorShareBps } from './investors';
import type { LabelState } from './state';

/** Facteur d'actualisation pour `weeks` semaines. */
export const discount = (weeks: number): number =>
  1 / pow(1 + VALUATION.discountRateBps / 10_000, weeks / 52);

/** Valeur actuelle des royalties futures d'une sortie, sur l'horizon borné (en centimes). */
export function releaseValue(state: LabelState, projetId: number, tick: number): number {
  const p = state.projets.find((x) => x.id === projetId);
  if (!p || p.statut !== 'sortie' || p.sortieLe === null || p.s1 <= 0) return 0;
  const age = Math.max(0, tick - p.sortieLe);
  const streams = cumulativeStreams(p.s1, p.qualite ?? 0, age + 1, age + VALUATION.catalogHorizon);
  const contract = state.contrats.find((c) => c.artisteId === p.artisteId);
  const labelShare = 1 - (contract?.clauses.royaltiesArtisteBps ?? 0) / 10_000;
  return Math.round(
    streams * STREAMS.centsPerStream * labelShare * discount(VALUATION.catalogHorizon / 2),
  );
}

/** Valeur des contrats en cours. */
export function contractsValue(state: LabelState, tick: number): number {
  let total = 0;
  for (const c of state.contrats) {
    const artist = state.artistes.find((a) => a.id === c.artisteId);
    if (!artist) continue;
    const years = Math.max(0, (c.echeance - tick) / 52);
    total += fairAdvance(artist) * years * VALUATION.contractFactor;
  }
  return Math.round(total);
}

/**
 * Valorisation : trésorerie + catalogue + contrats − dettes, détaillée terme par terme. La part
 * des investisseurs est retranchée par `labelScore`.
 */
export function valuation(state: LabelState, tick: number): Explained {
  const catalog = state.projets.reduce((sum, p) => sum + releaseValue(state, p.id, tick), 0);
  return explain()
    .term('tresorerie', state.label.tresorerie)
    .term('catalogue', catalog)
    .term('contrats', contractsValue(state, tick))
    .term('dettes', -outstanding(state))
    .done();
}

/** Score du joueur : valorisation moins la part cédée aux investisseurs (jamais négatif). */
export function labelScore(state: LabelState, tick: number): number {
  const value = valuation(state, tick).value;
  return cents(Math.max(0, Math.round(value * (1 - investorShareBps(state) / 10_000))));
}
