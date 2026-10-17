import { gaussian, mulberry32 } from './prng';

/**
 * Un pas de marche aléatoire sur le logarithme du cours.
 *
 * - Le rendement est gaussien, d'écart-type `volatility` : un cours ne change jamais de signe
 *   et les variations restent proportionnelles au niveau du cours.
 * - Un léger rappel vers `anchor` (le cours de référence) empêche la dérive : sans lui, une
 *   marche de plusieurs centaines de pas finit par s'éloigner franchement de son point de départ.
 */
export function stepPrice(
  price: number,
  anchor: number,
  volatility: number,
  rand: () => number,
): number {
  const pull = -0.04 * Math.log(price / anchor);
  const next = price * Math.exp(pull + volatility * gaussian(rand));
  return Math.max(0.01, Math.round(next * 100) / 100);
}

/**
 * Historique initial reproductible : le même (seed, anchor, volatility) donne toujours la même
 * courbe, donc tous les visiteurs voient la même séance. Le dernier point est le cours actuel.
 */
export function seededHistory(
  seed: number,
  anchor: number,
  volatility: number,
  length: number,
): number[] {
  const rand = mulberry32(seed);
  const points = [anchor];
  for (let i = 1; i < length; i += 1) {
    points.push(stepPrice(points[i - 1] ?? anchor, anchor, volatility, rand));
  }
  return points;
}
