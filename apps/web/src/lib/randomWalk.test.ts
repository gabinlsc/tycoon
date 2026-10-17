import { describe, expect, it } from 'vitest';
import { mulberry32 } from './prng';
import { seededHistory, stepPrice } from './randomWalk';

describe('marche aléatoire', () => {
  it('est reproductible pour une même graine', () => {
    expect(seededHistory(42, 100, 0.02, 30)).toEqual(seededHistory(42, 100, 0.02, 30));
  });

  it('diffère selon la graine', () => {
    expect(seededHistory(1, 100, 0.02, 30)).not.toEqual(seededHistory(2, 100, 0.02, 30));
  });

  it("reste strictement positif et proche de son point d'ancrage", () => {
    const rand = mulberry32(7);
    let price = 20;
    for (let i = 0; i < 5000; i += 1) {
      price = stepPrice(price, 20, 0.03, rand);
      expect(price).toBeGreaterThan(0);
    }
    expect(price).toBeGreaterThan(5);
    expect(price).toBeLessThan(80);
  });
});
