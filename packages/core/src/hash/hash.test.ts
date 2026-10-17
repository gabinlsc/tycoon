import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canonicalClone, findNonSerializable, hashState, hashText, stableStringify } from './index';

describe('stableStringify', () => {
  it("ne dépend pas de l'ordre des clés, à tous les niveaux", () => {
    const a = { z: 1, a: { y: [1, { b: 2, a: 1 }], x: 'é' }, m: null };
    const b = { m: null, a: { x: 'é', y: [1, { a: 1, b: 2 }] }, z: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(stableStringify(a)).toBe('{"a":{"x":"é","y":[1,{"a":1,"b":2}]},"m":null,"z":1}');
  });

  it("garde l'ordre des tableaux", () => {
    expect(stableStringify([2, 1])).not.toBe(stableStringify([1, 2]));
  });

  it('normalise -0 et formate les nombres de façon stable', () => {
    expect(stableStringify(-0)).toBe('0');
    expect(stableStringify({ x: -0 })).toBe('{"x":0}');
    expect(stableStringify([0.1, 1e21, 1e-7, 123456789])).toBe('[0.1,1e+21,1e-7,123456789]');
  });

  it('échappe correctement les chaînes (guillemets, sauts de ligne, Unicode)', () => {
    expect(stableStringify('a"b\n 😀')).toBe(JSON.stringify('a"b\n 😀'));
  });

  it('accepte les objets sans prototype', () => {
    const bare = Object.create(null) as Record<string, number>;
    bare['k'] = 1;
    expect(stableStringify(bare)).toBe('{"k":1}');
  });

  it('refuse les valeurs sans représentation stable, en donnant le chemin', () => {
    expect(() => stableStringify({ a: { b: [1, Number.NaN] } })).toThrow('.a.b[1]');
    expect(() => stableStringify({ a: Infinity })).toThrow('.a');
    expect(() => stableStringify({ a: undefined })).toThrow('type interdit (undefined)');
    expect(() => stableStringify(() => 1)).toThrow('(racine)');
    expect(() => stableStringify({ d: new Date(0) })).toThrow('Date');
    expect(() => stableStringify({ m: new Map() })).toThrow('Map');
    expect(() => stableStringify({ s: new Set() })).toThrow('Set');
    expect(() => stableStringify({ n: 10n })).toThrow('bigint');
    expect(() => stableStringify({ s: Symbol('x') })).toThrow('symbol');
    class Boite {
      x = 1;
    }
    expect(() => stableStringify(new Boite())).toThrow('Boite');
  });

  it('détecte les références circulaires', () => {
    const loop: Record<string, unknown> = {};
    loop['self'] = loop;
    expect(() => stableStringify(loop)).toThrow('circulaire');
  });

  it('tolère un objet partagé à deux endroits (pas un cycle)', () => {
    const shared = { v: 1 };
    expect(stableStringify({ a: shared, b: shared })).toBe('{"a":{"v":1},"b":{"v":1}}');
  });

  it('findNonSerializable renvoie null pour une valeur propre', () => {
    expect(findNonSerializable({ a: [1, 'x', true, null] })).toBeNull();
  });

  it('canonicalClone produit une copie profonde indépendante', () => {
    const original = { b: [1, { c: 2 }], a: 1 };
    const copy = canonicalClone(original);
    expect(copy).toEqual(original);
    expect(copy.b).not.toBe(original.b);
    expect(Object.keys(copy)).toEqual(['a', 'b']);
  });
});

const jsonValue = fc.letrec((tie) => ({
  value: fc.oneof(
    { depthSize: 'small', maxDepth: 3 },
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }),
    fc.string(),
    fc.boolean(),
    fc.constant(null),
    fc.array(tie('value'), { maxLength: 4 }),
    fc.dictionary(fc.string({ maxLength: 4 }), tie('value'), { maxKeys: 4 }),
  ),
})).value;

describe('hashState', () => {
  it('est identique pour des clés permutées', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ maxLength: 5 }), jsonValue, { maxKeys: 6 }),
        (object) => {
          const reversed = Object.fromEntries(Object.entries(object).reverse());
          return hashState(object) === hashState(reversed);
        },
      ),
    );
  });

  it('donne 16 caractères hexadécimaux', () => {
    fc.assert(fc.property(jsonValue, (value) => /^[0-9a-f]{16}$/.test(hashState(value))));
  });

  it('distingue des valeurs différentes (aucune collision sur 5000 valeurs distinctes)', () => {
    const seen = new Map<string, string>();
    let collisions = 0;
    for (let i = 0; i < 5000; i += 1) {
      const value = { semaine: i, tresorerie: i * 37, artistes: [i % 7, i % 11] };
      const key = stableStringify(value);
      const hash = hashState(value);
      const previous = seen.get(hash);
      if (previous !== undefined && previous !== key) collisions += 1;
      seen.set(hash, key);
    }
    expect(collisions).toBe(0);
  });

  it('change beaucoup quand un seul caractère change (avalanche)', () => {
    const popcount = (hex: string) =>
      [...hex].reduce((sum, c) => sum + parseInt(c, 16).toString(2).replace(/0/g, '').length, 0);
    let totalFlipped = 0;
    const trials = 200;
    for (let i = 0; i < trials; i += 1) {
      const a = hashText(`etat-${i}-a`);
      const b = hashText(`etat-${i}-b`);
      const xor = [...a]
        .map((c, k) => (parseInt(c, 16) ^ parseInt(b[k] ?? '0', 16)).toString(16))
        .join('');
      totalFlipped += popcount(xor);
    }
    const averageFraction = totalFlipped / trials / 64;
    expect(averageFraction).toBeGreaterThan(0.4);
    expect(averageFraction).toBeLessThan(0.6);
  });

  it('refuse un état non sérialisable', () => {
    expect(() => hashState({ a: Number.NaN })).toThrow(TypeError);
  });

  it('est figé au bit près (changer la valeur casse tous les replays et sauvegardes)', () => {
    expect(hashText('')).toBe('488bdcb81aee8d83');
    expect(hashText('abc')).toBe('7a91f9f91ac18c8d');
    expect(hashState({ a: 1, b: [1, 2, { c: 'é' }] })).toBe('6a85be0b5ab3e775');
    expect(hashState([])).toBe('d095202279b28c9e');
    expect(hashState(null)).toBe('9b55e0da69fcb93a');
    expect(hashState('x')).toBe('cfb58eb58d561258');
  });
});
