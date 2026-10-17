import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  type Cents,
  MAX_CENTS,
  abs,
  add,
  applyBps,
  applyRate,
  cents,
  clamp,
  euros,
  formatEuros,
  formatEurosCompact,
  fromFloat,
  mulDivRound,
  mulInt,
  roundHalfEven,
  split,
  splitEvenly,
  sub,
  sum,
} from './index';

const money = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }).map((n) => cents(n));

describe('cents', () => {
  it('accepte les entiers sûrs et normalise -0', () => {
    expect(cents(1234)).toBe(1234);
    expect(Object.is(cents(-0), 0)).toBe(true);
  });

  it('refuse flottants, NaN, infinis et entiers hors plage', () => {
    for (const bad of [1.5, Number.NaN, Infinity, -Infinity, 2 ** 53]) {
      expect(() => cents(bad)).toThrow(RangeError);
    }
  });

  it('euros convertit sans erreur de flottant', () => {
    expect(euros(12.34)).toBe(1234);
    expect(euros(0.29)).toBe(29); // 0,29 × 100 = 28,999999999999996 en flottant
    expect(euros(1_000)).toBe(100_000);
    expect(euros(-5.05)).toBe(-505);
  });

  it('les opérations sur entiers restent des entiers', () => {
    fc.assert(
      fc.property(money, money, (a, b) => {
        return [add(a, b), sub(a, b), abs(a), sum([a, b])].every((v) => Number.isSafeInteger(v));
      }),
    );
  });

  it('détecte un débordement plutôt que de perdre de la précision', () => {
    expect(() => add(cents(MAX_CENTS), cents(1))).toThrow(RangeError);
  });

  it('clamp borne dans les deux sens', () => {
    expect(clamp(cents(50), cents(0), cents(10))).toBe(10);
    expect(clamp(cents(-5), cents(0), cents(10))).toBe(0);
    expect(clamp(cents(5), cents(0), cents(10))).toBe(5);
  });
});

describe('arrondi demi-pair', () => {
  it('envoie les égalités vers le pair', () => {
    expect([0.5, 1.5, 2.5, 3.5, -0.5, -1.5, -2.5].map(roundHalfEven)).toEqual([
      0, 2, 2, 4, 0, -2, -2,
    ]);
  });

  it('arrondit normalement hors égalité', () => {
    expect([0.4, 0.6, 2.49, 2.51, -2.49, -2.51].map(roundHalfEven)).toEqual([0, 1, 2, 3, -2, -3]);
  });

  it('ne produit jamais -0', () => {
    expect(Object.is(roundHalfEven(-0.4), 0)).toBe(true);
  });

  it('refuse les valeurs non finies', () => {
    expect(() => roundHalfEven(Number.NaN)).toThrow(RangeError);
    expect(() => fromFloat(Infinity)).toThrow(RangeError);
  });

  it("n'introduit pas de biais sur des égalités successives", () => {
    // 1000 demi-centimes consécutifs : la moitié monte, la moitié descend
    let total = 0;
    for (let i = 0; i < 1000; i += 1) total += roundHalfEven(i + 0.5) - i;
    expect(total).toBe(500);
  });
});

describe('mulDivRound et taux', () => {
  it('calcule exactement les cas simples', () => {
    expect(mulDivRound(10, 1, 4)).toBe(2); // 2,5 → 2 (pair)
    expect(mulDivRound(14, 1, 4)).toBe(4); // 3,5 → 4 (pair)
    expect(mulDivRound(-10, 1, 4)).toBe(-2);
    expect(mulDivRound(7, 1, -2)).toBe(-4); // −3,5 → −4
    expect(mulDivRound(0, 5, 3)).toBe(0);
  });

  it('refuse la division par zéro et les non-entiers', () => {
    expect(() => mulDivRound(1, 1, 0)).toThrow(RangeError);
    expect(() => mulDivRound(1.5, 1, 2)).toThrow(RangeError);
  });

  it('reste exact sur de très grands montants (repli BigInt)', () => {
    const big = cents(9_000_000_000_000_000);
    expect(applyBps(big, 5_000)).toBe(4_500_000_000_000_000); // 50 %
    expect(applyBps(big, 10_000)).toBe(big);
    expect(() => mulDivRound(MAX_CENTS, 3, 1)).toThrow(RangeError);
  });

  it('applyBps correspond à un pourcentage exact', () => {
    expect(applyBps(cents(100_000), 2_550)).toBe(25_500); // 25,5 % de 1 000 €
    expect(applyBps(cents(999), 3_333)).toBe(333);
    expect(applyBps(cents(-1_000), 1_000)).toBe(-100);
  });

  it('applyBps ne dépasse jamais le montant pour un taux ≤ 100 %', () => {
    fc.assert(
      fc.property(money, fc.integer({ min: 0, max: 10_000 }), (a, bps) => {
        return Math.abs(applyBps(a, bps)) <= Math.abs(a);
      }),
    );
  });

  it('mulInt et applyRate arrondissent une seule fois', () => {
    expect(mulInt(cents(1_999), 52)).toBe(103_948);
    expect(applyRate(cents(1_000), 0.155)).toBe(155);
    expect(applyRate(cents(1), 0.5)).toBe(0); // 0,5 → 0 (pair)
    expect(applyRate(cents(3), 0.5)).toBe(2); // 1,5 → 2 (pair)
  });
});

describe('répartition (plus fort reste)', () => {
  it('répartit un cas connu', () => {
    expect(split(cents(100), [1, 1, 1])).toEqual([34, 33, 33]);
    expect(split(cents(10), [1, 2, 3])).toEqual([2, 3, 5]);
    expect(splitEvenly(cents(5), 2)).toEqual([3, 2]);
  });

  it('donne zéro aux poids nuls', () => {
    expect(split(cents(100), [0, 1, 0, 3])).toEqual([0, 25, 0, 75]);
  });

  it('la somme des parts est toujours exactement le total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 }),
        fc.array(fc.integer({ min: 0, max: 10_000 }), { minLength: 1, maxLength: 12 }),
        (total, weights) => {
          fc.pre(weights.some((w) => w > 0));
          const parts = split(cents(total), weights);
          return parts.reduce((a, b) => a + b, 0) === total && parts.length === weights.length;
        },
      ),
    );
  });

  it("chaque part est à moins d'un centime de sa part exacte", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.array(fc.integer({ min: 1, max: 1_000 }), { minLength: 1, maxLength: 8 }),
        (total, weights) => {
          const sumW = weights.reduce((a, b) => a + b, 0);
          const parts = split(cents(total), weights);
          return parts.every((p, i) => Math.abs(p - (total * (weights[i] ?? 0)) / sumW) < 1);
        },
      ),
    );
  });

  it('est symétrique pour les montants négatifs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 6 }),
        (total, weights) => {
          const pos = split(cents(total), weights);
          const negative = split(cents(-total), weights);
          return pos.every((p, i) => -p === negative[i] || (p === 0 && negative[i] === 0));
        },
      ),
    );
  });

  it('est déterministe (mêmes entrées, mêmes parts)', () => {
    expect(split(cents(1_000_003), [3, 3, 3, 1])).toEqual(split(cents(1_000_003), [3, 3, 3, 1]));
  });

  it('refuse les entrées invalides', () => {
    expect(() => split(cents(10), [])).toThrow(RangeError);
    expect(() => split(cents(10), [0, 0])).toThrow(RangeError);
    expect(() => split(cents(10), [-1, 2])).toThrow(RangeError);
    expect(() => split(cents(10), [1.5])).toThrow(RangeError);
    expect(() => splitEvenly(cents(10), 0)).toThrow(RangeError);
  });

  it('gère des montants énormes sans perte', () => {
    const big = cents(9_007_199_254_740_990);
    const parts = split(big, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(big);
  });
});

describe('affichage', () => {
  const nnbsp = ' ';
  const nbsp = ' ';

  it('formate en euros français', () => {
    expect(formatEuros(cents(1_234_567))).toBe(`12${nnbsp}345,67${nbsp}€`);
    expect(formatEuros(cents(5))).toBe(`0,05${nbsp}€`);
    expect(formatEuros(cents(0))).toBe(`0,00${nbsp}€`);
    expect(formatEuros(cents(-250_000))).toBe(`−2${nnbsp}500,00${nbsp}€`);
  });

  it('affiche le signe + à la demande, et peut masquer les centimes', () => {
    expect(formatEuros(cents(150), { signed: true })).toBe(`+1,50${nbsp}€`);
    expect(formatEuros(cents(0), { signed: true })).toBe(`0,00${nbsp}€`);
    expect(formatEuros(cents(123_456), { decimals: false })).toBe(`1${nnbsp}235${nbsp}€`);
  });

  it('formate en compact', () => {
    expect(formatEurosCompact(cents(99_900))).toBe(`999${nbsp}€`);
    expect(formatEurosCompact(cents(150_000))).toBe(`1,5${nbsp}k€`);
    expect(formatEurosCompact(cents(200_000_000))).toBe(`2${nbsp}M€`);
    expect(formatEurosCompact(cents(-5_000_000_000))).toBe(`−50${nbsp}M€`);
    expect(formatEurosCompact(cents(300_000_000_000))).toBe(`3${nbsp}Md€`);
  });

  it('le type Cents ne se fabrique que par cents()', () => {
    const amount: Cents = cents(10);
    expect(amount).toBe(10);
  });
});
