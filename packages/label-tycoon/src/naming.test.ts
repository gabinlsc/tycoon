import { Rng } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ALL_EXCLUSIONS, REAL_ARTISTS, REAL_CITIES, REAL_LABELS } from './content/exclusions';
import { TOUS_LES_NOMS_DETOURNES } from './content/parodies';
import { FAMILY_NAMES, GIVEN_NAMES, ORIGINS } from './content/names-data';
import {
  generateCityName,
  generateLabelName,
  generateRealName,
  generateStageName,
  isExcluded,
  normalizeForCompare,
  pickOrigin,
  pickStyle,
  uniqueName,
} from './naming';
import type { StageStyle } from './naming';

const STYLES: readonly StageStyle[] = ['urbain', 'pop', 'afro', 'latino'];
const many = <T>(count: number, make: (rng: Rng) => T, seed = 'noms'): T[] => {
  const rng = Rng.fromSeed(seed);
  return Array.from({ length: count }, () => make(rng));
};

describe("liste d'exclusion", () => {
  it('ignore casse, accents, espaces et ponctuation', () => {
    expect(normalizeForCompare('  Beyoncé ')).toBe('beyonce');
    expect(normalizeForCompare('Jay-Z')).toBe('jayz');
    expect(isExcluded('BEYONCE')).toBe(true);
    expect(isExcluded('jay z')).toBe(true);
    expect(isExcluded('Dr. Dre')).toBe(true);
    expect(isExcluded('Port-Vendres')).toBe(true);
    expect(isExcluded('Universal Music')).toBe(true);
    expect(isExcluded('Zaro')).toBe(false);
  });

  it("n'est pas vide et couvre artistes, labels et villes", () => {
    expect(REAL_ARTISTS.length).toBeGreaterThan(50);
    expect(REAL_LABELS.length).toBeGreaterThan(20);
    expect(REAL_CITIES.length).toBeGreaterThan(30);
    expect(new Set(ALL_EXCLUSIONS).size).toBe(ALL_EXCLUSIONS.length);
  });
});

describe("noms d'état civil", () => {
  it('assemblent un prénom et un nom de la même origine', () => {
    for (const origin of ORIGINS) {
      for (const name of many(60, (rng) => generateRealName(rng, origin), `civil-${origin}`)) {
        expect(GIVEN_NAMES[origin]).toContain(name.prenom);
        expect(FAMILY_NAMES[origin]).toContain(name.nom);
        expect(name.origin).toBe(origin);
      }
    }
  });

  it('respectent les poids des origines (statistique)', () => {
    const counts = new Map<string, number>();
    for (const o of many(20000, pickOrigin, 'origines')) counts.set(o, (counts.get(o) ?? 0) + 1);
    // france 30 / 100 attendu ≈ 0,30
    expect((counts.get('france') ?? 0) / 20000).toBeGreaterThan(0.27);
    expect((counts.get('france') ?? 0) / 20000).toBeLessThan(0.33);
    expect((counts.get('antilles') ?? 0) / 20000).toBeLessThan(0.11);
  });

  it("proposent un style cohérent avec l'origine", () => {
    const afrique = many(5000, (rng) => pickStyle(rng, 'afrique'), 'style');
    const latine = many(5000, (rng) => pickStyle(rng, 'latine'), 'style');
    expect(afrique.filter((s) => s === 'afro').length / 5000).toBeGreaterThan(0.5);
    expect(latine.filter((s) => s === 'latino').length / 5000).toBeGreaterThan(0.5);
  });
});

describe('noms de scène', () => {
  it('sont déterministes pour une même graine', () => {
    const a = many(50, (rng) => generateStageName(rng, 'urbain'), 'det');
    const b = many(50, (rng) => generateStageName(rng, 'urbain'), 'det');
    expect(a).toEqual(b);
  });

  it("ne produisent jamais un nom de la liste d'exclusion (30 000 tirages)", () => {
    for (const style of STYLES) {
      for (const name of many(7500, (rng) => generateStageName(rng, style), `excl-${style}`)) {
        expect(isExcluded(name)).toBe(false);
      }
    }
  });

  it("sont propres : majuscule initiale, pas d'espace en trop, longueur raisonnable (propriété)", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 8 }), fc.constantFrom(...STYLES), (seed, style) => {
        const rng = Rng.fromSeed(seed);
        for (let i = 0; i < 20; i += 1) {
          const name = generateStageName(rng, style);
          if (name.length < 2 || name.length > 26) return false;
          if (name !== name.trim() || name.includes('  ')) return false;
          if (name.charAt(0) !== name.charAt(0).toUpperCase()) return false;
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("sont variés : au moins 85 % de noms distincts sur 1 000 tirages (ordre de grandeur d'une partie)", () => {
    for (const style of STYLES) {
      const names = many(1000, (rng) => generateStageName(rng, style), `var-${style}`);
      expect(new Set(names).size / 1000).toBeGreaterThan(0.85);
    }
  });

  it('accordent les adjectifs des noms composés', () => {
    const composed = many(4000, (rng) => generateStageName(rng, 'pop'), 'accord').filter((n) =>
      / (Noir|Noire|Doux|Douce|Fou|Folle)$/.test(n),
    );
    expect(composed.length).toBeGreaterThan(5);
    for (const name of composed) {
      expect(name).not.toMatch(
        /^(Brume|Cendre|Marée|Fumée|Sirène|Lueur|Neige|Braise|Comète|Aurore) (Noir|Doux|Fou)$/,
      );
      expect(name).not.toMatch(
        /^(Velours|Orage|Mirage|Écho|Phare|Rivage|Satin|Cobalt|Safran|Granit) (Noire|Douce|Folle)$/,
      );
    }
  });

  it("utilisent l'état civil fourni pour les noms qui en dérivent", () => {
    const real = { prenom: 'Léa', nom: 'Dubois', origin: 'france' as const };
    const names = many(3000, (rng) => generateStageName(rng, 'pop', real), 'civil');
    expect(names).toContain('Léa');
    expect(names).toContain('Léa D.');
  });
});

describe('villes et labels', () => {
  it('génèrent des villes fictives, jamais une ville réelle de la liste', () => {
    for (const name of many(10000, generateCityName, 'villes')) {
      expect(isExcluded(name)).toBe(false);
      expect(name.length).toBeLessThan(30);
    }
  });

  it('génèrent des villes variées', () => {
    expect(new Set(many(2000, generateCityName, 'villes2')).size).toBeGreaterThan(150);
  });

  it('génèrent des noms de label hors liste, variés et bien formés', () => {
    const labels = many(5000, generateLabelName, 'labels');
    for (const name of labels) {
      expect(isExcluded(name)).toBe(false);
      expect(name).toBe(name.trim());
      expect(name.charAt(0)).toBe(name.charAt(0).toUpperCase());
    }
    expect(new Set(labels).size).toBeGreaterThan(300);
  });

  it('un duo de label ne répète pas le même mot', () => {
    for (const name of many(3000, generateLabelName, 'duo')) {
      const [a, , b] = name.split(' ');
      if (name.includes(' & ') || name.includes(' et ')) expect(a).not.toBe(b);
    }
  });
});

describe('unicité', () => {
  it('évite les noms déjà pris (formes normalisées)', () => {
    const rng = Rng.fromSeed('uniq');
    const taken = new Set<string>();
    for (let i = 0; i < 300; i += 1) {
      const name = uniqueName(() => generateStageName(rng, 'urbain'), taken);
      expect(taken.has(normalizeForCompare(name))).toBe(false);
      taken.add(normalizeForCompare(name));
    }
    expect(taken.size).toBe(300);
  });

  it('numérote quand tout est pris, et refuse quand même la numérotation est épuisée', () => {
    const taken = new Set([normalizeForCompare('Zaro')]);
    expect(uniqueName(() => 'Zaro', taken)).toBe('Zaro II');
    taken.add(normalizeForCompare('Zaro II'));
    expect(uniqueName(() => 'Zaro', taken)).toBe('Zaro III');
    const all = new Set(
      [
        'Zaro',
        'Zaro II',
        'Zaro III',
        'Zaro IV',
        'Zaro V',
        'Zaro VI',
        'Zaro VII',
        'Zaro VIII',
        'Zaro IX',
        'Zaro X',
      ].map(normalizeForCompare),
    );
    expect(() => uniqueName(() => 'Zaro', all)).toThrow(RangeError);
  });

  it("écarte un nom exclu même s'il est libre", () => {
    const rng = Rng.fromSeed('x');
    let calls = 0;
    const name = uniqueName(
      () => (calls++ < 3 ? 'Beyoncé' : generateStageName(rng, 'pop')),
      new Set(),
    );
    expect(isExcluded(name)).toBe(false);
  });
});

describe('noms détournés', () => {
  it('piochent des clins d’œil déformés, sans jamais retomber sur un nom exclu', () => {
    const noms = many(400, (rng) => generateStageName(rng, 'pop'), 'parodies');
    expect(noms.some((n) => TOUS_LES_NOMS_DETOURNES.includes(n))).toBe(true);
    for (const n of TOUS_LES_NOMS_DETOURNES) expect(isExcluded(n)).toBe(false);
  });
});
