/** Utilitaires numériques de base. Rien ici ne dépend de `Math.exp`, `log` ou `pow` natifs. */

export const clamp = (x: number, low: number, high: number): number =>
  x < low ? low : x > high ? high : x;

export const clamp01 = (x: number): number => clamp(x, 0, 1);

/** Interpolation linéaire : `t = 0` donne `a`, `t = 1` donne `b` (t non borné). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Position de `x` entre `a` et `b`, en [0, 1] borné. Si a = b : 0. */
export const inverseLerp = (a: number, b: number, x: number): number =>
  a === b ? 0 : clamp01((x - a) / (b - a));

/** Change d'échelle : x de [inLow, inHigh] vers [outLow, outHigh], borné. */
export const remap = (
  x: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number,
): number => lerp(outLow, outHigh, inverseLerp(inLow, inHigh, x));

/** Marche douce de 0 à 1 entre `edge0` et `edge1` (dérivée nulle aux extrémités). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = inverseLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

export const approxEqual = (a: number, b: number, tolerance = 1e-9): boolean =>
  Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

/** Borne un attribut de jeu entre 0 et 100. */
export const clamp100 = (x: number): number => clamp(x, 0, 100);

/** Reste de la division toujours positif (contrairement à `%`). */
export const mod = (n: number, m: number): number => ((n % m) + m) % m;
