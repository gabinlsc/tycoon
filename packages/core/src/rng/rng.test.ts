import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  Rng,
  createStreams,
  hashString32,
  isValidState,
  stateFromSeed,
  withStream,
  xoshiroNext,
} from './index';
import type { RngState } from './index';

/** Implémentation de référence, volontairement différente (BigInt) : elle valide le code optimisé. */
function referenceSequence(initial: RngState, count: number): number[] {
  const mask = 0xffffffffn;
  const rotl = (x: bigint, k: bigint) => ((x << k) | (x >> (32n - k))) & mask;
  let [s0, s1, s2, s3] = initial.map(BigInt) as [bigint, bigint, bigint, bigint];
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(Number((rotl((s1 * 5n) & mask, 7n) * 9n) & mask));
    const t = (s1 << 9n) & mask;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = rotl(s3, 11n);
  }
  return out;
}

describe('xoshiro128**', () => {
  it("produit la valeur de référence connue pour l'état [1, 2, 3, 4]", () => {
    // rotl(2 × 5, 7) × 9 = 1280 × 9 = 11520
    expect(xoshiroNext([1, 2, 3, 4])[0]).toBe(11520);
  });

  it("suit exactement l'implémentation de référence sur 2000 pas", () => {
    const start = stateFromSeed(12345);
    const expected = referenceSequence(start, 2000);
    let state = start;
    const actual: number[] = [];
    for (let i = 0; i < 2000; i += 1) {
      const [value, next] = xoshiroNext(state);
      actual.push(value);
      state = next;
    }
    expect(actual).toEqual(expected);
  });

  it("ne modifie jamais l'état reçu", () => {
    const state: RngState = [5, 6, 7, 8];
    xoshiroNext(state);
    expect(state).toEqual([5, 6, 7, 8]);
  });
});

describe('graines', () => {
  it('est déterministe', () => {
    const a = Rng.fromSeed('partie-1');
    const b = Rng.fromSeed('partie-1');
    for (let i = 0; i < 100; i += 1) expect(a.nextU32()).toBe(b.nextU32());
  });

  it('donne des états sans rapport pour des graines voisines', () => {
    expect(stateFromSeed(1)).not.toEqual(stateFromSeed(2));
    expect(new Rng(stateFromSeed(1)).nextU32()).not.toBe(new Rng(stateFromSeed(2)).nextU32());
  });

  it('replie les nombres sur 32 bits et accepte les textes', () => {
    expect(stateFromSeed(5)).toEqual(stateFromSeed(2 ** 32 + 5));
    expect(stateFromSeed('abc')).toEqual(stateFromSeed('abc'));
    expect(hashString32('')).toBe(0x811c9dc5);
  });

  it('refuse les graines non finies', () => {
    expect(() => stateFromSeed(Number.NaN)).toThrow(RangeError);
    expect(() => stateFromSeed(Infinity)).toThrow(RangeError);
  });

  it("n'initialise jamais un état nul", () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer(), fc.string()), (seed) => isValidState(stateFromSeed(seed))),
    );
  });
});

describe('sérialisation', () => {
  it("reprend exactement là où elle s'est arrêtée après un aller-retour JSON", () => {
    const rng = Rng.fromSeed(7);
    for (let i = 0; i < 50; i += 1) rng.nextU32();
    const saved = JSON.parse(JSON.stringify(rng.snapshot())) as RngState;
    const resumed = new Rng(saved);
    for (let i = 0; i < 100; i += 1) expect(resumed.nextU32()).toBe(rng.nextU32());
  });

  it("renvoie un instantané sans alias avec l'état interne", () => {
    const rng = Rng.fromSeed(1);
    const snap = rng.snapshot() as unknown as number[];
    snap[0] = 0;
    expect(rng.snapshot()[0]).not.toBe(0);
  });

  it('refuse un état invalide', () => {
    expect(() => new Rng([0, 0, 0, 0])).toThrow(RangeError);
    expect(() => new Rng([1, 2, 3] as unknown as RngState)).toThrow(RangeError);
    expect(() => new Rng([1, 2, 3, -1])).toThrow(RangeError);
    expect(() => new Rng([1, 2, 3, 1.5])).toThrow(RangeError);
  });
});

describe('tirages', () => {
  it('float est dans [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = Rng.fromSeed(seed);
        for (let i = 0; i < 50; i += 1) {
          const x = rng.float();
          if (!(x >= 0 && x < 1)) return false;
        }
        return true;
      }),
    );
  });

  it('int respecte ses bornes, bornes comprises', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 500 }),
        (seed, min, width) => {
          const rng = Rng.fromSeed(seed);
          for (let i = 0; i < 30; i += 1) {
            const v = rng.int(min, min + width);
            if (v < min || v > min + width || !Number.isInteger(v)) return false;
          }
          return true;
        },
      ),
    );
  });

  it("int atteint toutes les valeurs d'un petit intervalle, de façon uniforme", () => {
    const rng = Rng.fromSeed('uniforme');
    const draws = 60000;
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < draws; i += 1) {
      const v = rng.int(0, 5);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    // Test du khi-deux à 5 degrés de liberté : seuil à 0,1 % = 20,5
    const expected = draws / 6;
    const chi2 = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
    expect(counts.every((c) => c > 0)).toBe(true);
    expect(chi2).toBeLessThan(20.5);
  });

  it('refuse les intervalles invalides', () => {
    const rng = Rng.fromSeed(1);
    expect(() => rng.int(3, 2)).toThrow(RangeError);
    expect(() => rng.int(0.5, 2)).toThrow(RangeError);
  });

  it('gaussian a la bonne moyenne et le bon écart-type', () => {
    const rng = Rng.fromSeed('gauss');
    const n = 100000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const x = rng.gaussian(10, 3);
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / n;
    const std = Math.sqrt(sumSq / n - mean * mean);
    expect(mean).toBeGreaterThan(9.95);
    expect(mean).toBeLessThan(10.05);
    expect(std).toBeGreaterThan(2.95);
    expect(std).toBeLessThan(3.05);
  });

  it('gaussian consomme un nombre fixe de tirages (aucun état caché)', () => {
    const a = Rng.fromSeed(3);
    const b = Rng.fromSeed(3);
    a.gaussian();
    b.float();
    b.float();
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it('chance respecte les cas limites et la fréquence', () => {
    const rng = Rng.fromSeed('chance');
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(-1)).toBe(false);
    expect(rng.chance(1)).toBe(true);
    let hits = 0;
    for (let i = 0; i < 20000; i += 1) if (rng.chance(0.3)) hits += 1;
    expect(hits / 20000).toBeGreaterThan(0.28);
    expect(hits / 20000).toBeLessThan(0.32);
  });

  it('pickWeighted respecte les proportions et ignore les poids nuls', () => {
    const rng = Rng.fromSeed('poids');
    const items = [
      { name: 'a', w: 1 },
      { name: 'b', w: 3 },
      { name: 'c', w: 0 },
    ];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 40000; i += 1) {
      const picked = rng.pickWeighted(items, (item) => item.w);
      counts[picked.name] = (counts[picked.name] ?? 0) + 1;
    }
    expect(counts['c']).toBe(0);
    expect((counts['b'] ?? 0) / (counts['a'] || 1)).toBeGreaterThan(2.8);
    expect((counts['b'] ?? 0) / (counts['a'] || 1)).toBeLessThan(3.2);
  });

  it('pickWeighted refuse les poids invalides et les listes non tirables', () => {
    const rng = Rng.fromSeed(1);
    expect(() => rng.pickWeighted([1], () => -1)).toThrow(RangeError);
    expect(() => rng.pickWeighted([1], () => Number.NaN)).toThrow(RangeError);
    expect(() => rng.pickWeighted([1, 2], () => 0)).toThrow(RangeError);
    expect(() => rng.pickWeighted([], () => 1)).toThrow(RangeError);
  });

  it("shuffle renvoie une permutation sans toucher l'entrée", () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { maxLength: 40 }), fc.integer(), (items, seed) => {
        const original = [...items];
        const shuffled = Rng.fromSeed(seed).shuffle(items);
        const sorted = (list: number[]) => [...list].sort((a, b) => a - b);
        return (
          JSON.stringify(items) === JSON.stringify(original) &&
          JSON.stringify(sorted(shuffled)) === JSON.stringify(sorted(original))
        );
      }),
    );
  });

  it('sample renvoie des éléments distincts de la liste', () => {
    const rng = Rng.fromSeed('echantillon');
    const sampled = rng.sample([1, 2, 3, 4, 5, 6], 4);
    expect(sampled).toHaveLength(4);
    expect(new Set(sampled).size).toBe(4);
    expect(rng.sample([1, 2], 10)).toHaveLength(2);
    expect(rng.sample([1, 2], -3)).toEqual([]);
  });

  it('pick refuse une liste vide', () => {
    expect(() => Rng.fromSeed(1).pick([])).toThrow(RangeError);
  });
});

describe('flux indépendants', () => {
  const NAMES = ['marche', 'reperage', 'production'] as const;

  it('dérive les mêmes flux de la même graine, et des flux différents entre eux', () => {
    const a = createStreams('maitre', NAMES);
    const b = createStreams('maitre', NAMES);
    expect(a).toEqual(b);
    expect(a.marche).not.toEqual(a.reperage);
    expect(createStreams('autre', NAMES).marche).not.toEqual(a.marche);
  });

  it('consommer un flux ne change aucun autre flux', () => {
    const streams = createStreams('maitre', NAMES);
    const [, after] = withStream(streams, 'marche', (rng) => {
      for (let i = 0; i < 1000; i += 1) rng.nextU32();
    });
    expect(after.reperage).toEqual(streams.reperage);
    expect(after.production).toEqual(streams.production);
    expect(after.marche).not.toEqual(streams.marche);
  });

  it("ne modifie pas les flux d'origine", () => {
    const streams = createStreams('maitre', NAMES);
    const copy = JSON.parse(JSON.stringify(streams)) as typeof streams;
    withStream(streams, 'production', (rng) => rng.float());
    expect(streams).toEqual(copy);
  });

  it("un tirage ajouté dans un système n'altère pas la suite des autres systèmes", () => {
    const run = (extraDrawsInMarket: number) => {
      let streams = createStreams('maitre', NAMES);
      [, streams] = withStream(streams, 'marche', (rng) => {
        for (let i = 0; i < extraDrawsInMarket; i += 1) rng.float();
      });
      const [value] = withStream(streams, 'reperage', (rng) => rng.int(0, 1_000_000));
      return value;
    };
    expect(run(0)).toBe(run(37));
  });
});
