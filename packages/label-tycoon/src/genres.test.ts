import { hashState } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  GENRES,
  GENRE_IDS,
  MARKET,
  fr,
  genreKeys,
  initialCredibility,
  initialMarket,
  newGame,
  trendMultiplier,
} from './index';

describe('genres de départ', () => {
  it('sont dix, uniques, et chacun a sa définition et son nom affichable', () => {
    expect(GENRE_IDS).toHaveLength(10);
    expect(new Set(GENRE_IDS).size).toBe(10);
    for (const id of GENRE_IDS) {
      expect(GENRES[id].id).toBe(id);
      expect(fr.genres[id].length).toBeGreaterThan(0);
    }
  });

  it('ont des paramètres cohérents', () => {
    for (const id of GENRE_IDS) {
      const g = GENRES[id];
      expect(g.audience).toBeGreaterThan(0);
      expect(g.popularite).toBeGreaterThanOrEqual(0);
      expect(g.popularite).toBeLessThanOrEqual(100);
      expect(g.moyenne).toBeGreaterThanOrEqual(0);
      expect(g.moyenne).toBeLessThanOrEqual(100);
      expect(g.volatilite).toBeGreaterThan(0);
      expect(g.poidsPlume).toBeGreaterThan(0);
      expect(g.poidsPlume).toBeLessThan(1);
      expect(['flow', 'voix', 'mixte']).toContain(g.vocal);
      expect(fr.famillesDeGenre[g.famille]).toBeDefined();
    }
  });

  it('couvrent plusieurs familles musicales', () => {
    expect(new Set(GENRE_IDS.map((id) => GENRES[id].famille)).size).toBeGreaterThanOrEqual(4);
  });

  it('ont des noms affichables tous différents', () => {
    const names = GENRE_IDS.map((id) => fr.genres[id]);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('tendance du genre', () => {
  it('vaut 0,5 à 0, 1 à 50 et 1,5 à 100', () => {
    expect(trendMultiplier(0)).toBe(MARKET.trendMin);
    expect(trendMultiplier(50)).toBe(1);
    expect(trendMultiplier(100)).toBe(MARKET.trendMax);
    expect(trendMultiplier(25)).toBe(0.75);
    expect(trendMultiplier(75)).toBe(1.25);
  });

  it('reste dans [0,5 ; 1,5] et ne décroît jamais (propriété)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 150, noNaN: true }),
        fc.double({ min: -50, max: 150, noNaN: true }),
        (a, b) => {
          const [low, high] = a <= b ? [a, b] : [b, a];
          const tl = trendMultiplier(low);
          const th = trendMultiplier(high);
          return tl >= 0.5 && th <= 1.5 && tl <= th;
        },
      ),
    );
  });

  it('borne les popularités hors échelle', () => {
    expect(trendMultiplier(-10)).toBe(0.5);
    expect(trendMultiplier(250)).toBe(1.5);
  });
});

describe('marché de départ', () => {
  it('initialise chaque genre avec sa popularité et son audience', () => {
    const market = initialMarket();
    expect(genreKeys(market)).toEqual([...GENRE_IDS].sort());
    for (const id of GENRE_IDS) {
      expect(market.genres[id]).toEqual({
        popularite: GENRES[id].popularite,
        audience: GENRES[id].audience,
      });
    }
  });

  it('initialise la crédibilité du label à zéro dans chaque genre', () => {
    const credibility = initialCredibility();
    expect(Object.keys(credibility).sort()).toEqual([...GENRE_IDS].sort());
    expect(Object.values(credibility).every((c) => c === 0)).toBe(true);
  });

  it("est présent dans l'état d'une nouvelle partie, et sérialisable", () => {
    const { engine } = newGame('marche');
    expect(Object.keys(engine.data.marche.genres)).toHaveLength(10);
    expect(Object.keys(engine.data.label.credibilite)).toHaveLength(10);
    expect(() => hashState(engine)).not.toThrow();
  });

  it('ne partage pas de référence entre deux parties', () => {
    const a = newGame('m');
    const b = newGame('m');
    const rap = a.engine.data.marche.genres['rap'];
    if (rap) rap.popularite = 1;
    expect(b.engine.data.marche.genres['rap']?.popularite).toBe(GENRES.rap.popularite);
  });
});
