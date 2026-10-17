/**
 * Graines : transformation d'un nombre ou d'un texte en état initial du générateur.
 * Tout est entier 32 bits non signé, sans aucune source externe.
 */

export type Seed = number | string;

/** Empreinte FNV-1a 32 bits d'un texte (par points de code, donc stable pour tout Unicode). */
export function hashString32(text: string): number {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Ramène une graine quelconque à un entier 32 bits non signé. */
export function seedToU32(seed: Seed): number {
  if (typeof seed === 'string') return hashString32(seed);
  if (!Number.isFinite(seed)) throw new RangeError(`Graine invalide : ${String(seed)}`);
  // On garde la partie entière et on replie sur 32 bits : 2^32 + 5 donne la même graine que 5.
  return Math.trunc(seed) >>> 0;
}

/**
 * SplitMix32 : étale une graine de 32 bits en une suite de mots bien mélangés. C'est la méthode
 * recommandée pour initialiser un générateur dont l'état est plus large que la graine : deux
 * graines voisines (1 et 2) donnent des états sans aucun rapport.
 */
export function splitMix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}
