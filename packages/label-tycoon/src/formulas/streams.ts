import { type Explained, exp, explain, ln, pow } from '@tycoon/core';
import { STREAMS } from '../balance';

/** Facteur de marketing : 1 + k·log10(1 + budget/1000 €), plafonné. Budget en euros. */
export function marketingFactor(budgetEuros: number): number {
  const log10 = ln(1 + Math.max(0, budgetEuros) / 1000) / ln(10);
  return Math.min(1 + STREAMS.marketingK * log10, STREAMS.marketingCap);
}

/** Potentiel de hit H = (Q/100)^1,5 × tendance × (1 + hype/100) × marketing, avec son détail. */
export function hitPotential(
  quality: number,
  trend: number,
  hype: number,
  marketing: number,
): Explained {
  return explain()
    .term('qualite', pow(quality / 100, STREAMS.qualityExponent))
    .scale('tendance', trend)
    .scale('hype', 1 + hype / 100)
    .scale('marketing', marketing)
    .done();
}

/** Streams de la première semaine. */
export function firstWeekStreams(fanbase: number, genreAudience: number, hit: number): number {
  return (fanbase * STREAMS.listensPerFan + genreAudience * STREAMS.discoveryRate) * hit;
}

export const decayRate = (quality: number): number =>
  STREAMS.lambdaBase - (STREAMS.lambdaQuality * quality) / 100;

/** Streams de la semaine `t` après la sortie (t = 0 : première semaine), traîne comprise. */
export function weeklyStreams(s1: number, quality: number, t: number): number {
  const decay = t > STREAMS.activeWindow ? 0 : exp(-decayRate(quality) * t);
  return s1 * (decay + STREAMS.tail);
}

/** Cumul des streams des semaines `from`..`to` incluses, calculé en forme fermée (série géométrique). */
export function cumulativeStreams(s1: number, quality: number, from: number, to: number): number {
  if (to < from) return 0;
  const lambda = decayRate(quality);
  const r = exp(-lambda);
  const last = Math.min(to, STREAMS.activeWindow);
  let sum = 0;
  if (from <= last) sum = (s1 * (exp(-lambda * from) - exp(-lambda * (last + 1)))) / (1 - r);
  return sum + s1 * STREAMS.tail * (to - from + 1);
}
