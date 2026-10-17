/**
 * xoshiro128** (Blackman et Vigna), état de quatre mots de 32 bits.
 * Rapide, de très bonne qualité statistique, période 2^128 − 1.
 * Implémentation fonctionnelle : l'état est une valeur, jamais mutée en place.
 */

export type RngState = readonly [number, number, number, number];

const rotl = (x: number, k: number): number => ((x << k) | (x >>> (32 - k))) >>> 0;

/** Un pas du générateur : renvoie le mot de 32 bits produit et le nouvel état. */
export function xoshiroNext(state: RngState): [number, RngState] {
  const [s0, s1, s2, s3] = state;
  const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const t = (s1 << 9) >>> 0;

  const n2 = (s2 ^ s0) >>> 0;
  const n3 = (s3 ^ s1) >>> 0;
  const n1 = (s1 ^ n2) >>> 0;
  const n0 = (s0 ^ n3) >>> 0;
  return [result, [n0, n1, (n2 ^ t) >>> 0, rotl(n3, 11)]];
}

/** Un état entièrement nul est un point fixe du générateur : il est interdit. */
export function isValidState(state: readonly number[]): state is RngState {
  return (
    state.length === 4 &&
    state.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffffffff) &&
    state.some((word) => word !== 0)
  );
}
