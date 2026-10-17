import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { dominantTerms, explain, shares } from './index';

describe('explain', () => {
  it('construit une somme pondérée et garde chaque contribution', () => {
    const result = explain()
      .term('plume', 70, 0.35)
      .term('producteur', 80, 0.2)
      .term('studio', 50, 0.1)
      .done();
    expect(result.value).toBeCloseTo(24.5 + 16 + 5, 10);
    expect(result.terms.map((t) => [t.key, t.kind, t.weight])).toEqual([
      ['plume', 'terme', 0.35],
      ['producteur', 'terme', 0.2],
      ['studio', 'terme', 0.1],
    ]);
    expect(result.terms[0]?.contribution).toBeCloseTo(24.5, 10);
  });

  it('un facteur multiplie tout ce qui précède, sa contribution est la variation', () => {
    const result = explain().term('base', 100).scale('moral', 1.1).done();
    expect(result.value).toBeCloseTo(110, 10);
    expect(result.terms[1]).toMatchObject({ key: 'moral', kind: 'facteur', input: 1.1 });
    expect(result.terms[1]?.contribution).toBeCloseTo(10, 10);
  });

  it('un facteur inférieur à 1 donne une contribution négative', () => {
    const result = explain().term('base', 100).scale('fatigue', 0.8).done();
    expect(result.terms[1]?.contribution).toBeCloseTo(-20, 10);
  });

  it("un ajout fixe et un bornage s'enregistrent comme des termes", () => {
    const result = explain().term('base', 98).offset('bruit', 7).limit('plafond', 0, 100).done();
    expect(result.value).toBe(100);
    expect(result.terms.map((t) => t.kind)).toEqual(['terme', 'ajout', 'borne']);
    expect(result.terms[2]?.contribution).toBe(-5);
  });

  it('un bornage sans effet a une contribution nulle', () => {
    const result = explain().term('base', 40).limit('plafond', 0, 100).done();
    expect(result.terms[1]?.contribution).toBe(0);
    expect(result.value).toBe(40);
  });

  it('borne aussi par le bas', () => {
    expect(explain().term('base', -30).limit('plancher', 0, 100).done().value).toBe(0);
  });

  it('la somme des contributions est toujours la valeur finale (propriété)', () => {
    const step = fc.oneof(
      fc.record({
        op: fc.constant('terme' as const),
        v: fc.double({ min: -100, max: 100, noNaN: true }),
        w: fc.double({ min: 0, max: 2, noNaN: true }),
      }),
      fc.record({
        op: fc.constant('facteur' as const),
        v: fc.double({ min: 0, max: 2, noNaN: true }),
      }),
      fc.record({
        op: fc.constant('ajout' as const),
        v: fc.double({ min: -50, max: 50, noNaN: true }),
      }),
      fc.record({
        op: fc.constant('borne' as const),
        v: fc.double({ min: 0, max: 100, noNaN: true }),
      }),
    );
    fc.assert(
      fc.property(fc.array(step, { minLength: 1, maxLength: 12 }), (steps) => {
        const e = explain();
        steps.forEach((s, i) => {
          if (s.op === 'terme') e.term(`t${i}`, s.v, (s as { w: number }).w);
          else if (s.op === 'facteur') e.scale(`t${i}`, s.v);
          else if (s.op === 'ajout') e.offset(`t${i}`, s.v);
          else e.limit(`t${i}`, 0, s.v);
        });
        const result = e.done();
        const sum = result.terms.reduce((a, t) => a + t.contribution, 0);
        return Math.abs(sum - result.value) <= 1e-9 * Math.max(1, Math.abs(result.value));
      }),
    );
  });

  it('expose la valeur courante en cours de construction', () => {
    const e = explain().term('a', 10);
    expect(e.value).toBe(10);
    e.scale('b', 3);
    expect(e.value).toBe(30);
  });

  it('classe les termes par effet et ignore ceux sans effet', () => {
    const result = explain()
      .term('petit', 2)
      .term('gros', 50)
      .term('negatif', -20)
      .limit('plafond', 0, 1000)
      .done();
    expect(dominantTerms(result).map((t) => t.key)).toEqual(['gros', 'negatif', 'petit']);
    expect(dominantTerms(result, 2).map((t) => t.key)).toEqual(['gros', 'negatif']);
  });

  it('calcule la part de chaque terme', () => {
    const result = explain().term('a', 30).term('b', 10).done();
    expect(shares(result)).toEqual([
      { key: 'a', share: 0.75 },
      { key: 'b', share: 0.25 },
    ]);
    expect(shares(explain().term('a', 5).term('b', -5).done()).every((s) => s.share === 0)).toBe(
      true,
    );
  });

  it('est une donnée simple, sérialisable et indépendante du constructeur', () => {
    const e = explain().term('a', 1);
    const first = e.done();
    e.term('b', 2);
    expect(first.terms).toHaveLength(1);
    expect(() => hashState(first)).not.toThrow();
  });
});
