import { stableStringify } from './canonical';

/**
 * Empreinte 64 bits d'un texte (deux voies de 32 bits, mélange de type « cyrb »). Rapide, sans
 * BigInt, et d'une bonne dispersion : un seul bit de différence dans l'entrée change environ la
 * moitié des bits de la sortie. **Ce n'est pas une empreinte cryptographique** : elle sert à
 * détecter une divergence d'état entre deux simulations, pas à se protéger d'un tricheur.
 */
export function hashText(text: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

/** Hash d'un état : sérialisation canonique puis empreinte. Deux états égaux, même hash. */
export function hashState(state: unknown): string {
  return hashText(stableStringify(state));
}
