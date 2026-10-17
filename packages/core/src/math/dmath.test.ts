import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cos, exp, ln, log10, log2, pow, powInt, sin } from './dmath';

const dv = new DataView(new ArrayBuffer(8));
const bits = (x: number): string => {
  dv.setFloat64(0, x, false);
  return (
    dv.getUint32(0, false).toString(16).padStart(8, '0') +
    dv.getUint32(4, false).toString(16).padStart(8, '0')
  );
};
const relativeError = (a: number, b: number): number =>
  a === b ? 0 : Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);

describe('précision face aux fonctions natives', () => {
  it('exp est précis sur toute la plage utile', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 50, noNaN: true }),
        (x) => relativeError(exp(x), Math.exp(x)) < 1e-14,
      ),
    );
  });

  it('ln est précis de 1e-10 à 1e10', () => {
    fc.assert(
      fc.property(fc.double({ min: 1e-10, max: 1e10, noNaN: true }), (x) => {
        // erreur absolue : ln s'annule en 1, l'erreur relative n'y a pas de sens
        return Math.abs(ln(x) - Math.log(x)) < 1e-14 * Math.max(1, Math.abs(Math.log(x)));
      }),
    );
  });

  it('sin et cos sont précis', () => {
    fc.assert(
      fc.property(fc.double({ min: -1000, max: 1000, noNaN: true }), (x) => {
        return Math.abs(sin(x) - Math.sin(x)) < 1e-12 && Math.abs(cos(x) - Math.cos(x)) < 1e-12;
      }),
    );
  });

  it('pow est précis pour les exposants réels positifs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.double({ min: -5, max: 5, noNaN: true }),
        (x, y) => relativeError(pow(x, y), Math.pow(x, y)) < 1e-12,
      ),
    );
  });

  it('respecte les identités de base', () => {
    expect(exp(0)).toBe(1);
    expect(ln(1)).toBe(0);
    expect(sin(0)).toBe(0);
    expect(cos(0)).toBe(1);
    expect(log10(1000)).toBeCloseTo(3, 12);
    expect(log2(1024)).toBeCloseTo(10, 12);
    expect(pow(2, 10)).toBe(1024);
    expect(pow(7, 0)).toBe(1);
    expect(pow(1, 123.4)).toBe(1);
  });

  it('exp et ln sont réciproques', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true }),
        (x) => Math.abs(ln(exp(x)) - x) < 1e-12,
      ),
    );
  });

  it('sin² + cos² = 1', () => {
    fc.assert(
      fc.property(fc.double({ min: -500, max: 500, noNaN: true }), (x) => {
        return Math.abs(sin(x) ** 2 + cos(x) ** 2 - 1) < 1e-14;
      }),
    );
  });
});

describe('cas limites', () => {
  it('gère les débordements et les valeurs spéciales comme Math', () => {
    expect(exp(1000)).toBe(Infinity);
    expect(exp(-1000)).toBe(0);
    expect(exp(Number.NaN)).toBeNaN();
    expect(ln(0)).toBe(-Infinity);
    expect(ln(-1)).toBeNaN();
    expect(ln(Infinity)).toBe(Infinity);
    expect(ln(5e-324)).toBeCloseTo(Math.log(5e-324), 9); // dénormalisé
    expect(pow(0, 2)).toBe(0);
    expect(pow(0, -1)).toBe(Infinity);
    expect(pow(-2, 3)).toBe(-8);
    expect(pow(-2, 0.5)).toBeNaN();
  });

  it('refuse les angles hors plage plutôt que de renvoyer une valeur fausse', () => {
    expect(() => sin(1e9)).toThrow(RangeError);
    expect(() => cos(Number.NaN)).toThrow(RangeError);
  });

  it('powInt est exact sur les entiers et refuse un exposant non entier', () => {
    expect(powInt(2, 52)).toBe(4503599627370496);
    expect(powInt(3, 5)).toBe(243);
    expect(powInt(2, -3)).toBe(0.125);
    expect(() => powInt(2, 0.5)).toThrow(RangeError);
  });
});

describe('reproductibilité exacte (valeurs figées au bit près)', () => {
  // Ces motifs de bits sont ceux de CETTE implémentation. Comme elle n'utilise que des opérations
  // exactement arrondies par la norme IEEE 754, tout moteur JavaScript doit les reproduire.
  // Si ce test échoue après une modification de dmath.ts, la reproductibilité des parties
  // sauvegardées et des replays est cassée : c'est un changement de version de la simulation.
  const golden: Array<[string, () => number, string]> = [
    ['exp(1)', () => exp(1), '4005bf0a8b145768'],
    ['exp(-1)', () => exp(-1), '3fd78b56362cef39'],
    ['exp(2.5)', () => exp(2.5), '40285d6fd931e0bd'],
    ['exp(-10)', () => exp(-10), '3f07cd79b5647c9b'],
    ['exp(100)', () => exp(100), '48f3494a9b171bf3'],
    ['ln(2)', () => ln(2), '3fe62e42fefa39ef'],
    ['ln(10)', () => ln(10), '40026bb1bbb55516'],
    ['ln(12345.678)', () => ln(12345.678), '4022d79559791e31'],
    ['ln(0.9999)', () => ln(0.9999), 'bf1a3738d2cf1cc2'],
    ['sin(1)', () => sin(1), '3feaed548f090cee'],
    ['cos(1)', () => cos(1), '3fe14a280fb5068b'],
    ['sin(-2)', () => sin(-2), 'bfed18f6ead1b446'],
    ['cos(100.5)', () => cos(100.5), '3feffc12adaecec2'],
    ['pow(2, 0.5)', () => pow(2, 0.5), '3ff6a09e667f3bcc'],
    ['pow(10, 1.5)', () => pow(10, 1.5), '403f9f6e4990f22a'],
    ['pow(1.05, 52.5)', () => pow(1.05, 52.5), '4029e8f8d323689a'],
  ];

  for (const [label, compute, expected] of golden) {
    it(`${label}`, () => {
      expect(bits(compute())).toBe(expected);
    });
  }
});
