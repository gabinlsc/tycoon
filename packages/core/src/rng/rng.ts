import { type Seed, seedToU32, splitMix32 } from './seed';
import { type RngState, isValidState, xoshiroNext } from './xoshiro';

const TWO_POW_32 = 4294967296;

/** Construit l'état initial d'une graine : quatre mots tirés de SplitMix32, jamais tous nuls. */
export function stateFromSeed(seed: Seed): RngState {
  const next = splitMix32(seedToU32(seed));
  const state: RngState = [next(), next(), next(), next()];
  // Probabilité de 2^-128 d'obtenir quatre zéros ; on garde la garantie de toute façon.
  return isValidState(state) ? state : [1, 2, 3, 4];
}

/**
 * Générateur à graine.
 *
 * C'est une enveloppe pratique autour d'un état : chaque tirage fait avancer l'état interne.
 * Pour rester pur vis-à-vis du reste du code, on le construit à partir d'un `RngState` lu dans
 * l'état de jeu, on tire, puis on réécrit `snapshot()` dans le nouvel état.
 */
export class Rng {
  private state: RngState;

  constructor(state: RngState) {
    if (!isValidState(state))
      throw new RangeError('État de générateur invalide (quatre mots 32 bits non tous nuls)');
    this.state = state;
  }

  static fromSeed(seed: Seed): Rng {
    return new Rng(stateFromSeed(seed));
  }

  /** État courant, à stocker dans l'état de jeu. Les tableaux étant recopiés, aucun alias. */
  snapshot(): RngState {
    return [this.state[0], this.state[1], this.state[2], this.state[3]];
  }

  /** Entier de 32 bits non signé, uniforme. */
  nextU32(): number {
    const [value, next] = xoshiroNext(this.state);
    this.state = next;
    return value;
  }

  /** Flottant uniforme dans [0, 1). */
  float(): number {
    return this.nextU32() / TWO_POW_32;
  }

  /** Vrai avec la probabilité `p` (bornée à [0, 1]). */
  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.float() < p;
  }

  /** Flottant uniforme dans [min, max). */
  range(min: number, max: number): number {
    return min + this.float() * (max - min);
  }

  /**
   * Entier uniforme dans [min, max], bornes comprises. Rejet des valeurs qui biaiseraient le
   * modulo : sans cela, certaines valeurs seraient légèrement plus probables que d'autres.
   */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Intervalle d'entiers invalide : [${min}, ${max}]`);
    }
    const span = max - min + 1;
    if (span > TWO_POW_32) throw new RangeError('Intervalle trop large (maximum 2^32 valeurs)');
    const limit = TWO_POW_32 - (TWO_POW_32 % span);
    let value = this.nextU32();
    while (value >= limit) value = this.nextU32();
    return min + (value % span);
  }

  /**
   * Tirage gaussien (Box-Muller). On consomme toujours exactement deux tirages et on n'en garde
   * qu'un, pour ne cacher aucun état entre deux appels : tout l'état est dans `snapshot()`.
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = 1 - this.float(); // ]0, 1], évite log(0)
    const u2 = this.float();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }

  /** Élément uniforme d'une liste non vide. */
  pick<T>(items: readonly T[]): T {
    const item = items[this.int(0, items.length - 1)];
    if (items.length === 0 || item === undefined) throw new RangeError('pick sur une liste vide');
    return item;
  }

  /** Élément tiré avec des poids. Les poids négatifs ou tous nuls sont des erreurs. */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    let total = 0;
    const weights = items.map((item) => {
      const w = weightOf(item);
      if (!(w >= 0)) throw new RangeError(`Poids invalide : ${String(w)}`);
      total += w;
      return w;
    });
    if (items.length === 0 || total <= 0) throw new RangeError('Aucun élément tirable');
    let threshold = this.float() * total;
    for (let i = 0; i < items.length; i += 1) {
      threshold -= weights[i] ?? 0;
      if (threshold < 0) return items[i] as T;
    }
    return items[items.length - 1] as T; // reliquat d'arrondi flottant
  }

  /** Nouvelle liste mélangée (Fisher-Yates). La liste d'origine n'est pas modifiée. */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      const a = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = a;
    }
    return copy;
  }

  /** `count` éléments distincts d'une liste, dans un ordre aléatoire. */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.max(0, count));
  }
}
