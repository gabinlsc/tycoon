import { exp } from './dmath';

/** Courbe logistique : monte de 0 à 1, centrée sur `midpoint`, pente `steepness`. */
export const logistic = (x: number, midpoint = 0, steepness = 1): number =>
  1 / (1 + exp(-steepness * (x - midpoint)));

/** Décroissance exponentielle e^(−λ·t) : poids restant après `t` périodes. */
export const expDecay = (t: number, lambda: number): number => exp(-lambda * t);

/** Densité de la loi normale (non normalisée si `normalized` est faux : pic à 1). */
export function gaussianCurve(x: number, mean: number, stdDev: number, normalized = false): number {
  const z = (x - mean) / stdDev;
  const value = exp(-0.5 * z * z);
  return normalized ? value / (stdDev * 2.5066282746310002) : value;
}

/**
 * Courbe affine par morceaux à partir de points (x croissant). Hors des bornes, la valeur du
 * premier ou du dernier point est conservée (pas d'extrapolation).
 */
export function piecewiseLinear(
  points: ReadonlyArray<readonly [number, number]>,
): (x: number) => number {
  if (points.length === 0) throw new RangeError('Courbe vide');
  for (let i = 1; i < points.length; i += 1) {
    if ((points[i]?.[0] ?? 0) <= (points[i - 1]?.[0] ?? 0)) {
      throw new RangeError('Les abscisses doivent être strictement croissantes');
    }
  }
  return (x) => {
    const first = points[0] as readonly [number, number];
    const last = points[points.length - 1] as readonly [number, number];
    if (x <= first[0]) return first[1];
    if (x >= last[0]) return last[1];
    for (let i = 1; i < points.length; i += 1) {
      const [x1, y1] = points[i] as readonly [number, number];
      if (x <= x1) {
        const [x0, y0] = points[i - 1] as readonly [number, number];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return last[1];
  };
}

/**
 * Un pas de retour à la moyenne : la valeur se rapproche de `target` d'une fraction `speed`
 * (0 = aucune, 1 = d'un coup).
 */
export const meanReversion = (value: number, target: number, speed: number): number =>
  value + speed * (target - value);

/**
 * Un pas d'Ornstein-Uhlenbeck discret : retour à la moyenne plus un choc `shock`, qui vient d'un
 * tirage gaussien du générateur à graine (écart-type `volatility`). Sert aux tendances de genre.
 */
export const ornsteinUhlenbeckStep = (
  value: number,
  mean: number,
  speed: number,
  volatility: number,
  shock: number,
): number => meanReversion(value, mean, speed) + volatility * shock;

/** Moyenne mobile exponentielle : `alpha` proche de 1 réagit vite, proche de 0 lisse beaucoup. */
export const ema = (previous: number, sample: number, alpha: number): number =>
  previous + alpha * (sample - previous);
