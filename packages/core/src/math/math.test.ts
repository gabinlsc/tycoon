import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  annuityPayment,
  approxEqual,
  atLeastOne,
  clamp,
  clamp01,
  clamp100,
  cumulative,
  decayingStreamValue,
  discountFactor,
  ema,
  expDecay,
  gaussianCurve,
  geometricSum,
  inverseLerp,
  lerp,
  logistic,
  mean,
  meanReversion,
  median,
  mod,
  normalizeWeights,
  ornsteinUhlenbeckStep,
  percentile,
  piecewiseLinear,
  presentValue,
  remap,
  sampleCdf,
  smoothstep,
  softmax,
  stdDev,
  total,
  variance,
  weightedMean,
} from './index';

describe('basic', () => {
  it('clamp borne et reste idempotent', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.double({ min: -100, max: 0, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        (x, lo, hi) => {
          const c = clamp(x, lo, hi);
          return c >= lo && c <= hi && clamp(c, lo, hi) === c;
        },
      ),
    );
    expect(clamp01(1.5)).toBe(1);
    expect(clamp100(-4)).toBe(0);
  });

  it('lerp, inverseLerp et remap', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(inverseLerp(10, 20, 15)).toBe(0.5);
    expect(inverseLerp(10, 20, 99)).toBe(1);
    expect(inverseLerp(5, 5, 7)).toBe(0);
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(-5, 0, 10, 0, 100)).toBe(0);
  });

  it('smoothstep est monotone de 0 à 1', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    let previous = 0;
    for (let i = 0; i <= 100; i += 1) {
      const v = smoothstep(0, 1, i / 100);
      expect(v).toBeGreaterThanOrEqual(previous);
      previous = v;
    }
  });

  it('mod est toujours positif et approxEqual tolère un epsilon', () => {
    expect(mod(-1, 52)).toBe(51);
    expect(mod(53, 52)).toBe(1);
    expect(approxEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(approxEqual(1, 1.1)).toBe(false);
  });
});

describe('curves', () => {
  it('logistic est centrée et bornée', () => {
    expect(logistic(0)).toBe(0.5);
    expect(logistic(50)).toBeGreaterThan(0.999);
    expect(logistic(-50)).toBeLessThan(0.001);
    expect(logistic(5, 5, 2)).toBe(0.5);
  });

  it('expDecay décroît de 1 vers 0', () => {
    expect(expDecay(0, 0.35)).toBe(1);
    expect(expDecay(10, 0.35)).toBeLessThan(expDecay(5, 0.35));
    expect(expDecay(1, 1)).toBeCloseTo(Math.exp(-1), 12);
  });

  it('gaussianCurve culmine à 1 sur sa moyenne', () => {
    expect(gaussianCurve(7, 7, 3)).toBe(1);
    expect(gaussianCurve(10, 7, 3)).toBeCloseTo(Math.exp(-0.5), 12);
    expect(gaussianCurve(7, 7, 3, true)).toBeCloseTo(1 / (3 * Math.sqrt(2 * Math.PI)), 12);
  });

  it('piecewiseLinear interpole et borne', () => {
    const f = piecewiseLinear([
      [0, 0],
      [10, 100],
      [20, 100],
      [30, 0],
    ]);
    expect(f(-5)).toBe(0);
    expect(f(5)).toBe(50);
    expect(f(15)).toBe(100);
    expect(f(25)).toBe(50);
    expect(f(99)).toBe(0);
    expect(() => piecewiseLinear([])).toThrow(RangeError);
    expect(() =>
      piecewiseLinear([
        [1, 0],
        [1, 1],
      ]),
    ).toThrow(RangeError);
  });

  it('retour à la moyenne converge vers la cible', () => {
    let v = 100;
    for (let i = 0; i < 200; i += 1) v = meanReversion(v, 60, 0.1);
    expect(v).toBeCloseTo(60, 6);
    expect(ornsteinUhlenbeckStep(100, 60, 0.5, 2, 1.5)).toBe(80 + 3);
    expect(ema(10, 20, 0.5)).toBe(15);
  });
});

describe('stats', () => {
  it('mean, variance, stdDev, median, percentile', () => {
    expect(total([1, 2, 3, 4])).toBe(10);
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(percentile([10, 20, 30, 40, 50], 25)).toBe(20);
    expect(percentile([10, 20, 30], 100)).toBe(30);
    expect(percentile([10, 20, 30], 150)).toBe(30);
  });

  it('percentile ne modifie pas la liste', () => {
    const values = [3, 1, 2];
    percentile(values, 50);
    expect(values).toEqual([3, 1, 2]);
  });

  it('weightedMean pondère et refuse les poids invalides', () => {
    expect(
      weightedMean([
        [10, 1],
        [20, 3],
      ]),
    ).toBe(17.5);
    expect(() => weightedMean([[1, -1]])).toThrow(RangeError);
    expect(() => weightedMean([[1, 0]])).toThrow(RangeError);
    expect(() => mean([])).toThrow(RangeError);
  });
});

describe('finance', () => {
  it('actualise un flux', () => {
    expect(discountFactor(0, 10)).toBe(1);
    expect(presentValue(1000, 0.1, 1)).toBeCloseTo(909.0909090909091, 9);
    expect(presentValue(1000, 0.05, 52)).toBeLessThan(presentValue(1000, 0.05, 10));
  });

  it('geometricSum correspond à la somme terme à terme', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 1.5, noNaN: true }),
        fc.integer({ min: 0, max: 60 }),
        (ratio, n) => {
          let expected = 0;
          let term = 100;
          for (let i = 0; i < n; i += 1) {
            expected += term;
            term *= ratio;
          }
          return (
            Math.abs(geometricSum(100, ratio, n) - expected) <=
            1e-9 * Math.max(1, Math.abs(expected))
          );
        },
      ),
    );
    expect(geometricSum(5, 1, 4)).toBe(20);
    expect(geometricSum(5, 0.5, 0)).toBe(0);
  });

  it("une traîne qui décroît vaut moins qu'un revenu constant", () => {
    const constant = decayingStreamValue(100, 0, 0, 26);
    expect(constant).toBe(2600);
    expect(decayingStreamValue(100, 0.05, 0.001, 26)).toBeLessThan(constant);
  });

  it('annuityPayment rembourse exactement le capital', () => {
    const payment = annuityPayment(10_000, 0.01, 12);
    expect(payment * 12).toBeGreaterThan(10_000);
    expect(annuityPayment(1200, 0, 12)).toBe(100);
    expect(() => annuityPayment(1, 0.1, 0)).toThrow(RangeError);
    // le solde après 12 versements est nul
    let balance = 10_000;
    for (let i = 0; i < 12; i += 1) balance = balance * 1.01 - payment;
    expect(Math.abs(balance)).toBeLessThan(1e-6);
  });
});

describe('probabilités', () => {
  it('atLeastOne combine des événements indépendants', () => {
    expect(atLeastOne([])).toBe(0);
    expect(atLeastOne([0.5, 0.5])).toBe(0.75);
    expect(atLeastOne([1, 0.2])).toBe(1);
    expect(atLeastOne([-1, 2])).toBe(1);
  });

  it('normalizeWeights somme à 1', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 10 }),
        (weights) => {
          fc.pre(weights.some((w) => w > 0));
          return Math.abs(normalizeWeights(weights).reduce((a, b) => a + b, 0) - 1) < 1e-12;
        },
      ),
    );
    expect(() => normalizeWeights([0, 0])).toThrow(RangeError);
    expect(() => normalizeWeights([-1, 2])).toThrow(RangeError);
  });

  it('cumulative finit exactement à 1 et sampleCdf choisit le bon indice', () => {
    const cdf = cumulative([0.2, 0.3, 0.5]);
    expect(cdf[2]).toBe(1);
    expect(sampleCdf(cdf, 0)).toBe(0);
    expect(sampleCdf(cdf, 0.19)).toBe(0);
    expect(sampleCdf(cdf, 0.2)).toBe(1);
    expect(sampleCdf(cdf, 0.49)).toBe(1);
    expect(sampleCdf(cdf, 0.5)).toBe(2);
    expect(sampleCdf(cdf, 0.999999)).toBe(2);
  });

  it("softmax donne des probabilités qui somment à 1 et respectent l'ordre", () => {
    const p = softmax([1, 2, 3]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect((p[2] as number) > (p[1] as number) && (p[1] as number) > (p[0] as number)).toBe(true);
    // robuste aux grands scores (pas de débordement)
    expect(softmax([1000, 1001]).every((x) => Number.isFinite(x))).toBe(true);
    // température haute : plus uniforme
    expect((softmax([1, 2, 3], 100)[0] as number) > (p[0] as number)).toBe(true);
    expect(() => softmax([])).toThrow(RangeError);
    expect(() => softmax([1], 0)).toThrow(RangeError);
  });
});
