/** Statistiques simples. Les sommes se font toujours dans l'ordre : résultat reproductible. */

export const total = (values: readonly number[]): number => {
  let sum = 0;
  for (const v of values) sum += v;
  return sum;
};

export function mean(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError("Moyenne d'une liste vide");
  return total(values) / values.length;
}

/** Moyenne pondérée de paires [valeur, poids]. Les poids doivent être positifs, de somme non nulle. */
export function weightedMean(pairs: ReadonlyArray<readonly [number, number]>): number {
  let weightSum = 0;
  let weighted = 0;
  for (const [value, weight] of pairs) {
    if (!(weight >= 0)) throw new RangeError(`Poids invalide : ${String(weight)}`);
    weightSum += weight;
    weighted += value * weight;
  }
  if (weightSum <= 0) throw new RangeError('La somme des poids doit être positive');
  return weighted / weightSum;
}

export function variance(values: readonly number[]): number {
  const m = mean(values);
  return total(values.map((v) => (v - m) * (v - m))) / values.length;
}

export const stdDev = (values: readonly number[]): number => Math.sqrt(variance(values));

/** Percentile par interpolation linéaire (p dans [0, 100]). Ne modifie pas la liste. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) throw new RangeError("Percentile d'une liste vide");
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (Math.min(100, Math.max(0, p)) / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const a = sorted[low] as number;
  const b = sorted[high] as number;
  return a + (b - a) * (rank - low);
}

export const median = (values: readonly number[]): number => percentile(values, 50);
