import { exp } from './dmath';

export const clampProbability = (p: number): number => (p < 0 ? 0 : p > 1 ? 1 : p);

/** Probabilité qu'au moins un événement indépendant se produise : 1 − Π(1 − p). */
export function atLeastOne(probabilities: readonly number[]): number {
  let none = 1;
  for (const p of probabilities) none *= 1 - clampProbability(p);
  return 1 - none;
}

/** Ramène des poids positifs à des probabilités de somme 1. */
export function normalizeWeights(weights: readonly number[]): number[] {
  let sum = 0;
  for (const w of weights) {
    if (!(w >= 0)) throw new RangeError(`Poids invalide : ${String(w)}`);
    sum += w;
  }
  if (sum <= 0) throw new RangeError('La somme des poids doit être positive');
  return weights.map((w) => w / sum);
}

/** Table cumulative d'une distribution : le dernier élément vaut 1 exactement. */
export function cumulative(probabilities: readonly number[]): number[] {
  const out: number[] = [];
  let running = 0;
  for (const p of probabilities) {
    running += p;
    out.push(running);
  }
  if (out.length > 0) out[out.length - 1] = 1;
  return out;
}

/** Indice tiré dans une table cumulative à partir d'un nombre uniforme `u` de [0, 1). */
export function sampleCdf(cdf: readonly number[], u: number): number {
  for (let i = 0; i < cdf.length; i += 1) if (u < (cdf[i] as number)) return i;
  return cdf.length - 1;
}

/** Softmax : transforme des scores en probabilités. `temperature` haute = tirage plus uniforme. */
export function softmax(scores: readonly number[], temperature = 1): number[] {
  if (scores.length === 0) throw new RangeError('Aucun score');
  if (!(temperature > 0)) throw new RangeError('Température invalide');
  const top = Math.max(...scores);
  const exps = scores.map((s) => exp((s - top) / temperature)); // soustraire le max évite le débordement
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}
