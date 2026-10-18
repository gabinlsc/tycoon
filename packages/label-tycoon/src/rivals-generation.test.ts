import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  GENRE_IDS,
  PERSONALITIES,
  PERSONALITY_IDS,
  RIVALS,
  defaultConfig,
  generateRival,
  generateRivals,
  initialState,
  newGame,
} from './index';

describe('génération des rivaux', () => {
  it('produit 3 à 5 rivaux, uniques, déterministes, avec personnalité et genre fétiche', () => {
    const counts = new Set<number>();
    for (let i = 0; i < 60; i += 1) {
      const rivals = generateRivals(Rng.fromSeed(`g${i}`), GENRE_IDS);
      counts.add(rivals.length);
      expect(rivals.length).toBeGreaterThanOrEqual(RIVALS.count.min);
      expect(rivals.length).toBeLessThanOrEqual(RIVALS.count.max);
      expect(new Set(rivals.map((r) => r.nom)).size).toBe(rivals.length);
      expect(new Set(rivals.map((r) => r.id)).size).toBe(rivals.length);
      for (const r of rivals) {
        expect(PERSONALITY_IDS).toContain(r.personnalite);
        expect(GENRE_IDS).toContain(r.genreFetiche as never);
        expect(r.style).toBe(PERSONALITIES[r.personnalite].style);
        expect(r.tresorerie).toBeGreaterThan(0);
      }
    }
    expect(counts.size).toBeGreaterThan(1);
    expect(generateRivals(Rng.fromSeed('x'), GENRE_IDS)).toEqual(
      generateRivals(Rng.fromSeed('x'), GENRE_IDS),
    );
  });

  it('la trésorerie dépend de la personnalité, le bonus de difficulté la relève', () => {
    const base = (p: (typeof PERSONALITY_IDS)[number]) => {
      for (let i = 0; i < 200; i += 1) {
        const r = generateRival(Rng.fromSeed(`p${i}`), 1, GENRE_IDS, 0);
        if (r.personnalite === p) return r.tresorerie;
      }
      throw new Error('personnalité introuvable');
    };
    expect(base('major')).toBeGreaterThan(base('declin'));
    const plain = generateRival(Rng.fromSeed('b'), 1, GENRE_IDS, 0);
    const boosted = generateRival(Rng.fromSeed('b'), 1, GENRE_IDS, 0.5);
    expect(boosted.tresorerie).toBeGreaterThan(plain.tresorerie);
  });

  it('suit le bonus de trésorerie réglé dans la difficulté', () => {
    const config = defaultConfig();
    const low = initialState('d', config).rivaux;
    config.difficulty.rivalCashBonus = 1;
    const high = initialState('d', config).rivaux;
    expect(high[0]?.tresorerie).toBeGreaterThan(low[0]?.tresorerie ?? 0);
    expect(newGame('d').engine.data.rivaux.length).toBeGreaterThanOrEqual(3);
  });
});
